import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const BASE = import.meta.env.VITE_API_BASE_URL;

// A cold free-tier backend can take 30-50s to wake up. A plain network error,
// timeout, or 5xx during that window must NOT be treated as "this session is
// invalid" — only a definitive 401 from the refresh endpoint itself means the
// session is actually gone. Everything else gets a couple of retries so a
// slow wake-up doesn't masquerade as a logout.
const REQUEST_TIMEOUT = 20000;
const REFRESH_RETRY_DELAYS = [0, 3000, 8000];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // wait before rendering routes

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!storedUser || !token) {
      setLoading(false);
      return;
    }

    let parsedUser;
    try { parsedUser = JSON.parse(storedUser); } catch { parsedUser = null; }
    if (!parsedUser) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    // Trust what's on disk immediately — no "logged out" flash while we
    // validate in the background. Routes render right away.
    setUser(parsedUser);
    setLoading(false);

    const verifySession = async () => {
      try {
        await axios.get(`${BASE}/users/health-auth`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          timeout: REQUEST_TIMEOUT,
        });
        return; // access token still valid — nothing else to do
      } catch (err) {
        // A clean, confirmed 401 means the access token is genuinely expired —
        // worth trying a refresh. Anything else (network error, timeout, 5xx
        // from a cold-starting backend) is ambiguous, so give it the same
        // benefit of the doubt and attempt a refresh too, rather than assuming
        // the worst. Either way we never clear the session here just because
        // this one check failed.
      }

      for (let attempt = 0; attempt < REFRESH_RETRY_DELAYS.length; attempt++) {
        if (REFRESH_RETRY_DELAYS[attempt]) await wait(REFRESH_RETRY_DELAYS[attempt]);
        try {
          const { data } = await axios.post(
            `${BASE}/users/refresh-token`,
            {},
            { withCredentials: true, timeout: REQUEST_TIMEOUT }
          );
          localStorage.setItem('accessToken', data.data.accessToken);
          return; // recovered
        } catch (refreshErr) {
          if (refreshErr.response?.status === 401) {
            // The refresh token itself is confirmed invalid/expired/reused —
            // this, and only this, is a real logout.
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            return;
          }
          // Network error / timeout / 5xx — keep retrying; if we run out of
          // attempts, leave the session alone. The request interceptor in
          // api/index.js will keep trying to refresh on the next real call.
        }
      }
    };

    verifySession();
  }, []);

  // A real API call elsewhere (api/index.js) that gets a confirmed-invalid
  // refresh dispatches this so every mounted consumer stays in sync.
  useEffect(() => {
    const onForceLogout = () => setUser(null);
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, []);

  const login = (userData, token) => {
    try { sessionStorage.removeItem('splitly.welcome'); } catch { /* ignore */ }
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  // Don't render routes until we've decided whether there's a session to restore.
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1rem',
        color: '#888'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);