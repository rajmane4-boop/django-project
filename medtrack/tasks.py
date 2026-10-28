"""
Smart MedTrack — Celery Asynchronous Tasks

Periodic and background tasks for automated missed-dose evaluation,
multi-tier caregiver escalations, daily dose generation, and fault-tolerant retries.
"""
import datetime
import logging
from zoneinfo import ZoneInfo
from celery import shared_task
from django.utils import timezone

from .models import PatientProfile, DoseEvent, CaregiverContact
from .services.escalation import process_missed_doses, process_secondary_escalations
from .services.scheduling import generate_daily_dose_events
from .services.notifications import dispatch_caregiver_alert

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='medtrack.evaluate_missed_doses',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
)
def evaluate_missed_doses(self):
    """
    Periodic task: Runs every minute.
    Scans for doses exceeding 30-minute and 60-minute windows, updates statuses,
    and dispatches Tier 1 & Tier 2 alerts with automatic retry on transient failure.
    """
    try:
        logger.info("Executing periodic evaluation of missed doses...")
        tier1_events = process_missed_doses()
        tier2_events = process_secondary_escalations()

        summary = (
            f"Missed dose evaluation complete. "
            f"Tier 1 escalations: {len(tier1_events)}, Tier 2 escalations: {len(tier2_events)}."
        )
        logger.info(summary)
        return {
            'tier1_escalations': len(tier1_events),
            'tier2_escalations': len(tier2_events),
            'retry_count': self.request.retries,
        }
    except Exception as exc:
        logger.error(
            f"Error in evaluate_missed_doses (attempt {self.request.retries + 1}/4): {exc}",
            exc_info=True,
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='medtrack.generate_daily_doses_for_all_patients',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=3,
)
def generate_daily_doses_for_all_patients(self, date_str=None):
    """
    Periodic task: Runs shortly after midnight.
    Generates DoseEvent instances for all registered active patients with retry logic.
    """
    try:
        total_generated = 0
        profiles = PatientProfile.objects.select_related('user').all()

        for profile in profiles:
            try:
                tz = ZoneInfo(profile.timezone)
            except Exception:
                tz = ZoneInfo('UTC')

            if date_str:
                target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            else:
                target_date = timezone.now().astimezone(tz).date()

            events = generate_daily_dose_events(profile, target_date)
            total_generated += len(events)

        logger.info(
            f"Daily dose generation completed for {profiles.count()} patients. "
            f"Generated {total_generated} events."
        )
        return {
            'patients_processed': profiles.count(),
            'events_generated': total_generated,
            'retry_count': self.request.retries,
        }
    except Exception as exc:
        logger.error(
            f"Error in generate_daily_doses_for_all_patients (attempt {self.request.retries + 1}/4): {exc}",
            exc_info=True,
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='medtrack.async_dispatch_caregiver_alert',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
)
def async_dispatch_caregiver_alert(self, dose_id, caregiver_id, tier):
    """
    Asynchronous task: Dispatches outbound SMS/Email notification to a single caregiver
    with independent retry handling and exponential backoff.
    """
    try:
        dose = DoseEvent.objects.select_related('regimen__patient__user', 'medication').get(pk=dose_id)
        caregiver = CaregiverContact.objects.get(pk=caregiver_id)
        dispatch_caregiver_alert(dose, caregiver, tier)
        return {'status': 'dispatched', 'dose_id': dose_id, 'caregiver_id': caregiver_id, 'tier': tier}
    except Exception as exc:
        logger.error(
            f"Failed to dispatch caregiver alert (attempt {self.request.retries + 1}/4): {exc}",
            exc_info=True,
        )
        raise self.retry(exc=exc)
