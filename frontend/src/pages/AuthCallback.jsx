import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    console.log('Full URL:', window.location.href);
    console.log('Token:', token);
    console.log('User:', userStr);
    console.log('Error:', error);

    if (error) {
      showToast('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
        showToast(`Welcome, ${user.fullname || user.username}!`);
        navigate('/dashboard');
      } catch {
        showToast('Authentication error. Please try again.');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: 20, background: 'var(--black)'
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3 }}>
        Split<span style={{ color: 'var(--red)' }}>X</span>
      </div>
      <Spinner />
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--grey-600)', letterSpacing: 1 }}>
        Signing you in...
      </div>
    </div>
  );
}
