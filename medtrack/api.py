"""
Smart MedTrack — RESTful JSON API Layer for React Frontend
Exposes the core models and clinical services without altering the underlying backend engine.
"""
import json
import logging
from datetime import time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import (
    CaregiverContact,
    DoseEvent,
    Medication,
    PatientProfile,
    PatientRoutine,
    Regimen,
)
from .services.acknowledgment import (
    generate_ack_token,
    generate_portal_token,
    verify_ack_token,
    verify_portal_token,
)
from .services.inventory import (
    calculate_burn_rate,
    calculate_days_remaining,
    check_reorder_needed,
    record_dose_taken,
)
from .services.reports import (
    generate_adherence_report_data,
    generate_requisition_manifest_data,
)
from .services.scheduling import generate_daily_dose_events

logger = logging.getLogger(__name__)


def _parse_body(request):
    """Safely parse JSON request body."""
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


def _get_patient_profile(user):
    """Resolve or create PatientProfile for authenticated user."""
    profile, _ = PatientProfile.objects.get_or_create(user=user)
    return profile


# ──────────────────────────────────────────────
# CSRF & Auth Endpoints
# ──────────────────────────────────────────────

@ensure_csrf_cookie
def api_csrf(request):
    """Return CSRF token for the frontend to include in POST/PUT/DELETE requests."""
    return JsonResponse({'csrfToken': get_token(request)})


def api_login(request):
    """Authenticate and log in patient / caregiver."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    data = _parse_body(request)
    username = data.get('username') or request.POST.get('username')
    password = data.get('password') or request.POST.get('password')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid username or password'}, status=401)

    login(request, user)
    profile, _ = PatientProfile.objects.get_or_create(user=user)
    routine, _ = PatientRoutine.objects.get_or_create(patient=profile)

    return JsonResponse({
        'user': {
            'id': user.id,
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'fullName': user.get_full_name() or user.username,
            'email': user.email,
            'timezone': profile.timezone,
            'emergencyPhone': profile.emergency_phone,
            'primaryPhysician': profile.primary_physician,
        }
    })


def api_register(request):
    """Register a new patient user, initialize profile & routine."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    data = _parse_body(request)
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username already taken'}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    profile = PatientProfile.objects.create(user=user)
    PatientRoutine.objects.create(patient=profile)

    login(request, user)

    return JsonResponse({
        'user': {
            'id': user.id,
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'fullName': user.get_full_name() or user.username,
            'email': user.email,
            'timezone': profile.timezone,
        }
    }, status=201)


def api_logout(request):
    """Log out current session."""
    logout(request)
    return JsonResponse({'success': True})


def api_me(request):
    """Return currently authenticated user profile or unauthenticated status."""
    if not request.user.is_authenticated:
        return JsonResponse({'authenticated': False, 'user': None})

    profile = _get_patient_profile(request.user)
    routine, _ = PatientRoutine.objects.get_or_create(patient=profile)

    return JsonResponse({
        'authenticated': True,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'firstName': request.user.first_name,
            'lastName': request.user.last_name,
            'fullName': request.user.get_full_name() or request.user.username,
            'email': request.user.email,
            'timezone': profile.timezone,
            'emergencyPhone': profile.emergency_phone,
            'primaryPhysician': profile.primary_physician,
            'routine': {
                'breakfastTime': routine.breakfast_time.strftime('%H:%M'),
                'lunchTime': routine.lunch_time.strftime('%H:%M'),
                'dinnerTime': routine.dinner_time.strftime('%H:%M'),
                'bedtime': routine.bedtime.strftime('%H:%M'),
            }
        }
    })


# ──────────────────────────────────────────────
# Profile & Routine
# ──────────────────────────────────────────────

def api_profile(request):
    """GET or PUT patient profile & routine anchor configuration."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    routine, _ = PatientRoutine.objects.get_or_create(patient=profile)

    if request.method == 'GET':
        return JsonResponse({
            'timezone': profile.timezone,
            'emergencyPhone': profile.emergency_phone,
            'primaryPhysician': profile.primary_physician,
            'routine': {
                'breakfastTime': routine.breakfast_time.strftime('%H:%M'),
                'lunchTime': routine.lunch_time.strftime('%H:%M'),
                'dinnerTime': routine.dinner_time.strftime('%H:%M'),
                'bedtime': routine.bedtime.strftime('%H:%M'),
            }
        })

    elif request.method in ('PUT', 'POST'):
        data = _parse_body(request)
        if 'timezone' in data:
            profile.timezone = data['timezone']
        if 'emergencyPhone' in data:
            profile.emergency_phone = data['emergencyPhone']
        if 'primaryPhysician' in data:
            profile.primary_physician = data['primaryPhysician']
        profile.save()

        routine_data = data.get('routine', {})
        for field, attr in [
            ('breakfastTime', 'breakfast_time'),
            ('lunchTime', 'lunch_time'),
            ('dinnerTime', 'dinner_time'),
            ('bedtime', 'bedtime'),
        ]:
            if field in routine_data:
                try:
                    parts = [int(p) for p in routine_data[field].split(':')]
                    setattr(routine, attr, time(parts[0], parts[1]))
                except Exception:
                    pass
        routine.save()

        return JsonResponse({'success': True, 'message': 'Profile and routine updated'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ──────────────────────────────────────────────
# Dashboard & Intake Doses
# ──────────────────────────────────────────────

def api_dashboard(request):
    """
    Return today's intake dashboard telemetry:
      • Adherence statistics
      • Today's scheduled dose events
      • Active low-stock warnings
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    try:
        patient_tz = ZoneInfo(profile.timezone)
    except Exception:
        patient_tz = ZoneInfo('UTC')

    today = timezone.now().astimezone(patient_tz).date()

    # Auto-generate today's dose events
    generate_daily_dose_events(profile, today)

    day_start = timezone.datetime.combine(today, time.min, tzinfo=patient_tz)
    day_end = day_start + timedelta(days=1)

    events = (
        DoseEvent.objects
        .filter(
            regimen__patient=profile,
            scheduled_time__gte=day_start,
            scheduled_time__lt=day_end,
        )
        .select_related('medication', 'regimen')
        .order_by('scheduled_time')
    )

    total = events.count()
    taken = events.filter(status__in=['TAKEN', 'TAKEN_LATE']).count()
    pending = events.filter(status__in=['SCHEDULED', 'REMINDED']).count()
    missed = events.filter(status='MISSED').count()
    skipped = events.filter(status='SKIPPED').count()
    adherence = round((taken / total * 100) if total > 0 else 0)

    # Low-stock alerts
    low_stock_meds = []
    for med in Medication.objects.filter(patient=profile, is_active=True):
        if check_reorder_needed(med):
            low_stock_meds.append({
                'id': med.id,
                'name': med.name,
                'currentStock': float(med.current_stock),
                'dosageUnit': med.get_dosage_unit_display(),
                'daysRemaining': calculate_days_remaining(med),
                'leadTimeDays': med.lead_time_days,
            })

    dose_list = []
    for ev in events:
        local_time = ev.scheduled_time.astimezone(patient_tz)
        dose_list.append({
            'id': ev.id,
            'medicationName': ev.medication.name,
            'genericName': ev.medication.generic_name,
            'doseQuantity': float(ev.regimen.dose_quantity),
            'dosageUnit': ev.medication.get_dosage_unit_display(),
            'scheduledTime': local_time.isoformat(),
            'scheduledTimeDisplay': local_time.strftime('%I:%M %p'),
            'anchorDisplay': ev.regimen.get_anchor_display(),
            'offsetMinutes': ev.regimen.offset_minutes,
            'status': ev.status,
            'statusDisplay': ev.get_status_display(),
            'takenAt': ev.taken_at.astimezone(patient_tz).isoformat() if ev.taken_at else None,
            'notes': ev.notes,
            'isActionable': ev.is_actionable,
        })

    return JsonResponse({
        'today': today.isoformat(),
        'patientTz': str(patient_tz),
        'stats': {
            'total': total,
            'taken': taken,
            'pending': pending,
            'missed': missed,
            'skipped': skipped,
            'adherence': adherence,
        },
        'doses': dose_list,
        'lowStockMeds': low_stock_meds,
    })


def api_dose_take(request, pk):
    """Mark dose as taken (atomic stock decrement)."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    dose_event = get_object_or_404(
        DoseEvent.objects.select_related('medication', 'regimen', 'regimen__patient'),
        pk=pk,
        regimen__patient__user=request.user,
    )

    if dose_event.is_actionable:
        dose_event = record_dose_taken(dose_event)
        dose_event.refresh_from_db()

    profile = dose_event.regimen.patient
    try:
        patient_tz = ZoneInfo(profile.timezone)
    except Exception:
        patient_tz = ZoneInfo('UTC')

    return JsonResponse({
        'success': True,
        'dose': {
            'id': dose_event.id,
            'status': dose_event.status,
            'statusDisplay': dose_event.get_status_display(),
            'takenAt': dose_event.taken_at.astimezone(patient_tz).isoformat() if dose_event.taken_at else None,
            'currentStock': float(dose_event.medication.current_stock),
        }
    })


def api_dose_skip(request, pk):
    """Mark dose as skipped."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    dose_event = get_object_or_404(
        DoseEvent.objects.select_related('medication', 'regimen', 'regimen__patient'),
        pk=pk,
        regimen__patient__user=request.user,
    )

    if dose_event.is_actionable:
        dose_event.status = 'SKIPPED'
        dose_event.save()

    return JsonResponse({
        'success': True,
        'dose': {
            'id': dose_event.id,
            'status': dose_event.status,
            'statusDisplay': dose_event.get_status_display(),
        }
    })


# ──────────────────────────────────────────────
# Medication CRUD
# ──────────────────────────────────────────────

def api_medications(request):
    """List all medications or create a new medication."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)

    if request.method == 'GET':
        meds = Medication.objects.filter(patient=profile).order_by('name')
        results = []
        for m in meds:
            burn_rate = calculate_burn_rate(m)
            days_remaining = calculate_days_remaining(m)
            needs_reorder = check_reorder_needed(m)

            if days_remaining is not None and days_remaining > 0:
                max_days = max(days_remaining, m.reorder_threshold + m.lead_time_days + 10)
                stock_pct = min(100, int((days_remaining / max_days) * 100))
            elif m.current_stock > 0 and days_remaining is None:
                stock_pct = 100
            else:
                stock_pct = 0

            results.append({
                'id': m.id,
                'name': m.name,
                'genericName': m.generic_name,
                'dosageUnit': m.dosage_unit,
                'dosageUnitDisplay': m.get_dosage_unit_display(),
                'currentStock': float(m.current_stock),
                'reorderThreshold': m.reorder_threshold,
                'leadTimeDays': m.lead_time_days,
                'notes': m.notes,
                'isActive': m.is_active,
                'burnRate': float(burn_rate),
                'daysRemaining': days_remaining,
                'needsReorder': needs_reorder,
                'stockPct': stock_pct,
            })
        return JsonResponse({'medications': results})

    elif request.method == 'POST':
        data = _parse_body(request)
        name = data.get('name')
        dosage_unit = data.get('dosageUnit', 'TABLETS')
        if not name:
            return JsonResponse({'error': 'Medication name is required'}, status=400)

        med = Medication.objects.create(
            patient=profile,
            name=name,
            generic_name=data.get('genericName', ''),
            dosage_unit=dosage_unit,
            current_stock=Decimal(str(data.get('currentStock', 0))),
            reorder_threshold=int(data.get('reorderThreshold', 7)),
            lead_time_days=int(data.get('leadTimeDays', 3)),
            notes=data.get('notes', ''),
            is_active=data.get('isActive', True),
        )
        return JsonResponse({'success': True, 'id': med.id}, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


def api_medication_detail(request, pk):
    """Retrieve, update, or delete a medication."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    med = get_object_or_404(Medication, pk=pk, patient=profile)

    if request.method == 'GET':
        return JsonResponse({
            'id': med.id,
            'name': med.name,
            'genericName': med.generic_name,
            'dosageUnit': med.dosage_unit,
            'currentStock': float(med.current_stock),
            'reorderThreshold': med.reorder_threshold,
            'leadTimeDays': med.lead_time_days,
            'notes': med.notes,
            'isActive': med.is_active,
        })

    elif request.method in ('PUT', 'POST'):
        data = _parse_body(request)
        if 'name' in data:
            med.name = data['name']
        if 'genericName' in data:
            med.generic_name = data['genericName']
        if 'dosageUnit' in data:
            med.dosage_unit = data['dosageUnit']
        if 'currentStock' in data:
            med.current_stock = Decimal(str(data['currentStock']))
        if 'reorderThreshold' in data:
            med.reorder_threshold = int(data['reorderThreshold'])
        if 'leadTimeDays' in data:
            med.lead_time_days = int(data['leadTimeDays'])
        if 'notes' in data:
            med.notes = data['notes']
        if 'isActive' in data:
            med.is_active = data['isActive']
        med.save()
        return JsonResponse({'success': True, 'message': 'Medication updated'})

    elif request.method == 'DELETE':
        med.delete()
        return JsonResponse({'success': True, 'message': 'Medication deleted'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ──────────────────────────────────────────────
# Regimens CRUD
# ──────────────────────────────────────────────

def api_regimens(request):
    """List regimens or create a new regimen."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)

    if request.method == 'GET':
        regimens = Regimen.objects.filter(patient=profile).select_related('medication')
        results = []
        for r in regimens:
            results.append({
                'id': r.id,
                'medicationId': r.medication.id,
                'medicationName': r.medication.name,
                'dosageUnit': r.medication.dosage_unit,
                'dosageUnitDisplay': r.medication.get_dosage_unit_display(),
                'doseQuantity': float(r.dose_quantity),
                'anchor': r.anchor,
                'anchorDisplay': r.get_anchor_display(),
                'offsetMinutes': r.offset_minutes,
                'fixedTime': r.fixed_time.strftime('%H:%M') if r.fixed_time else None,
                'frequency': r.frequency,
                'frequencyDisplay': r.get_frequency_display(),
                'specificDays': r.specific_days,
                'isActive': r.is_active,
            })
        return JsonResponse({'regimens': results})

    elif request.method == 'POST':
        data = _parse_body(request)
        med_id = data.get('medicationId')
        medication = get_object_or_404(Medication, pk=med_id, patient=profile)

        fixed_time_val = None
        if data.get('fixedTime'):
            try:
                parts = [int(p) for p in data['fixedTime'].split(':')]
                fixed_time_val = time(parts[0], parts[1])
            except Exception:
                pass

        regimen = Regimen.objects.create(
            patient=profile,
            medication=medication,
            dose_quantity=Decimal(str(data.get('doseQuantity', 1))),
            anchor=data.get('anchor', 'BREAKFAST'),
            offset_minutes=int(data.get('offsetMinutes', 0)),
            fixed_time=fixed_time_val,
            frequency=data.get('frequency', 'DAILY'),
            specific_days=data.get('specificDays'),
            is_active=data.get('isActive', True),
        )
        return JsonResponse({'success': True, 'id': regimen.id}, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


def api_regimen_detail(request, pk):
    """Retrieve, update, or delete a regimen."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    regimen = get_object_or_404(Regimen, pk=pk, patient=profile)

    if request.method == 'GET':
        return JsonResponse({
            'id': regimen.id,
            'medicationId': regimen.medication.id,
            'medicationName': regimen.medication.name,
            'doseQuantity': float(regimen.dose_quantity),
            'anchor': regimen.anchor,
            'offsetMinutes': regimen.offset_minutes,
            'fixedTime': regimen.fixed_time.strftime('%H:%M') if regimen.fixed_time else None,
            'frequency': regimen.frequency,
            'specificDays': regimen.specific_days,
            'isActive': regimen.is_active,
        })

    elif request.method in ('PUT', 'POST'):
        data = _parse_body(request)
        if 'medicationId' in data:
            regimen.medication = get_object_or_404(Medication, pk=data['medicationId'], patient=profile)
        if 'doseQuantity' in data:
            regimen.dose_quantity = Decimal(str(data['doseQuantity']))
        if 'anchor' in data:
            regimen.anchor = data['anchor']
        if 'offsetMinutes' in data:
            regimen.offset_minutes = int(data['offsetMinutes'])
        if 'fixedTime' in data:
            if data['fixedTime']:
                parts = [int(p) for p in data['fixedTime'].split(':')]
                regimen.fixed_time = time(parts[0], parts[1])
            else:
                regimen.fixed_time = None
        if 'frequency' in data:
            regimen.frequency = data['frequency']
        if 'specificDays' in data:
            regimen.specific_days = data['specificDays']
        if 'isActive' in data:
            regimen.is_active = data['isActive']
        regimen.save()
        return JsonResponse({'success': True, 'message': 'Regimen updated'})

    elif request.method == 'DELETE':
        regimen.delete()
        return JsonResponse({'success': True, 'message': 'Regimen deleted'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ──────────────────────────────────────────────
# Caregivers CRUD
# ──────────────────────────────────────────────

def api_caregivers(request):
    """List or create caregiver contacts."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)

    if request.method == 'GET':
        contacts = CaregiverContact.objects.filter(patient=profile).order_by('priority_tier', 'name')
        results = []
        for c in contacts:
            results.append({
                'id': c.id,
                'name': c.name,
                'relationship': c.relationship,
                'relationshipDisplay': c.get_relationship_display(),
                'phoneNumber': c.phone_number,
                'email': c.email,
                'priorityTier': c.priority_tier,
                'isActive': c.is_active,
            })
        return JsonResponse({'caregivers': results})

    elif request.method == 'POST':
        data = _parse_body(request)
        name = data.get('name')
        phone = data.get('phoneNumber')
        if not name or not phone:
            return JsonResponse({'error': 'Name and phone number are required'}, status=400)

        caregiver = CaregiverContact.objects.create(
            patient=profile,
            name=name,
            relationship=data.get('relationship', 'OTHER'),
            phone_number=phone,
            email=data.get('email', ''),
            priority_tier=int(data.get('priorityTier', 1)),
            is_active=data.get('isActive', True),
        )
        return JsonResponse({'success': True, 'id': caregiver.id}, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


def api_caregiver_detail(request, pk):
    """Retrieve, update, or delete a caregiver contact."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    contact = get_object_or_404(CaregiverContact, pk=pk, patient=profile)

    if request.method == 'GET':
        return JsonResponse({
            'id': contact.id,
            'name': contact.name,
            'relationship': contact.relationship,
            'phoneNumber': contact.phone_number,
            'email': contact.email,
            'priorityTier': contact.priority_tier,
            'isActive': contact.is_active,
        })

    elif request.method in ('PUT', 'POST'):
        data = _parse_body(request)
        if 'name' in data:
            contact.name = data['name']
        if 'relationship' in data:
            contact.relationship = data['relationship']
        if 'phoneNumber' in data:
            contact.phone_number = data['phoneNumber']
        if 'email' in data:
            contact.email = data['email']
        if 'priorityTier' in data:
            contact.priority_tier = int(data['priorityTier'])
        if 'isActive' in data:
            contact.is_active = data['isActive']
        contact.save()
        return JsonResponse({'success': True, 'message': 'Caregiver updated'})

    elif request.method == 'DELETE':
        contact.delete()
        return JsonResponse({'success': True, 'message': 'Caregiver deleted'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ──────────────────────────────────────────────
# Dedicated Caregiver Live Portal (Phase 3)
# ──────────────────────────────────────────────

def api_caregiver_portal(request):
    """
    Caregiver Live Portal Telemetry API:
    Consolidates all patients assigned to the caregiver in real time.
    """
    caregiver_id = request.GET.get('caregiver_id')
    caregiver_qs = CaregiverContact.objects.filter(is_active=True).select_related('patient', 'patient__user')

    active_caregivers = []
    current_caregiver = None

    if request.user.is_authenticated:
        user_caregivers = caregiver_qs.filter(
            Q(user=request.user) | Q(email__iexact=request.user.email)
        )
        if user_caregivers.exists():
            active_caregivers = list(user_caregivers)
        else:
            patient_caregivers = caregiver_qs.filter(patient__user=request.user)
            if patient_caregivers.exists():
                active_caregivers = list(patient_caregivers)

    if caregiver_id:
        try:
            current_caregiver = caregiver_qs.get(pk=int(caregiver_id))
            if current_caregiver not in active_caregivers:
                active_caregivers.insert(0, current_caregiver)
        except Exception:
            pass

    if not active_caregivers and not current_caregiver:
        all_contacts = list(caregiver_qs.all()[:10])
        active_caregivers = all_contacts
        if active_caregivers:
            current_caregiver = active_caregivers[0]
    elif not current_caregiver and active_caregivers:
        current_caregiver = active_caregivers[0]

    if current_caregiver:
        if current_caregiver.email:
            matched = caregiver_qs.filter(email__iexact=current_caregiver.email)
        else:
            matched = caregiver_qs.filter(name__iexact=current_caregiver.name)
        if not matched.exists():
            matched = [current_caregiver]
        patients = list({c.patient for c in matched})
    else:
        patients = list({c.patient for c in active_caregivers})

    patient_monitors = []
    global_alerts = []
    now = timezone.now()

    for patient in patients:
        try:
            pt_tz = ZoneInfo(patient.timezone)
        except Exception:
            pt_tz = ZoneInfo('UTC')

        pt_today = now.astimezone(pt_tz).date()
        generate_daily_dose_events(patient, pt_today)

        day_start = timezone.datetime.combine(pt_today, time.min, tzinfo=pt_tz)
        day_end = day_start + timedelta(days=1)

        doses = (
            DoseEvent.objects
            .filter(
                regimen__patient=patient,
                scheduled_time__gte=day_start,
                scheduled_time__lt=day_end,
            )
            .select_related('medication', 'regimen')
            .order_by('scheduled_time')
        )

        total_doses = doses.count()
        taken_count = doses.filter(status__in=['TAKEN', 'TAKEN_LATE']).count()
        missed_count = doses.filter(status='MISSED').count()
        pending_count = doses.filter(status__in=['SCHEDULED', 'REMINDED']).count()
        adherence_pct = round((taken_count / total_doses * 100) if total_doses > 0 else 0)

        # Alerts
        for missed_dose in doses.filter(status='MISSED'):
            global_alerts.append({
                'doseId': missed_dose.id,
                'patientName': patient.user.get_full_name() or patient.user.username,
                'medicationName': missed_dose.medication.name,
                'scheduledTimeDisplay': missed_dose.scheduled_time.astimezone(pt_tz).strftime('%I:%M %p'),
                'emergencyPhone': patient.emergency_phone,
            })

        # Low stock
        low_stock_meds = []
        for med in Medication.objects.filter(patient=patient, is_active=True):
            if check_reorder_needed(med):
                low_stock_meds.append({
                    'id': med.id,
                    'name': med.name,
                    'currentStock': float(med.current_stock),
                    'daysRemaining': calculate_days_remaining(med),
                })

        doses_data = []
        for d in doses:
            d_time = d.scheduled_time.astimezone(pt_tz)
            doses_data.append({
                'id': d.id,
                'medicationName': d.medication.name,
                'doseQuantity': float(d.regimen.dose_quantity),
                'dosageUnit': d.medication.get_dosage_unit_display(),
                'scheduledTime': d_time.strftime('%I:%M %p'),
                'anchor': d.regimen.get_anchor_display(),
                'status': d.status,
                'statusDisplay': d.get_status_display(),
                'takenAt': d.taken_at.astimezone(pt_tz).strftime('%I:%M %p') if d.taken_at else None,
                'isActionable': d.is_actionable or d.status == 'MISSED',
            })

        routine = getattr(patient, 'routine', None)
        routine_data = None
        if routine:
            routine_data = {
                'breakfast': routine.breakfast_time.strftime('%I:%M %p'),
                'lunch': routine.lunch_time.strftime('%I:%M %p'),
                'dinner': routine.dinner_time.strftime('%I:%M %p'),
                'bedtime': routine.bedtime.strftime('%I:%M %p'),
            }

        patient_monitors.append({
            'patientId': patient.id,
            'patientName': patient.user.get_full_name() or patient.user.username,
            'timezone': str(pt_tz),
            'emergencyPhone': patient.emergency_phone,
            'primaryPhysician': patient.primary_physician,
            'routine': routine_data,
            'totalDoses': total_doses,
            'takenCount': taken_count,
            'missedCount': missed_count,
            'pendingCount': pending_count,
            'adherencePct': adherence_pct,
            'doses': doses_data,
            'lowStockMeds': low_stock_meds,
        })

    caregiver_options = [
        {
            'id': c.id,
            'name': c.name,
            'relationship': c.get_relationship_display(),
            'tier': c.priority_tier,
        }
        for c in caregiver_qs
    ]

    return JsonResponse({
        'currentCaregiver': {
            'id': current_caregiver.id,
            'name': current_caregiver.name,
            'relationship': current_caregiver.get_relationship_display(),
            'tier': current_caregiver.priority_tier,
        } if current_caregiver else None,
        'patientMonitors': patient_monitors,
        'globalAlerts': global_alerts,
        'caregiverOptions': caregiver_options,
    })


def api_caregiver_portal_action(request, pk):
    """Action endpoint for caregiver live portal."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    dose_event = get_object_or_404(
        DoseEvent.objects.select_related('medication', 'regimen', 'regimen__patient'),
        pk=pk,
    )
    data = _parse_body(request)
    action = data.get('action', 'assist_taken')
    caregiver_name = data.get('caregiverName', 'Caregiver')
    now = timezone.now()

    if action == 'assist_taken' and dose_event.status in ('SCHEDULED', 'REMINDED', 'MISSED'):
        dose_event = record_dose_taken(dose_event)
        audit = f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] Assisted & Taken via Caregiver Portal by {caregiver_name}."
        dose_event.notes = (f"{dose_event.notes}\n{audit}" if dose_event.notes else audit).strip()
        dose_event.save()
    elif action == 'skip' and dose_event.status in ('SCHEDULED', 'REMINDED', 'MISSED'):
        dose_event.status = 'SKIPPED'
        audit = f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] Marked SKIPPED via Caregiver Portal by {caregiver_name}."
        dose_event.notes = (f"{dose_event.notes}\n{audit}" if dose_event.notes else audit).strip()
        dose_event.save()

    return JsonResponse({
        'success': True,
        'dose': {
            'id': dose_event.id,
            'status': dose_event.status,
            'statusDisplay': dose_event.get_status_display(),
        }
    })


# ──────────────────────────────────────────────
# Frictionless Caregiver Acknowledgment Link
# ──────────────────────────────────────────────

def api_caregiver_ack(request, token):
    """Validate token and process one-click response without credentials."""
    dose_event, caregiver, error_message = verify_ack_token(token)

    if error_message or not dose_event or not caregiver:
        return JsonResponse({
            'valid': False,
            'error': error_message or 'Invalid or expired acknowledgment link.'
        }, status=400)

    patient = dose_event.regimen.patient
    try:
        patient_tz = ZoneInfo(patient.timezone)
    except Exception:
        patient_tz = ZoneInfo('UTC')

    if request.method == 'GET':
        local_time = dose_event.scheduled_time.astimezone(patient_tz)
        return JsonResponse({
            'valid': True,
            'dose': {
                'id': dose_event.id,
                'medicationName': dose_event.medication.name,
                'genericName': dose_event.medication.generic_name,
                'doseQuantity': float(dose_event.regimen.dose_quantity),
                'dosageUnit': dose_event.medication.get_dosage_unit_display(),
                'anchor': dose_event.regimen.get_anchor_display(),
                'scheduledTimeDisplay': local_time.strftime('%I:%M %p (%A, %b %d)'),
                'status': dose_event.status,
                'statusDisplay': dose_event.get_status_display(),
                'isActionable': dose_event.status in ('SCHEDULED', 'REMINDED', 'MISSED'),
            },
            'patient': {
                'name': patient.user.get_full_name() or patient.user.username,
                'emergencyPhone': patient.emergency_phone,
            },
            'caregiver': {
                'id': caregiver.id,
                'name': caregiver.name,
                'relationship': caregiver.get_relationship_display(),
                'tier': caregiver.priority_tier,
            }
        })

    elif request.method == 'POST':
        data = _parse_body(request)
        action = data.get('action')
        now = timezone.now()
        local_time_str = now.astimezone(patient_tz).strftime('%I:%M %p on %b %d, %Y')

        if action == 'assisted_taken':
            if dose_event.status in ('SCHEDULED', 'REMINDED', 'MISSED'):
                dose_event = record_dose_taken(dose_event)
                dose_event.refresh_from_db()
                audit = f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] Acknowledged & Assisted by Caregiver: {caregiver.name} ({caregiver.get_relationship_display()}). Marked TAKEN."
                dose_event.notes = (f"{dose_event.notes}\n{audit}" if dose_event.notes else audit).strip()
                dose_event.save()
                msg = f"Thank you, {caregiver.name}! Dose marked as Assisted & Taken at {local_time_str}."
            else:
                msg = f"This dose was already recorded as {dose_event.get_status_display()}."
            result_type = 'success'

        elif action == 'false_alarm':
            audit = f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] Caregiver Ack: Marked as FALSE ALARM / Patient Safe by {caregiver.name} ({caregiver.get_relationship_display()})."
            dose_event.notes = (f"{dose_event.notes}\n{audit}" if dose_event.notes else audit).strip()
            dose_event.save()
            msg = f"Thank you, {caregiver.name}! Alert resolved as False Alarm / Verified Patient Safe."
            result_type = 'success'

        elif action == 'skipped':
            if dose_event.status in ('SCHEDULED', 'REMINDED', 'MISSED'):
                dose_event.status = 'SKIPPED'
                audit = f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] Caregiver Ack: Marked as SKIPPED / Refused by {caregiver.name}."
                dose_event.notes = (f"{dose_event.notes}\n{audit}" if dose_event.notes else audit).strip()
                dose_event.save()
                msg = f"Recorded as Skipped / Refused for {patient.user.get_full_name() or patient.user.username}."
            else:
                msg = f"This dose is already {dose_event.get_status_display()}."
            result_type = 'warning'
        else:
            return JsonResponse({'error': 'Invalid action'}, status=400)

        dose_event.refresh_from_db()
        return JsonResponse({
            'success': True,
            'resultType': result_type,
            'message': msg,
            'status': dose_event.status,
            'statusDisplay': dose_event.get_status_display(),
        })

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ──────────────────────────────────────────────
# Clinical Reports & Pharmacy Manifest APIs
# ──────────────────────────────────────────────

def api_adherence_report(request):
    """Return 30-day clinical adherence report data."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    days = int(request.GET.get('days', 30))
    data = generate_adherence_report_data(profile, days=days)

    med_stats = [
        {
            'name': m['medication'].name,
            'total': m['total'],
            'taken': m['taken'],
            'missed': m['missed'],
            'adherencePct': m['adherence_pct'],
        }
        for m in data['med_stats']
    ]

    return JsonResponse({
        'startDate': data['start_date'].isoformat(),
        'endDate': data['end_date'].isoformat(),
        'generatedAt': data['generated_at'].isoformat(),
        'days': data['days'],
        'totalDoses': data['total_doses'],
        'takenOntime': data['taken_ontime'],
        'takenLate': data['taken_late'],
        'totalTaken': data['total_taken'],
        'skipped': data['skipped'],
        'missed': data['missed'],
        'adherencePct': data['adherence_pct'],
        'medStats': med_stats,
        'patient': {
            'name': data['user'].get_full_name() or data['user'].username,
            'email': data['user'].email,
            'timezone': profile.timezone,
            'physician': profile.primary_physician,
            'emergencyPhone': profile.emergency_phone,
        }
    })


def api_requisition_manifest(request):
    """Return pharmacy purchase order requisition manifest data."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    profile = _get_patient_profile(request.user)
    refill_days = int(request.GET.get('days', 30))
    include_all = request.GET.get('all') in ('1', 'true', 'True')

    data = generate_requisition_manifest_data(
        profile,
        refill_days=refill_days,
        include_all=include_all,
    )

    items = [
        {
            'id': item['medication'].id,
            'name': item['name'],
            'genericName': item['generic_name'],
            'unit': item['unit'],
            'currentStock': float(item['current_stock']),
            'burnRate': item['burn_rate'],
            'daysRemaining': item['days_remaining'],
            'stockoutDate': item['stockout_date'].strftime('%b %d, %Y') if item['stockout_date'] else None,
            'leadTimeDays': item['lead_time_days'],
            'safetyBufferDays': item['safety_buffer_days'],
            'totalLeadBuffer': item['total_lead_buffer'],
            'suggestedRefillQuantity': item['suggested_refill_quantity'],
            'urgency': item['urgency'],
            'needsReorder': item['needs_reorder'],
            'regimenSummaries': item['regimen_summaries'],
            'notes': item['notes'],
        }
        for item in data['items']
    ]

    return JsonResponse({
        'manifestId': data['manifest_id'],
        'generatedAt': data['generated_at'].strftime('%b %d, %Y %H:%M'),
        'refillDays': data['refill_days'],
        'includeAll': data['include_all'],
        'items': items,
        'itemCount': data['item_count'],
        'totalCritical': data['total_critical'],
        'totalUrgent': data['total_urgent'],
        'patient': {
            'id': profile.id,
            'name': data['user'].get_full_name() or data['user'].username,
            'email': data['user'].email,
            'timezone': profile.timezone,
            'physician': profile.primary_physician,
            'emergencyPhone': profile.emergency_phone,
            'caregiverCount': profile.caregivers.count(),
        }
    })
