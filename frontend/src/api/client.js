/**
 * Smart MedTrack — API Client
 * Handles communication with the Django REST API endpoints,
 * CSRF token synchronization, and unified error handling.
 */

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

let cachedCsrfToken = null;

export async function fetchCsrfToken() {
  try {
    const res = await fetch('/api/auth/csrf/', { credentials: 'include' });
    const data = await res.json();
    cachedCsrfToken = data.csrfToken;
    return cachedCsrfToken;
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err);
    return null;
  }
}

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // Attach CSRF token for mutating requests
  if (options.method && options.method.toUpperCase() !== 'GET' && options.method.toUpperCase() !== 'HEAD') {
    let token = cachedCsrfToken || getCookie('csrftoken');
    if (!token) {
      token = await fetchCsrfToken();
    }
    if (token) {
      headers['X-CSRFToken'] = token;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && data.error) || (typeof data === 'string' ? data : 'API Request Failed');
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  csrf: () => fetchCsrfToken(),
  login: (username, password) => apiFetch('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  register: (payload) => apiFetch('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  logout: () => apiFetch('/api/auth/logout/', { method: 'POST' }),
  me: () => apiFetch('/api/auth/me/'),

  // Profile
  getProfile: () => apiFetch('/api/profile/'),
  updateProfile: (payload) => apiFetch('/api/profile/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Dashboard & Doses
  getDashboard: () => apiFetch('/api/dashboard/'),
  takeDose: (id) => apiFetch(`/api/doses/${id}/take/`, { method: 'POST' }),
  skipDose: (id) => apiFetch(`/api/doses/${id}/skip/`, { method: 'POST' }),

  // Medications
  getMedications: async () => {
    const res = await apiFetch('/api/medications/');
    const list = res?.medications || (Array.isArray(res) ? res : []);
    return list.map((m) => ({
      ...m,
      stock_level: m.currentStock ?? m.stock_level ?? 0,
      currentStock: m.currentStock ?? m.stock_level ?? 0,
      unit: m.dosageUnitDisplay || m.dosageUnit || m.unit || 'Tablets',
      dosageUnit: m.dosageUnit || m.unit || 'TABLETS',
      dosageUnitDisplay: m.dosageUnitDisplay || m.unit || 'Tablets',
      reorder_threshold: m.reorderThreshold ?? m.reorder_threshold ?? 7,
      reorderThreshold: m.reorderThreshold ?? m.reorder_threshold ?? 7,
      chemical_name: m.genericName || m.chemical_name || '',
      genericName: m.genericName || m.chemical_name || '',
      burn_rate: m.burnRate ?? m.burn_rate ?? 0,
      burnRate: m.burnRate ?? m.burn_rate ?? 0,
      days_remaining: m.daysRemaining ?? m.days_remaining,
      daysRemaining: m.daysRemaining ?? m.days_remaining,
      lead_time_days: m.leadTimeDays ?? m.lead_time_days ?? 3,
      leadTimeDays: m.leadTimeDays ?? m.lead_time_days ?? 3,
      isActive: m.isActive ?? m.is_active ?? true,
      is_active: m.isActive ?? m.is_active ?? true,
    }));
  },
  createMedication: (payload) => {
    const body = {
      name: payload.name,
      genericName: payload.chemical_name || payload.genericName || '',
      currentStock: payload.stock_level ?? payload.currentStock ?? 0,
      reorderThreshold: payload.reorder_threshold ?? payload.reorderThreshold ?? 7,
      dosageUnit: (payload.unit || payload.dosageUnit || 'TABLETS').toUpperCase(),
      leadTimeDays: payload.leadTimeDays || payload.lead_time_days || 3,
      notes: payload.notes || '',
      isActive: payload.isActive ?? payload.is_active ?? true,
    };
    return apiFetch('/api/medications/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateMedication: (id, payload) => {
    const body = {
      name: payload.name,
      genericName: payload.chemical_name !== undefined ? payload.chemical_name : payload.genericName,
      currentStock: payload.stock_level !== undefined ? payload.stock_level : payload.currentStock,
      reorderThreshold: payload.reorder_threshold !== undefined ? payload.reorder_threshold : payload.reorderThreshold,
      dosageUnit: payload.unit || payload.dosageUnit ? (payload.unit || payload.dosageUnit).toUpperCase() : undefined,
      leadTimeDays: payload.leadTimeDays || payload.lead_time_days,
      notes: payload.notes,
      isActive: payload.isActive ?? payload.is_active,
    };
    return apiFetch(`/api/medications/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteMedication: (id) => apiFetch(`/api/medications/${id}/`, {
    method: 'DELETE',
  }),

  // Regimens
  getRegimens: async () => {
    const res = await apiFetch('/api/regimens/');
    const list = res?.regimens || (Array.isArray(res) ? res : []);
    return list.map((r) => ({
      ...r,
      medication_id: r.medicationId || r.medication_id || (r.medication && r.medication.id),
      medicationId: r.medicationId || r.medication_id || (r.medication && r.medication.id),
      medication_name: r.medicationName || r.medication_name || (r.medication && r.medication.name) || '',
      medicationName: r.medicationName || r.medication_name || (r.medication && r.medication.name) || '',
      dosage_units: r.doseQuantity ?? r.dosage_units ?? 1,
      doseQuantity: r.doseQuantity ?? r.dosage_units ?? 1,
      dosageUnit: r.dosageUnit || r.dosage_unit || 'TABLETS',
      dosageUnitDisplay: r.dosageUnitDisplay || r.dosage_unit_display || 'Tablets',
      anchor: r.anchor || 'BREAKFAST',
      anchor_display: r.anchorDisplay || r.anchor_display || r.anchor || 'Breakfast',
      anchorDisplay: r.anchorDisplay || r.anchor_display || r.anchor || 'Breakfast',
      offset_minutes: r.offsetMinutes ?? r.offset_minutes ?? 0,
      offsetMinutes: r.offsetMinutes ?? r.offset_minutes ?? 0,
      custom_time: r.fixedTime || r.custom_time || '',
      fixedTime: r.fixedTime || r.custom_time || '',
      frequency: r.frequency || 'DAILY',
      frequency_display: r.frequencyDisplay || r.frequency_display || r.frequency || 'Daily',
      frequencyDisplay: r.frequencyDisplay || r.frequency_display || r.frequency || 'Daily',
      instructions: r.instructions || '',
      isActive: r.isActive ?? r.is_active ?? true,
      is_active: r.isActive ?? r.is_active ?? true,
    }));
  },
  createRegimen: (payload) => {
    const body = {
      medicationId: payload.medicationId || payload.medication_id,
      doseQuantity: payload.doseQuantity ?? payload.dosage_units ?? 1,
      anchor: payload.anchor || 'BREAKFAST',
      offsetMinutes: payload.offsetMinutes ?? payload.offset_minutes ?? 0,
      fixedTime: payload.fixedTime || payload.custom_time || null,
      frequency: payload.frequency || 'DAILY',
      specificDays: payload.specificDays || payload.specific_days || null,
      isActive: payload.isActive ?? payload.is_active ?? true,
    };
    return apiFetch('/api/regimens/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateRegimen: (id, payload) => {
    const body = {
      medicationId: payload.medicationId || payload.medication_id,
      doseQuantity: payload.doseQuantity ?? payload.dosage_units,
      anchor: payload.anchor,
      offsetMinutes: payload.offsetMinutes ?? payload.offset_minutes,
      fixedTime: payload.fixedTime || payload.custom_time,
      frequency: payload.frequency,
      specificDays: payload.specificDays || payload.specific_days,
      isActive: payload.isActive ?? payload.is_active,
    };
    return apiFetch(`/api/regimens/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteRegimen: (id) => apiFetch(`/api/regimens/${id}/`, {
    method: 'DELETE',
  }),

  // Caregivers
  getCaregivers: async () => {
    const res = await apiFetch('/api/caregivers/');
    const list = res?.caregivers || (Array.isArray(res) ? res : []);
    return list.map((c) => ({
      ...c,
      phone: c.phoneNumber || c.phone || '',
      phoneNumber: c.phoneNumber || c.phone || '',
      tier: c.priorityTier ?? c.tier ?? 1,
      priorityTier: c.priorityTier ?? c.tier ?? 1,
      relationship: c.relationshipDisplay || c.relationship || 'Caregiver',
      relationshipDisplay: c.relationshipDisplay || c.relationship || 'Caregiver',
      email: c.email || '',
      isActive: c.isActive ?? c.is_active ?? true,
      is_active: c.isActive ?? c.is_active ?? true,
    }));
  },
  createCaregiver: (payload) => {
    const body = {
      name: payload.name,
      phoneNumber: payload.phoneNumber || payload.phone,
      relationship: payload.relationship || 'FAMILY',
      email: payload.email || '',
      priorityTier: payload.priorityTier ?? payload.tier ?? 1,
      isActive: payload.isActive ?? payload.is_active ?? true,
    };
    return apiFetch('/api/caregivers/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateCaregiver: (id, payload) => {
    const body = {
      name: payload.name,
      phoneNumber: payload.phoneNumber || payload.phone,
      relationship: payload.relationship,
      email: payload.email,
      priorityTier: payload.priorityTier ?? payload.tier,
      isActive: payload.isActive ?? payload.is_active,
    };
    return apiFetch(`/api/caregivers/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteCaregiver: (id) => apiFetch(`/api/caregivers/${id}/`, {
    method: 'DELETE',
  }),

  // Caregiver Live Portal (Phase 3)
  getCaregiverPortal: (caregiverId) => {
    const url = caregiverId ? `/api/caregiver/portal/?caregiver_id=${caregiverId}` : '/api/caregiver/portal/';
    return apiFetch(url);
  },
  caregiverPortalAction: (doseId, action, caregiverName) => apiFetch(`/api/caregiver/portal/dose/${doseId}/action/`, {
    method: 'POST',
    body: JSON.stringify({ action, caregiverName }),
  }),

  // Frictionless Acknowledgment (Phase 3)
  getCaregiverAck: (token) => apiFetch(`/api/caregiver/ack/${token}/`),
  submitCaregiverAck: (token, action) => apiFetch(`/api/caregiver/ack/${token}/`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  }),

  // Clinical Reports & Manifests (Phase 4)
  getAdherenceReport: (days = 30) => apiFetch(`/api/reports/adherence/?days=${days}`),
  getRequisitionManifest: (days = 30, includeAll = false) => {
    const url = `/api/reports/requisition/?days=${days}${includeAll ? '&all=1' : ''}`;
    return apiFetch(url);
  },
};
