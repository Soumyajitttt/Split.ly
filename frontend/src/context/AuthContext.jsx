import { createContext, useContext, useState, useEffect } from 'react';
import { ensureFreshToken } from '../api';

const AuthContext = createContext(null);

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

    // Renew the access token up front if it expired while the app was closed.
    // Shares the single in-flight refresh with api/index.js, so it can't race
    // the page's own requests. A confirmed-dead session dispatches 'auth:logout';
    // transient failures (cold backend, offline) leave the session alone.
    const verifySession = async () => {
      try { await ensureFreshToken(); } catch { /* transient — keep session */ }
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