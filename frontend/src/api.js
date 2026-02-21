const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Reps
  getReps: () => request('/reps'),
  createRep: (data) => request('/reps', { method: 'POST', body: data }),
  getRepStats: (id) => request(`/reps/${id}/stats`),

  // Leads
  getLeads: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/leads${q ? '?' + q : ''}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  createLead: (data) => request('/leads', { method: 'POST', body: data }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: data }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),

  // Follow-ups
  getFollowups: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/followups${q ? '?' + q : ''}`);
  },
  getTodayFollowups: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/followups/today${q ? '?' + q : ''}`);
  },
  getUpcomingFollowups: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/followups/upcoming${q ? '?' + q : ''}`);
  },
  createFollowup: (data) => request('/followups', { method: 'POST', body: data }),
  completeFollowup: (id, data) => request(`/followups/${id}/complete`, { method: 'PUT', body: data }),
  deleteFollowup: (id) => request(`/followups/${id}`, { method: 'DELETE' }),

  // Activities
  getActivities: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/activities${q ? '?' + q : ''}`);
  },
  logActivity: (data) => request('/activities', { method: 'POST', body: data }),
};
