"""
Smart MedTrack — Multi-Threaded Concurrency & Race-Condition Stress Tests

Validates row-level locking (select_for_update) and atomic transactional integrity
under simulated high-concurrency double-click and multi-device scenarios.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal
from datetime import time, timedelta
import time as pytime

from django.test import TransactionTestCase
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import connection
from django.db.utils import OperationalError

from medtrack.models import PatientProfile, PatientRoutine, Medication, Regimen, DoseEvent
from medtrack.services.inventory import record_dose_taken


class ConcurrencyStressTestCase(TransactionTestCase):
    """
    Stress test concurrency and idempotency of dose recording using TransactionTestCase.
    TransactionTestCase ensures actual database transactions and locks are executed.
    """

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            username='concurrency_test_patient',
            password='password123',
            first_name='Concurrent',
            last_name='Patient',
        )
        self.profile = PatientProfile.objects.create(
            user=self.user,
            timezone='UTC',
        )
        self.routine = PatientRoutine.objects.create(
            patient=self.profile,
            breakfast_time=time(8, 0),
            lunch_time=time(13, 0),
            dinner_time=time(20, 0),
            bedtime=time(22, 0),
        )
        self.medication = Medication.objects.create(
            patient=self.profile,
            name='Metformin Concurrency Lab',
            dosage_unit='TABLET',
            current_stock=Decimal('10.00'),
            reorder_threshold=Decimal('5.00'),
            lead_time_days=3,
        )
        self.regimen = Regimen.objects.create(
            patient=self.profile,
            medication=self.medication,
            dose_quantity=Decimal('1.00'),
            anchor='BREAKFAST',
            offset_minutes=0,
            frequency='DAILY',
            is_active=True,
        )

    def test_concurrent_double_clicks_decrement_stock_exactly_once(self):
        """
        Simulate concurrent worker threads firing simultaneously on the exact same DoseEvent.
        select_for_update() and idempotency check must ensure stock decrements EXACTLY ONCE.
        """
        scheduled_time = timezone.now() - timedelta(minutes=5)
        dose = DoseEvent.objects.create(
            regimen=self.regimen,
            medication=self.medication,
            scheduled_time=scheduled_time,
            status='SCHEDULED',
        )

        initial_stock = self.medication.current_stock
        num_threads = 5

        def worker_take(dose_id):
            max_retries = 15
            for attempt in range(max_retries):
                try:
                    connection.close()
                    event = DoseEvent.objects.get(pk=dose_id)
                    return record_dose_taken(event)
                except OperationalError as err:
                    if 'locked' in str(err).lower() and attempt < max_retries - 1:
                        pytime.sleep(0.08 * (attempt + 1))
                        continue
                    raise

        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker_take, dose.id) for _ in range(num_threads)]
            results = [f.result() for f in as_completed(futures)]

        self.assertEqual(len(results), num_threads)

        # Refresh from database
        self.medication.refresh_from_db()
        dose.refresh_from_db()

        # Final dose status must be TAKEN
        self.assertIn(dose.status, ('TAKEN', 'TAKEN_LATE'))
        self.assertIsNotNone(dose.taken_at)

        # Stock must have decremented by EXACTLY 1.00 unit (10.00 - 1.00 = 9.00), NEVER multiple times!
        expected_stock = initial_stock - self.regimen.dose_quantity
        self.assertEqual(self.medication.current_stock, expected_stock)

    def test_zero_stock_floor_under_concurrent_depletion(self):
        """
        Ensure stock never drops into negative numbers even when intake quantity equals available stock.
        """
        self.medication.current_stock = Decimal('1.00')
        self.medication.save()

        dose = DoseEvent.objects.create(
            regimen=self.regimen,
            medication=self.medication,
            scheduled_time=timezone.now(),
            status='SCHEDULED',
        )

        num_threads = 4

        def worker_take(dose_id):
            max_retries = 15
            for attempt in range(max_retries):
                try:
                    connection.close()
                    event = DoseEvent.objects.get(pk=dose_id)
                    return record_dose_taken(event)
                except OperationalError as err:
                    if 'locked' in str(err).lower() and attempt < max_retries - 1:
                        pytime.sleep(0.08 * (attempt + 1))
                        continue
                    raise

        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker_take, dose.id) for _ in range(num_threads)]
            [f.result() for f in as_completed(futures)]

        self.medication.refresh_from_db()
        self.assertEqual(self.medication.current_stock, Decimal('0.00'))
        self.assertGreaterEqual(self.medication.current_stock, Decimal('0.00'))

    def test_idempotent_intake_resolution_on_already_taken_dose(self):
        """
        Subsequent calls to an already-taken dose must return without modifying stock.
        """
        dose = DoseEvent.objects.create(
            regimen=self.regimen,
            medication=self.medication,
            scheduled_time=timezone.now(),
            status='TAKEN',
            taken_at=timezone.now(),
        )

        original_stock = self.medication.current_stock
        res = record_dose_taken(dose)

        self.medication.refresh_from_db()
        self.assertEqual(res.status, 'TAKEN')
        self.assertEqual(self.medication.current_stock, original_stock)

