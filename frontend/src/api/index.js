import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({ baseURL: BASE, withCredentials: true });

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${BASE}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        // Refresh failed — clear storage and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout')); // lets AuthContext react cleanly
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Keep Render backend alive (free tier spins down after ~15 min) ────────────
// Pings every 10 minutes so the backend is warm when the user returns
setInterval(() => {
  fetch(`${BASE}/users/health`).catch(() => {});
}, 10 * 60 * 1000);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (data) => api.post('/users/register', data);
export const loginUser    = (data) => api.post('/users/login', data);
export const logoutUser   = ()     => api.post('/users/logout');
export const refreshToken = ()     => api.post('/users/refresh-token');

// ── Groups ───────────────────────────────────────────────────────────────────
export const createGroup     = (data)    => api.post('/groups/create-group', data);
export const joinGroup       = (data)    => api.post('/groups/join-group', data);
export const getMyGroups     = ()        => api.get('/groups/my-groups');
export const leaveGroup      = (groupId) => api.post(`/groups/${groupId}/leave`);
export const getGroupDetails = (groupId) => api.get(`/groups/${groupId}`);

// ── Expenses ─────────────────────────────────────────────────────────────────
export const createExpense    = (groupId, data) => api.post(`/expenses/${groupId}/create-expense`, data);
export const getGroupExpenses = (groupId)       => api.get(`/expenses/${groupId}/expenses`);
export const getMyExpenses    = ()              => api.get('/expenses/my-expenses');
export const getGroupSummary  = (groupId)       => api.get(`/expenses/${groupId}/summary`);
export const deleteExpense    = (expenseId)     => api.delete(`/expenses/${expenseId}`);
export const settleExpense    = (expenseId, userId) =>
  api.patch(`/expenses/${expenseId}/settle`, { userId });

// ── Two-party settlement handshake ───────────────────────────────────────────
// Step 1: Debtor clicks "Settle" → creates a pending settlement
export const initiateSettlement = (groupId, data) =>
  api.post(`/expenses/${groupId}/initiate-settlement`, data);

// Step 2: Creditor clicks "Confirm" → finalises the settlement
export const confirmSettlement = (groupId, data) =>
  api.post(`/expenses/${groupId}/confirm-settlement`, data);

// Either party may cancel a pending settlement before it is confirmed
export const cancelSettlement = (groupId, data) =>
  api.delete(`/expenses/${groupId}/cancel-settlement`, { data });