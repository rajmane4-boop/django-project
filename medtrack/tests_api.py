"""
Smart MedTrack — RESTful API Integration Test Suite

Verifies JSON API endpoints mounted under /api/ for the React 19 frontend:
Authentication, Intake Dashboard, Atomic Dose Actions, Caregiver Live Portal,
Frictionless Token-based Acknowledgment, and Clinical Report Exports.
"""
import json
from decimal import Decimal
from datetime import time, timedelta

from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone

from medtrack.models import (
    PatientProfile,
    PatientRoutine,
    Medication,
    Regimen,
    DoseEvent,
    CaregiverContact,
)
from medtrack.services.acknowledgment import generate_ack_token


class RestApiIntegrationTestCase(TestCase):
    """Integration test suite for React REST API endpoints."""

    def setUp(self):
        self.client = Client()
        self.password = 'securepass123'
        self.user = User.objects.create_user(
            username='apipatient',
            password=self.password,
            first_name='Ananya',
            last_name='Deshmukh',
            email='ananya@example.com',
        )
        self.profile = PatientProfile.objects.create(
            user=self.user,
            timezone='Asia/Kolkata',
            emergency_phone='+91 98765 43210',
            primary_physician='Dr. V. Joshi, MD',
        )
        self.routine = PatientRoutine.objects.create(
            patient=self.profile,
            breakfast_time=time(8, 0),
            lunch_time=time(13, 0),
            dinner_time=time(20, 0),
            bedtime=time(22, 30),
        )
        self.medication = Medication.objects.create(
            patient=self.profile,
            name='Atorvastatin 20mg',
            dosage_unit='TABLETS',
            current_stock=Decimal('30.00'),
            reorder_threshold=10,
            lead_time_days=4,
        )
        self.regimen = Regimen.objects.create(
            patient=self.profile,
            medication=self.medication,
            dose_quantity=Decimal('1.00'),
            anchor='DINNER',
            offset_minutes=30,
            frequency='DAILY',
            is_active=True,
        )
        self.caregiver = CaregiverContact.objects.create(
            patient=self.profile,
            name='Kavita Deshmukh',
            relationship='DAUGHTER',
            phone_number='+91 91234 56789',
            email='kavita@example.com',
            priority_tier=1,
            is_active=True,
        )

    def test_api_csrf_endpoint(self):
        """Ensure /api/auth/csrf/ returns a valid CSRF token."""
        response = self.client.get('/api/auth/csrf/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('csrfToken', data)
        self.assertTrue(len(data['csrfToken']) > 0)

    def test_api_login_and_me_lifecycle(self):
        """Verify login sets session cookie and /api/auth/me/ reflects logged in user."""
        login_res = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'apipatient', 'password': self.password}),
            content_type='application/json',
        )
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn('user', login_data)
        self.assertEqual(login_data['user']['username'], 'apipatient')

        me_res = self.client.get('/api/auth/me/')
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertTrue(me_data['authenticated'])
        self.assertEqual(me_data['user']['username'], 'apipatient')

    def test_api_dashboard_payload(self):
        """Verify /api/dashboard/ returns telemetry stats and dose arrays."""
        self.client.login(username='apipatient', password=self.password)

        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('stats', data)
        self.assertIn('doses', data)
        self.assertIn('adherence', data['stats'])

    def test_api_dose_take_atomically_decrements_stock(self):
        """Verify /api/doses/<id>/take/ changes status to TAKEN and reduces stock."""
        self.client.login(username='apipatient', password=self.password)

        dose = DoseEvent.objects.create(
            regimen=self.regimen,
            medication=self.medication,
            scheduled_time=timezone.now(),
            status='SCHEDULED',
        )

        initial_stock = self.medication.current_stock
        res = self.client.post(f'/api/doses/{dose.id}/take/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['dose']['status'], 'TAKEN')

        self.medication.refresh_from_db()
        self.assertEqual(self.medication.current_stock, initial_stock - Decimal('1.00'))

    def test_api_dose_skip(self):
        """Verify /api/doses/<id>/skip/ transitions status without modifying inventory."""
        self.client.login(username='apipatient', password=self.password)

        dose = DoseEvent.objects.create(
            regimen=self.regimen,
            medication=self.medication,
            scheduled_time=timezone.now(),
            status='SCHEDULED',
        )

        initial_stock = self.medication.current_stock
        res = self.client.post(f'/api/doses/{dose.id}/skip/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['dose']['status'], 'SKIPPED')

        self.medication.refresh_from_db()
        self.assertEqual(self.medication.current_stock, initial_stock)

    def test_api_medication_crud(self):
        """Verify medication creation and retrieval via /api/medications/."""
        self.client.login(username='apipatient', password=self.password)

        payload = {
            'name': 'Metoprolol Tartrate 25mg',
            'dosageUnit': 'TABLETS',
            'currentStock': 60,
            'reorderThreshold': 15,
            'leadTimeDays': 5,
        }
        create_res = self.client.post(
            '/api/medications/',
            data=json.dumps(payload),
            content_type='application/json',
        )
        self.assertEqual(create_res.status_code, 201)
        self.assertTrue(create_res.json()['success'])

        list_res = self.client.get('/api/medications/')
        self.assertEqual(list_res.status_code, 200)
        names = [m['name'] for m in list_res.json()['medications']]
        self.assertIn('Metoprolol Tartrate 25mg', names)

    def test_api_frictionless_caregiver_ack(self):
        """Verify one-click token verification and actioning without patient login."""
        dose = DoseEvent.objects.create(
            regimen=self.regimen,
            medication=self.medication,
            scheduled_time=timezone.now() - timedelta(minutes=45),
            status='MISSED',
        )
        token = generate_ack_token(dose, self.caregiver)

        # GET details with token
        get_res = self.client.get(f'/api/caregiver/ack/{token}/')
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.json()
        self.assertTrue(get_data['valid'])
        self.assertEqual(get_data['patient']['name'], 'Ananya Deshmukh')
        self.assertEqual(get_data['dose']['medicationName'], 'Atorvastatin 20mg')

        # POST action: caregiver assisted & took dose
        post_res = self.client.post(
            f'/api/caregiver/ack/{token}/',
            data=json.dumps({'action': 'assisted_taken'}),
            content_type='application/json',
        )
        self.assertEqual(post_res.status_code, 200)
        post_data = post_res.json()
        self.assertTrue(post_data['success'])

        dose.refresh_from_db()
        self.assertIn(dose.status, ('TAKEN', 'TAKEN_LATE'))

    def test_api_reports_endpoints(self):
        """Verify adherence audit and requisition purchase order report APIs."""
        self.client.login(username='apipatient', password=self.password)

        adh_res = self.client.get('/api/reports/adherence/?days=30')
        self.assertEqual(adh_res.status_code, 200)
        adh_data = adh_res.json()
        self.assertIn('totalDoses', adh_data)
        self.assertIn('medStats', adh_data)
        self.assertIn('patient', adh_data)

        req_res = self.client.get('/api/reports/requisition/?days=30&all=1')
        self.assertEqual(req_res.status_code, 200)
        req_data = req_res.json()
        self.assertIn('items', req_data)
        self.assertIn('itemCount', req_data)

