const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

function getToken() {
  return localStorage.getItem('token');
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getToken();
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Erreur serveur');
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? `?${query}` : ''}`);
  },

  createUser: (userData) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),

  importUsers: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/admin/users/import', { method: 'POST', body: formData });
  },

  bulkStatus: (userIds, action) =>
    request('/admin/users/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ userIds, action }),
    }),

  updateUserStatus: (id, status) =>
    request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  getStats: () => request('/admin/dashboard/stats'),
};
