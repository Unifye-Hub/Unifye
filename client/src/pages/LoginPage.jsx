import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, getMyProfile } from '../services/eventService';
import { BACKEND_URL } from '../services/api';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import UnifyeDarkLogo from '../assets/UnifyeDarkLogo.png';
import UnifyeLightLogo from '../assets/UnifyeLightLogo.png';

const errorStyle = {
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  marginTop: '0.375rem', fontSize: '0.75rem', color: '#f87171',
  lineHeight: 1.3,
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = (field) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    clearError(field);
    clearError('form');
  };

  const parseError = (msg) => {
    const m = (msg || '').toLowerCase();
    // "Incorrect email/username or password" is a credential error — show as form-level
    if (m.includes('incorrect')) return { form: msg };
    // Field-specific validation errors from the backend
    if (m.includes('email') || m.includes('username')) return { identifier: msg };
    if (m.includes('password')) return { password: msg };
    return { form: msg };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await loginApi(form);
      const { token } = res.data;
      localStorage.setItem('token', token);
      const profileRes = await getMyProfile();
      const profileData = profileRes.data.data.profile;
      const baseUser = profileData.organizer_id || profileData.profile_id;
      const profilePic = profileData.profile_pic_url || profileData.logo_url || null;
      login({ token, user: { ...baseUser, profilePic } });
      toast.success('Welcome back!');
      const role = res.data.data?.user?.role;
      if (role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrors(parseError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="dot-grid"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      {/* Accent glow backdrop */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(124,111,255,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            overflow: 'hidden'
          }}>
            <img src={UnifyeLightLogo} alt="Unifye Logo" className="logo-default" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <img src={UnifyeDarkLogo} alt="Unifye Logo" className="logo-light-theme" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sign in to Unifye Events</p>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Form-level error */}
            {errors.form && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: 'var(--radius)',
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                fontSize: '0.8rem', color: '#f87171',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {errors.form}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email or Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.identifier}
                onChange={e => setField('identifier', e.target.value)}
                placeholder="you@example.com or username"
                className="input-premium"
                style={errors.identifier ? { borderColor: '#f87171', boxShadow: '0 0 0 1px rgba(248,113,113,0.3)' } : {}}
              />
              {errors.identifier && (
                <div style={errorStyle}>
                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                  {errors.identifier}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="••••••••"
                  className="input-premium"
                  style={{
                    paddingRight: '2.75rem',
                    ...(errors.password ? { borderColor: '#f87171', boxShadow: '0 0 0 1px rgba(248,113,113,0.3)' } : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                    padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <div style={errorStyle}>
                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                  {errors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Google OAuth */}
            <a
              href={`${BACKEND_URL}/auth/google`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                width: '100%', padding: '0.75rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text-primary)',
                fontSize: '0.875rem', fontWeight: 500,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '1.25rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: '500', textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>

      <style>{`
        .logo-light-theme { display: none; }
        .logo-default { display: block; }
        [data-theme='light'] .logo-light-theme { display: block; }
        [data-theme='light'] .logo-default { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
