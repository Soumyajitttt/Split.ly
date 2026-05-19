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

              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, borderRadius: 14, gap: 10 }}
                onClick={handleGoogleAuth}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>G</span>
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