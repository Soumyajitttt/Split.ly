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
          { withCredentials: true, timeout: 20000 }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        // Only a *confirmed* 401 from the refresh endpoint itself means the
        // session is actually gone (refresh token invalid/expired/reused).
        // A network error, timeout, or 5xx — e.g. a free-tier backend that's
        // still waking up after the app sat unused for a while — is
        // transient: surface the original request's error but leave the
        // stored session alone so the user isn't logged out over a slow
        // or flaky request. They (or the next request) can just retry.
        if (refreshErr.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth:logout')); // lets AuthContext react cleanly
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Keep the backend warm (free tier spins down after ~15 min idle) ───────────
// A plain interval isn't enough on its own: browsers throttle or fully
// suspend timers in backgrounded/inactive tabs, so it can simply stop firing
// while the app is "unused" — exactly when the backend is most likely to have
// gone to sleep. Ping on an interval for long-open tabs, AND the instant the
// tab/app regains focus or visibility, so the backend is already warming up
// before the user's next real request goes out.
let lastPing = 0;
function pingHealth() {
  const now = Date.now();
  if (now - lastPing < 60 * 1000) return; // de-dupe rapid focus/visibility events
  lastPing = now;
  fetch(`${BASE}/users/health`).catch(() => {});
}

setInterval(pingHealth, 10 * 60 * 1000);

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pingHealth();
  });
  window.addEventListener('focus', pingHealth);
  window.addEventListener('online', pingHealth);
}

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