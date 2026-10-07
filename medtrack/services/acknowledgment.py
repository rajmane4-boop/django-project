"""
Smart MedTrack — Caregiver Acknowledgment & Token Service

Provides cryptographic, expiring token generation and verification using
Django's TimestampSigner. Enables frictionless, passwordless actions for caregivers
receiving SMS/Email escalation alerts.
"""
import logging
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.urls import reverse

from ..models import CaregiverContact, DoseEvent

logger = logging.getLogger(__name__)

ACK_SALT = 'medtrack-caregiver-ack-v1'
PORTAL_SALT = 'medtrack-caregiver-portal-v1'
DEFAULT_ACK_MAX_AGE = 86400  # 24 hours in seconds
DEFAULT_PORTAL_MAX_AGE = 604800  # 7 days in seconds


def generate_ack_token(dose_event, caregiver):
    """
    Generate an expiring signed token linking a specific DoseEvent to a CaregiverContact.
    Format: '<dose_event_id>:<caregiver_id>'
    """
    signer = TimestampSigner(salt=ACK_SALT)
    payload = f"{dose_event.pk}:{caregiver.pk}"
    return signer.sign(payload)


def verify_ack_token(token, max_age=DEFAULT_ACK_MAX_AGE):
    """
    Validate and decode a caregiver acknowledgment token.

    Returns:
        tuple (dose_event, caregiver, None) on success.
        tuple (None, None, error_message) on failure or expiration.
    """
    signer = TimestampSigner(salt=ACK_SALT)
    try:
        raw_payload = signer.unsign(token, max_age=max_age)
    except SignatureExpired:
        return None, None, "This acknowledgment link has expired (valid for 24 hours). Please contact the patient directly."
    except BadSignature:
        return None, None, "Invalid or corrupted acknowledgment link."

    try:
        dose_id_str, caregiver_id_str = raw_payload.split(':', 1)
        dose_id = int(dose_id_str)
        caregiver_id = int(caregiver_id_str)
    except (ValueError, AttributeError):
        return None, None, "Malformed acknowledgment token payload."

    try:
        dose_event = DoseEvent.objects.select_related(
            'medication',
            'regimen',
            'regimen__patient',
            'regimen__patient__user',
        ).get(pk=dose_id)
    except DoseEvent.DoesNotExist:
        return None, None, "The dose event associated with this link was not found."

    try:
        caregiver = CaregiverContact.objects.select_related(
            'patient',
            'patient__user',
        ).get(pk=caregiver_id)
    except CaregiverContact.DoesNotExist:
        return None, None, "The caregiver contact associated with this link was not found."

    return dose_event, caregiver, None


def generate_portal_token(caregiver):
    """
    Generate an expiring signed token allowing a caregiver to access their live portal
    without entering credentials.
    """
    signer = TimestampSigner(salt=PORTAL_SALT)
    payload = f"{caregiver.pk}"
    return signer.sign(payload)


def verify_portal_token(token, max_age=DEFAULT_PORTAL_MAX_AGE):
    """
    Validate a caregiver portal access token.

    Returns:
        tuple (caregiver, None) on success.
        tuple (None, error_message) on failure.
    """
    signer = TimestampSigner(salt=PORTAL_SALT)
    try:
        raw_payload = signer.unsign(token, max_age=max_age)
        caregiver_id = int(raw_payload)
        caregiver = CaregiverContact.objects.select_related('patient', 'patient__user').get(pk=caregiver_id)
        return caregiver, None
    except SignatureExpired:
        return None, "Caregiver portal session link has expired. Please request a new alert link or sign in."
    except (BadSignature, ValueError, CaregiverContact.DoesNotExist):
        return None, "Invalid caregiver portal link."
