import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { completeProfile, getMyProfile } from '../services/eventService';
import toast from 'react-hot-toast';
import { Users, Building2, Zap, AlertCircle } from 'lucide-react';

const RoleSelectionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const token = searchParams.get('token');
  const googlePic = searchParams.get('pic') || '';

  const [role, setRole] = useState('participant');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Store token immediately so API calls work
  if (token && !localStorage.getItem('token')) {
    localStorage.setItem('token', token);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'organizer' && !companyName.trim()) {
      setError('Please enter your organization name.');
      return;
    }

    setLoading(true);
    try {
      await completeProfile({
        role,
        company_name: role === 'organizer' ? companyName.trim() : undefined,
        profilePicUrl: googlePic || undefined,
      });

      // Now fetch the full profile to populate auth context
      const profileRes = await getMyProfile();
      const profileData = profileRes.data.data.profile;
      const baseUser = profileData.organizer_id || profileData.profile_id;
      const profilePic = profileData.profile_pic_url || profileData.logo_url || null;

      login({ token, user: { ...baseUser, profilePic } });
      toast.success('Welcome to Unifye Events!');

      if (role === 'organizer') navigate('/organizer', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Invalid session. Please <a href="/login" style={{ color: 'var(--accent)' }}>log in again</a>.</p>
      </div>
    );
  }

  return (
    <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(124,111,255,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '44px', height: '44px', background: 'var(--accent)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 0 24px rgba(124,111,255,0.4)',
          }}>
            <Zap size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            One last step
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            How will you use Unifye Events?
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: 'var(--radius)',
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                fontSize: '0.8rem', color: '#f87171',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: 'participant', label: 'Participant', icon: Users, desc: 'Join and attend events' },
                { value: 'organizer', label: 'Organizer', icon: Building2, desc: 'Create and manage events' },
              ].map(({ value, label, icon: Icon, desc }) => {
                const isActive = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRole(value); setError(''); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '1rem', borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      background: isActive ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left',
                    }}
                  >
                    <Icon size={20} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)', marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>{desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Organizer extra field */}
            {role === 'organizer' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => { setCompanyName(e.target.value); setError(''); }}
                  placeholder="e.g. Rishihood University"
                  className="input-premium"
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', marginTop: '0.25rem' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Setting up...
                </>
              ) : 'Continue'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RoleSelectionPage;
