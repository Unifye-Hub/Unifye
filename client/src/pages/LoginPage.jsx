import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, getMyProfile } from '../services/eventService';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(form);
      const { token } = res.data;
      localStorage.setItem('token', token);
      const profileRes = await getMyProfile();
      const profileData = profileRes.data.data.profile;
      const user = profileData.organizer_id || profileData.profile_id;
      login({ token, user });
      toast.success('Welcome back!');
      const role = res.data.data?.user?.role;
      if (role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
            width: '44px', height: '44px',
            background: 'var(--accent)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 24px rgba(124,111,255,0.4)',
          }}>
            <Zap size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sign in to Unifye Events</p>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email or Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                placeholder="you@example.com or username"
                className="input-premium"
              />
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
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-premium"
                  style={{ paddingRight: '2.75rem' }}
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
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '1.25rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: '500', textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
