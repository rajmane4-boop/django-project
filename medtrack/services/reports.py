"""
Smart MedTrack — Clinical Adherence Reporting Service

Generates comprehensive adherence data and renders either binary PDF (via WeasyPrint
when GTK/Pango libraries are available) or print-optimized HTML reports.
"""
from datetime import timedelta
import logging
from zoneinfo import ZoneInfo
from django.template.loader import render_to_string
from django.utils import timezone

from ..models import DoseEvent, Medication

logger = logging.getLogger(__name__)


def generate_adherence_report_data(patient_profile, days=30):
    """
    Compile 30-day clinical adherence statistics and event history for a patient.

    Returns:
        dict: Complete report context including metrics, breakdown, and dose log.
    """
    try:
        tz = ZoneInfo(patient_profile.timezone)
    except Exception:
        tz = ZoneInfo('UTC')

    now = timezone.now()
    end_date = now.astimezone(tz).date()
    start_date = end_date - timedelta(days=days)

    start_dt = timezone.datetime.combine(start_date, timezone.datetime.min.time(), tzinfo=tz)
    end_dt = timezone.datetime.combine(end_date, timezone.datetime.max.time(), tzinfo=tz)

    events = (
        DoseEvent.objects
        .filter(
            regimen__patient=patient_profile,
            scheduled_time__gte=start_dt,
            scheduled_time__lte=end_dt,
        )
        .select_related('medication', 'regimen')
        .order_by('-scheduled_time')
    )

    total_doses = events.count()
    taken_ontime = events.filter(status='TAKEN').count()
    taken_late = events.filter(status='TAKEN_LATE').count()
    total_taken = taken_ontime + taken_late
    skipped = events.filter(status='SKIPPED').count()
    missed = events.filter(status='MISSED').count()

    adherence_pct = round((total_taken / total_doses * 100) if total_doses > 0 else 0, 1)

    # Per-medication breakdown
    medications = Medication.objects.filter(patient=patient_profile)
    med_stats = []
    for med in medications:
        med_events = events.filter(medication=med)
        med_total = med_events.count()
        med_taken = med_events.filter(status__in=['TAKEN', 'TAKEN_LATE']).count()
        med_missed = med_events.filter(status='MISSED').count()
        med_pct = round((med_taken / med_total * 100) if med_total > 0 else 0, 1)

        med_stats.append({
            'medication': med,
            'total': med_total,
            'taken': med_taken,
            'missed': med_missed,
            'adherence_pct': med_pct,
        })

    return {
        'patient': patient_profile,
        'user': patient_profile.user,
        'start_date': start_date,
        'end_date': end_date,
        'generated_at': now.astimezone(tz),
        'days': days,
        'total_doses': total_doses,
        'taken_ontime': taken_ontime,
        'taken_late': taken_late,
        'total_taken': total_taken,
        'skipped': skipped,
        'missed': missed,
        'adherence_pct': adherence_pct,
        'med_stats': med_stats,
        'events': events,
    }


def render_pdf_or_html(patient_profile, days=30, as_pdf=False):
    """
    Render clinical adherence report. If as_pdf is True and WeasyPrint is available,
    returns binary PDF bytes; otherwise returns HTML string.
    """
    context = generate_adherence_report_data(patient_profile, days=days)
    html_content = render_to_string('medtrack/reports/adherence_report.html', context)

    if as_pdf:
        try:
            import weasyprint
            pdf_bytes = weasyprint.HTML(string=html_content).write_pdf()
            return pdf_bytes, 'application/pdf'
        except Exception as e:
            logger.warning(
                f"WeasyPrint rendering unavailable ({e}); falling back to print-optimized HTML."
            )

    return html_content, 'text/html'


# ──────────────────────────────────────────────
# Pharmacy Refill Requisition Manifest (Phase 4)
# ──────────────────────────────────────────────

def generate_requisition_manifest_data(patient_profile, refill_days=30, include_all=False):
    """
    Compile pharmacy refill requisition purchase order manifest data.
    Identifies low-stock medications and computes replenishment units needed
    to cover a clinical duration plus procurement lead-time safety buffers.

    Parameters:
        patient_profile: PatientProfile instance
        refill_days: int (default 30), desired days of target medication coverage
        include_all: bool (default False), whether to include all active medications or low-stock only

    Returns:
        dict: Complete requisition manifest context
    """
    import math
    from decimal import Decimal
    from .inventory import calculate_burn_rate, calculate_days_remaining, check_reorder_needed

    try:
        tz = ZoneInfo(patient_profile.timezone)
    except Exception:
        tz = ZoneInfo('UTC')

    now = timezone.now()
    local_now = now.astimezone(tz)
    today = local_now.date()

    medications = Medication.objects.filter(
        patient=patient_profile,
        is_active=True,
    ).prefetch_related('regimens')

    manifest_items = []
    total_critical = 0
    total_urgent = 0

    for med in medications:
        burn_rate = calculate_burn_rate(med)
        days_remaining = calculate_days_remaining(med)
        needs_reorder = check_reorder_needed(med)

        buffer_days = 3
        total_safety_lead_days = med.lead_time_days + buffer_days

        # Urgency classification
        if days_remaining is not None and days_remaining <= med.lead_time_days:
            urgency = 'CRITICAL'
            total_critical += 1
        elif needs_reorder:
            urgency = 'URGENT'
            total_urgent += 1
        else:
            urgency = 'ROUTINE'

        # Filter by low-stock threshold unless include_all is requested
        if not include_all and not needs_reorder:
            continue

        # Estimated stockout date
        stockout_date = today + timedelta(days=days_remaining) if days_remaining is not None else None

        # Replenishment calculation
        # Covers target coverage window + lead-time buffer, minus current on-hand units
        if burn_rate > 0:
            target_stock = burn_rate * Decimal(refill_days + total_safety_lead_days)
            deficit = target_stock - med.current_stock
            replenish_units = max(Decimal('0'), deficit)
            suggested_qty = int(math.ceil(replenish_units))
        else:
            suggested_qty = 0

        # Regimen dosing summary
        active_regimens = med.regimens.filter(is_active=True)
        regimen_summaries = [str(r) for r in active_regimens]

        manifest_items.append({
            'medication': med,
            'name': med.name,
            'generic_name': med.generic_name or med.name,
            'unit': med.get_dosage_unit_display(),
            'current_stock': med.current_stock,
            'burn_rate': round(float(burn_rate), 2),
            'days_remaining': days_remaining,
            'stockout_date': stockout_date,
            'lead_time_days': med.lead_time_days,
            'safety_buffer_days': buffer_days,
            'total_lead_buffer': total_safety_lead_days,
            'target_days': refill_days,
            'suggested_refill_quantity': suggested_qty,
            'urgency': urgency,
            'needs_reorder': needs_reorder,
            'regimen_summaries': regimen_summaries,
            'notes': med.notes,
        })

    # Deterministic document reference
    manifest_id = f"REQ-{today.strftime('%Y%m%d')}-{patient_profile.pk:04d}-{local_now.strftime('%H%M')}"

    return {
        'patient': patient_profile,
        'user': patient_profile.user,
        'manifest_id': manifest_id,
        'generated_at': local_now,
        'today': today,
        'refill_days': refill_days,
        'include_all': include_all,
        'items': manifest_items,
        'item_count': len(manifest_items),
        'total_critical': total_critical,
        'total_urgent': total_urgent,
        'has_items': len(manifest_items) > 0,
    }


def render_requisition_pdf_or_html(patient_profile, refill_days=30, include_all=False, as_pdf=False):
    """
    Render Pharmacy Refill Requisition Manifest.
    Returns (content, content_type).
    """
    context = generate_requisition_manifest_data(
        patient_profile,
        refill_days=refill_days,
        include_all=include_all,
    )
    html_content = render_to_string('medtrack/reports/requisition_manifest.html', context)

    if as_pdf:
        try:
            import weasyprint
            pdf_bytes = weasyprint.HTML(string=html_content).write_pdf()
            return pdf_bytes, 'application/pdf'
        except Exception as e:
            logger.warning(
                f"WeasyPrint rendering unavailable ({e}); falling back to print-optimized HTML."
            )

    return html_content, 'text/html'

