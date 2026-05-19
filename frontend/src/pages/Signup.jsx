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
            Sign In
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
            <div className="auth-card-sub">Join SplitX for free</div>

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
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>G</span>
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