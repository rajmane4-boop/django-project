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
  getMedications: () => apiFetch('/api/medications/'),
  createMedication: (payload) => apiFetch('/api/medications/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateMedication: (id, payload) => apiFetch(`/api/medications/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteMedication: (id) => apiFetch(`/api/medications/${id}/`, {
    method: 'DELETE',
  }),

  // Regimens
  getRegimens: () => apiFetch('/api/regimens/'),
  createRegimen: (payload) => apiFetch('/api/regimens/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateRegimen: (id, payload) => apiFetch(`/api/regimens/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteRegimen: (id) => apiFetch(`/api/regimens/${id}/`, {
    method: 'DELETE',
  }),

  // Caregivers
  getCaregivers: () => apiFetch('/api/caregivers/'),
  createCaregiver: (payload) => apiFetch('/api/caregivers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateCaregiver: (id, payload) => apiFetch(`/api/caregivers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
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
