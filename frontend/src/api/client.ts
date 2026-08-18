import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT Auth Header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pench_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Helper Functions
export const fetchDashboardSummary = async () => {
  const res = await apiClient.get('/dashboard');
  return res.data;
};

export const fetchStations = async () => {
  const res = await apiClient.get('/stations');
  return res.data;
};

export const fetchImages = async (params?: Record<string, any>) => {
  const res = await apiClient.get('/images', { params });
  return res.data;
};

export const restoreQuarantinedImage = async (imageId: number) => {
  const res = await apiClient.post(`/images/${imageId}/restore`);
  return res.data;
};

export const fetchTigers = async () => {
  const res = await apiClient.get('/tigers');
  return res.data;
};

export const fetchTigerDetail = async (id: number) => {
  const res = await apiClient.get(`/tigers/${id}`);
  return res.data;
};

export const fetchTigerCaptures = async (id: number) => {
  const res = await apiClient.get(`/tigers/${id}/captures`);
  return res.data;
};

export const fetchTigerMovement = async (id: number) => {
  const res = await apiClient.get(`/tigers/${id}/movement`);
  return res.data;
};

export const fetchTigerOccupancy = async (id: number) => {
  const res = await apiClient.get(`/tigers/${id}/occupancy`);
  return res.data;
};

export const fetchReviewQueue = async () => {
  const res = await apiClient.get('/review/queue');
  return res.data;
};

export const submitReviewDecision = async (imageId: number, action: string, targetTigerId?: number, notes?: string) => {
  const res = await apiClient.post(`/review/${imageId}`, {
    action,
    target_tiger_id: targetTigerId,
    notes,
  });
  return res.data;
};

export const fetchMapObservations = async () => {
  const res = await apiClient.get('/map/observations');
  return res.data;
};

export const fetchTerritorialOverlap = async () => {
  const res = await apiClient.get('/map/overlap');
  return res.data;
};

export const fetchAlerts = async (params?: Record<string, any>) => {
  const res = await apiClient.get('/alerts', { params });
  return res.data;
};

export const updateAlertStatus = async (alertId: number, status: string, notes?: string) => {
  const res = await apiClient.patch(`/alerts/${alertId}`, { status, notes });
  return res.data;
};

export const fetchProcessingRuns = async () => {
  const res = await apiClient.get('/processing-runs');
  return res.data;
};

export const fetchProcessingRunDetail = async (id: number) => {
  const res = await apiClient.get(`/processing-runs/${id}`);
  return res.data;
};

export const createProcessingRun = async (formData: FormData) => {
  const res = await apiClient.post('/processing-runs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const fetchSystemSettings = async () => {
  const res = await apiClient.get('/settings');
  return res.data;
};

export const updateSystemSettings = async (settings: any) => {
  const res = await apiClient.post('/settings', settings);
  return res.data;
};

export const fetchAdminUsers = async () => {
  const res = await apiClient.get('/admin/users');
  return res.data;
};

export const fetchAuditLogs = async () => {
  const res = await apiClient.get('/admin/audit-logs');
  return res.data;
};

export const fetchOfficers = async () => {
  const res = await apiClient.get('/officers');
  return res.data;
};

export const fetchOfficerById = async (officerId: string) => {
  const res = await apiClient.get(`/officers/${officerId}`);
  return res.data;
};

export const fetchCurrentOfficer = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const fetchDashboardMetrics = async () => {
  const res = await apiClient.get('/dashboard');
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Emergency Response System API
// ─────────────────────────────────────────────────────────────────────────────

export const fetchEmergencyStatus = async () => {
  const res = await apiClient.get('/emergency/status');
  return res.data;
};

export const fetchEmergencyContacts = async () => {
  const res = await apiClient.get('/emergency/contacts');
  return res.data;
};

export const createEmergencyContact = async (data: {
  name: string; role: string; primary_phone: string;
  secondary_phone?: string; priority: number; is_active: boolean; notes?: string;
}) => {
  const res = await apiClient.post('/emergency/contacts', data);
  return res.data;
};

export const updateEmergencyContact = async (id: number, data: Partial<{
  name: string; role: string; primary_phone: string;
  secondary_phone: string; priority: number; is_active: boolean; notes: string;
}>) => {
  const res = await apiClient.put(`/emergency/contacts/${id}`, data);
  return res.data;
};

export const deleteEmergencyContact = async (id: number) => {
  await apiClient.delete(`/emergency/contacts/${id}`);
};

export const fetchEmergencyEvents = async (params?: {
  risk_level?: string; call_status?: string; acknowledged?: boolean; limit?: number;
}) => {
  const res = await apiClient.get('/emergency/events', { params });
  return res.data;
};

export const fetchEmergencyEvent = async (id: number) => {
  const res = await apiClient.get(`/emergency/events/${id}`);
  return res.data;
};

export const acknowledgeEmergencyEvent = async (id: number, acknowledgedBy: string) => {
  const res = await apiClient.post(`/emergency/events/${id}/acknowledge`, {
    acknowledged_by: acknowledgedBy,
  });
  return res.data;
};

export const triggerTestCall = async (contactId?: number) => {
  const params = contactId ? { contact_id: contactId } : {};
  const res = await apiClient.post('/emergency/test-call', null, { params });
  return res.data;
};

export const triggerTestMessage = async (contactId?: number) => {
  const params = contactId ? { contact_id: contactId } : {};
  const res = await apiClient.post('/emergency/test-message', null, { params });
  return res.data;
};

