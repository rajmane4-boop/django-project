"""
Smart MedTrack — REST API URL Configuration
Routes all JSON API endpoints for the React frontend.
"""
from django.urls import path
from . import api

urlpatterns = [
    # Auth & CSRF
    path('auth/csrf/', api.api_csrf, name='api_csrf'),
    path('auth/login/', api.api_login, name='api_login'),
    path('auth/register/', api.api_register, name='api_register'),
    path('auth/logout/', api.api_logout, name='api_logout'),
    path('auth/me/', api.api_me, name='api_me'),

    # Profile & Routine
    path('profile/', api.api_profile, name='api_profile'),

    # Intake Dashboard
    path('dashboard/', api.api_dashboard, name='api_dashboard'),
    path('doses/<int:pk>/take/', api.api_dose_take, name='api_dose_take'),
    path('doses/<int:pk>/skip/', api.api_dose_skip, name='api_dose_skip'),

    # Medications
    path('medications/', api.api_medications, name='api_medications'),
    path('medications/<int:pk>/', api.api_medication_detail, name='api_medication_detail'),

    # Regimens
    path('regimens/', api.api_regimens, name='api_regimens'),
    path('regimens/<int:pk>/', api.api_regimen_detail, name='api_regimen_detail'),

    # Caregivers
    path('caregivers/', api.api_caregivers, name='api_caregivers'),
    path('caregivers/<int:pk>/', api.api_caregiver_detail, name='api_caregiver_detail'),

    # Caregiver Live Portal (Phase 3)
    path('caregiver/portal/', api.api_caregiver_portal, name='api_caregiver_portal'),
    path('caregiver/portal/dose/<int:pk>/action/', api.api_caregiver_portal_action, name='api_caregiver_portal_action'),

    # Frictionless Caregiver Acknowledgment Link (Phase 3)
    path('caregiver/ack/<str:token>/', api.api_caregiver_ack, name='api_caregiver_ack'),

    # Clinical Reports & Manifests (Phase 4)
    path('reports/adherence/', api.api_adherence_report, name='api_adherence_report'),
    path('reports/requisition/', api.api_requisition_manifest, name='api_requisition_manifest'),
]
