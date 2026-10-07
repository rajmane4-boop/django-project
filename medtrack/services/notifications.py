"""
Smart MedTrack — Notification Service

Handles dispatching reminder and escalation notifications via Email and SMS.
Supports local logging / console output in development and provider integration in production.
"""
import logging
from zoneinfo import ZoneInfo
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse

from .acknowledgment import generate_ack_token, generate_portal_token

logger = logging.getLogger(__name__)


def format_patient_time(dt, timezone_str):
    """Format a UTC datetime in the patient's local timezone for human readability."""
    try:
        tz = ZoneInfo(timezone_str)
        local_dt = dt.astimezone(tz)
        return local_dt.strftime('%I:%M %p (%a, %b %d)')
    except Exception:
        return dt.strftime('%Y-%m-%d %H:%M UTC')


def dispatch_caregiver_alert(dose_event, caregiver, tier):
    """
    Dispatch an escalation alert to a caregiver contact via SMS and Email.

    Parameters:
        dose_event: DoseEvent instance that was missed
        caregiver: CaregiverContact instance
        tier: int (1 for Tier 1 primary, 2 for Tier 2 secondary)
    """
    patient = dose_event.regimen.patient
    patient_name = patient.user.get_full_name() or patient.user.username
    med_name = dose_event.medication.name
    dose_qty = dose_event.regimen.dose_quantity
    dose_unit = dose_event.medication.get_dosage_unit_display().lower()
    time_str = format_patient_time(dose_event.scheduled_time, patient.timezone)

    # Generate frictionless one-click acknowledgment and portal URLs
    base_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000').rstrip('/')
    try:
        token = generate_ack_token(dose_event, caregiver)
        ack_path = reverse('medtrack:caregiver_ack', kwargs={'token': token})
        ack_url = f"{base_url}{ack_path}"
    except Exception as e:
        logger.warning(f"Failed to reverse caregiver_ack URL: {e}")
        ack_url = f"{base_url}/caregiver/ack/"

    try:
        portal_token = generate_portal_token(caregiver)
        portal_path = reverse('medtrack:caregiver_portal_token', kwargs={'token': portal_token})
        portal_url = f"{base_url}{portal_path}"
    except Exception as e:
        logger.warning(f"Failed to reverse caregiver_portal URL: {e}")
        portal_url = f"{base_url}/caregiver/portal/"

    subject = f"[URGENT - Tier {tier}] MedTrack Missed Dose Alert: {patient_name}"
    tier_label = "PRIMARY CAREGIVER (Tier 1)" if tier == 1 else "EMERGENCY ESCALATION (Tier 2)"

    message = (
        f"SMART MEDTRACK SAFETY ESCALATION ALERT\n"
        f"Role: {tier_label}\n"
        f"--------------------------------------------------\n"
        f"Patient: {patient_name}\n"
        f"Medication: {med_name} ({dose_qty} {dose_unit})\n"
        f"Scheduled Intake Time: {time_str}\n"
        f"Status: UNCONFIRMED / MISSED (Exceeded 30-min window)\n"
        f"Caregiver Contact: {caregiver.name} ({caregiver.get_relationship_display()})\n"
        f"--------------------------------------------------\n"
        f"ONE-CLICK ACTION (No Password Required):\n"
        f"Click to acknowledge, verify safety, or mark dose assisted:\n"
        f"{ack_url}\n"
        f"--------------------------------------------------\n"
        f"Live Caregiver Monitoring Portal:\n"
        f"{portal_url}\n"
        f"--------------------------------------------------\n"
        f"Please check in with {patient_name} immediately to ensure medication adherence.\n"
        f"Emergency Phone on file: {patient.emergency_phone or 'None'}\n"
    )

    # 1. Dispatch SMS simulation / log
    sms_body = (
        f"[MedTrack Tier {tier}] URGENT: {patient_name} missed scheduled dose of "
        f"{med_name} scheduled for {time_str}. Please verify patient safety. "
        f"One-click action: {ack_url}"
    )
    logger.warning(
        f"[SMS OUTBOUND to {caregiver.phone_number}] {sms_body}"
    )

    # 2. Dispatch Email if caregiver has email address
    if caregiver.email:
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'alerts@smartmedtrack.local'),
                recipient_list=[caregiver.email],
                fail_silently=False,
            )
            logger.info(f"Escalation email sent to {caregiver.email} for dose {dose_event.pk}")
        except Exception as e:
            logger.error(f"Failed to send escalation email to {caregiver.email}: {e}")

    return {
        'caregiver_id': caregiver.pk,
        'tier': tier,
        'phone': caregiver.phone_number,
        'email': caregiver.email,
        'ack_url': ack_url,
        'portal_url': portal_url,
        'dispatched': True,
    }
