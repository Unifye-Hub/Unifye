import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupApi, getMyProfile } from '../services/eventService';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Users, Building2 } from 'lucide-react';

const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'participant' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signupApi(form);
      const { token } = res.data;
      localStorage.setItem('token', token);
      const profileRes = await getMyProfile();
      const user = profileRes.data.data.profile;
      login({ token, user });
      toast.success('Account created! Welcome 🎉');
      if (form.role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

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
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="input-premium"
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input-premium"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="input-premium"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
