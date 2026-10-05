import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({ baseURL: BASE, withCredentials: true });

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Session refresh ──────────────────────────────────────────────────────────
// The access token is short-lived (15m). After the app has sat idle, the first
// thing the UI does is fire several requests at once, and ALL of them used to
// hit 401 and each start their own refresh. With one refresh token, those
// parallel refreshes raced and the "losers" were treated as a dead session ->
// logout. Now every caller shares ONE in-flight refresh.
const REFRESH_TIMEOUT = 30000;
const REFRESH_RETRY_DELAYS = [0, 3000, 8000];
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function tokenExpiresInMs(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)).exp * 1000 - Date.now();
  } catch {
    return 0;
  }
}

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout')); // lets AuthContext react cleanly
}

let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let lastErr;
      for (const delay of REFRESH_RETRY_DELAYS) {
        if (delay) await wait(delay);
        try {
          const { data } = await axios.post(
            `${BASE}/users/refresh-token`,
            {},
            { withCredentials: true, timeout: REFRESH_TIMEOUT }
          );
          localStorage.setItem('accessToken', data.data.accessToken);
          return data.data.accessToken;
        } catch (err) {
          lastErr = err;
          // Only a *confirmed* 401 from the refresh endpoint means the session is
          // really gone. Network errors / timeouts / 5xx (e.g. a free-tier backend
          // still waking up) are transient: retry, and never log out over them.
          if (err.response?.status === 401) {
            clearSession();
            break;
          }
        }
      }
      throw lastErr;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Refresh ahead of time if the access token is expired / about to expire.
export async function ensureFreshToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) return;
  if (tokenExpiresInMs(token) > 60 * 1000) return;
  await refreshSession();
}

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshErr) {
        // Confirmed-dead session -> back to login. Transient failures just
        // surface the original error and leave the stored session alone.
        if (refreshErr.response?.status === 401) {
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
  // When the app comes back (tab refocused, laptop woken, network restored),
  // renew an expired access token once, up front, instead of letting a burst of
  // requests discover it the hard way.
  const onReturn = () => {
    pingHealth();
    ensureFreshToken().catch(() => {});
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onReturn();
  });
  window.addEventListener('focus', onReturn);
  window.addEventListener('online', onReturn);
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