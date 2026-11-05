// ─── Google Forms API service ────────────────────────────────────────────────
// Follows the same fetch pattern as api.js — self-contained to avoid coupling.

const API_URL = '/api';

function getToken() {
  return localStorage.getItem('exocraft_token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('exocraft_token');
    localStorage.removeItem('exocraft_user');
    window.location.href = '/login';
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : err.message || 'Une erreur est survenue.';
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const BASE = '/google-forms';

export const googleFormsApi = {
  /** GET /api/google-forms/status → { connected: boolean } */
  getStatus: () => apiRequest(`${BASE}/status`),

  /** GET /api/google-forms/auth → { url: string } */
  getAuthUrl: () => apiRequest(`${BASE}/auth`),

  /** POST /api/google-forms/export/:quizId → { lien, formId } */
  export: (quizId) =>
    apiRequest(`${BASE}/export/${quizId}`, { method: 'POST' }),

  /** POST /api/google-forms/sync/:quizId → { resultats } */
  sync: (quizId) =>
    apiRequest(`${BASE}/sync/${quizId}`, { method: 'POST' }),
};
