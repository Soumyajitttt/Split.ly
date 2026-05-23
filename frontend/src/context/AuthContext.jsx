import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const BASE = 'https://split-ly-167a.onrender.com/api/v1.0.0';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // wait before rendering routes

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (!storedUser || !token) {
        setLoading(false);
        return;
      }

      try {
        // Verify the access token is still valid
        await axios.get(`${BASE}/users/health-auth`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUser(JSON.parse(storedUser)); // token is good
      } catch (err) {
        if (err.response?.status === 401) {
          // Access token expired — try refreshing via httpOnly cookie
          try {
            const { data } = await axios.post(
              `${BASE}/users/refresh-token`,
              {},
              { withCredentials: true }
            );
            localStorage.setItem('accessToken', data.data.accessToken);
            setUser(JSON.parse(storedUser));
          } catch {
            // Refresh also failed — clear everything
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  // Don't render routes until session check is complete
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