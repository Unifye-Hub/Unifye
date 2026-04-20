import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupApi, getMyProfile } from '../services/eventService';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Users, Building2, AlertCircle } from 'lucide-react';

const errorStyle = {
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  marginTop: '0.375rem', fontSize: '0.75rem', color: '#f87171',
  lineHeight: 1.3,
};

const FieldError = ({ msg }) => {
  if (!msg) return null;
  return (
    <div style={errorStyle}>
      <AlertCircle size={12} style={{ flexShrink: 0 }} />
      {msg}
    </div>
  );
};

const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'participant' });
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
    if (m.includes('username')) return { username: msg };
    if (m.includes('email')) return { email: msg };
    if (m.includes('password')) return { password: msg };
    if (m.includes('name') && !m.includes('username')) return { name: msg };
    return { form: msg };
  };

  // Client-side validation before hitting the API
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    else if (form.username.length < 3) errs.username = 'Username must be at least 3 characters.';
    else if (!/^[a-z0-9_]+$/.test(form.username)) errs.username = 'Only letters, numbers, and underscores.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await signupApi(form);
      const { token } = res.data;
      localStorage.setItem('token', token);
      const profileRes = await getMyProfile();
      const profileData = profileRes.data.data.profile;
      const baseUser = profileData.organizer_id || profileData.profile_id;
      const profilePic = profileData.profile_pic_url || profileData.logo_url || null;
      login({ token, user: { ...baseUser, profilePic } });
      toast.success('Account created! Welcome!');
      if (form.role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setErrors(parseError(msg));
    } finally {
      setLoading(false);
    }
  };

  const inputErr = (field) => errors[field]
    ? { borderColor: '#f87171', boxShadow: '0 0 0 1px rgba(248,113,113,0.3)' }
    : {};

  return (
    <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(124,111,255,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '44px', height: '44px', background: 'var(--accent)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 0 24px rgba(124,111,255,0.4)',
          }}>
            <Zap size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Create an account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Join thousands of builders on Unifye Events</p>
        </div>

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

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Your full name"
                className="input-premium"
                style={inputErr('name')}
              />
              <FieldError msg={errors.name} />
            </div>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.875rem', pointerEvents: 'none' }}>@</span>
                <input
                  type="text"
                  minLength={3}
                  maxLength={30}
                  autoComplete="off"
                  value={form.username}
                  onChange={e => setField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_username"
                  className="input-premium"
                  style={{ paddingLeft: '1.75rem', ...inputErr('username') }}
                />
              </div>
              <FieldError msg={errors.username} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="you@example.com"
                className="input-premium"
                style={inputErr('email')}
              />
              <FieldError msg={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-premium"
                  style={{ paddingRight: '2.75rem', ...inputErr('password') }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            {/* Role selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                I'm joining as a...
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { value: 'participant', label: 'Participant', icon: Users, desc: 'Join events' },
                  { value: 'organizer', label: 'Organizer', icon: Building2, desc: 'Create events' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '0.75rem', borderRadius: 'var(--radius)',
                      border: `1px solid ${form.role === value ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.role === value ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left',
                    }}
                  >
                    <Icon size={15} style={{ color: form.role === value ? 'var(--accent)' : 'var(--text-tertiary)', marginBottom: '0.375rem' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: form.role === value ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{desc}</span>
                  </button>
                ))}
              </div>
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
                  Creating account...
                </>
              ) : 'Create account'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Google OAuth */}
            <a
              href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001'}/auth/google`}
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '500', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SignupPage;
