import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import { Input, FormGroup, RedDot, Spinner } from '../components/ui';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

  const [form, setForm] = useState({ fullname: '', username: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = async () => {
    if (!form.fullname || !form.username || !form.email || !form.password) {
      showToast('All fields are required');
      return;
    }
    if (form.password.length < 6) { showToast('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      if (data.success) {
        showToast('Account created! Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed');
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
            onClick={() => navigate('/login')}
          >
            <ArrowLeftIcon style={{ width: 15, height: 15 }} />
            Snehashish Chodna
          </button>
        }
      />

      <div className="auth-body">
        {/* Left decorative panel */}
        <div className="auth-left">
          <div className="auth-eyebrow"><RedDot /> Free forever</div>
          <div className="auth-headline">
            START<br />SPLITTING<br /><span className="red-line">TODAY</span>
          </div>
          <p className="auth-desc">
            Set up in 30 seconds. Add your first group, log your first expense, and see the magic immediately.
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">◈</div>
              Unlimited groups
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">▦</div>
              Smart settlement algorithm
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">∞</div>
              Zero ads, zero fees
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-title">Create Account</div>
            <div className="auth-card-sub">Join Split.ly for free</div>

            <div className="auth-form">
              <FormGroup label="Full Name">
                <Input placeholder="Your name" value={form.fullname} onChange={set('fullname')} />
              </FormGroup>

              <FormGroup label="Username">
                <Input placeholder="your_username" value={form.username} onChange={set('username')} />
              </FormGroup>

              <FormGroup label="Email">
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </FormGroup>

              <FormGroup label="Password">
                <div className="password-wrapper">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    onKeyDown={e => e.key === 'Enter' && handleSignup()}
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

              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', letterSpacing: 0.3, lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <a style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => showToast('Terms coming soon')}>Terms</a>
                {' '}and{' '}
                <a style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => showToast('Privacy policy coming soon')}>Privacy Policy</a>.
              </p>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 14, borderRadius: 14 }}
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? <Spinner /> : 'Create Account →'}
              </button>

              <div className="auth-divider"><span>or</span></div>

              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 14, borderRadius: 14, gap: 10 }}
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
              Already have an account?{' '}
              <Link to="/login" className="red-link">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}