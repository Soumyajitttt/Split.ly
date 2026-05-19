import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import { Input, FormGroup, RedDot, Spinner } from '../components/ui';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) { showToast('Enter your email'); return; }
    if (!password) { showToast('Enter your password'); return; }
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      if (data.success) {
        login(data.user, data.accessToken);
        showToast('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = '/api/v1.0.0/users/auth/google';
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav
        actions={
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('/')}
          >
            <ArrowLeftIcon style={{ width: 15, height: 15 }} />
            Home
          </button>
        }
      />

      <div className="auth-body">
        {/* Left decorative panel */}
        <div className="auth-left">
          <div className="auth-eyebrow"><RedDot /> Welcome back</div>
          <div className="auth-headline">
            PICK UP<br />WHERE YOU<br /><span className="red-line">LEFT OFF</span>
          </div>
          <p className="auth-desc">
            Your groups, expenses, and settlements — exactly where you left them.
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">◈</div>
              All your groups synced
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">▣</div>
              Live settlement calculations
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">⬡</div>
              Expense history preserved
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-title">Sign In</div>
            <div className="auth-card-sub">Access your account</div>

            <div className="auth-form">
              <FormGroup label="Email">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </FormGroup>

              <FormGroup label="Password">
                <div className="password-wrapper">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showPass
                      ? <EyeSlashIcon style={{ width: 16, height: 16 }} />
                      : <EyeIcon style={{ width: 16, height: 16 }} />
                    }
                  </button>
                </div>
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => showToast('Password reset coming soon')}
                >
                  Forgot password?
                </a>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, borderRadius: 14 }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <Spinner /> : 'Sign In →'}
              </button>

              <div className="auth-divider"><span>or</span></div>

              {/* Updated Google Login Button with Official SVG Icon */}
              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, borderRadius: 14, gap: 10 }}
                onClick={handleGoogleAuth}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="auth-footer-text" style={{ marginTop: 24 }}>
              No account?{' '}
              <Link to="/signup" className="red-link">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}