import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, BookOpen, Layers, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPublicProfile } from '../services/eventService';
import { EmptyState, Spinner } from '../components/Loader';
import EventCard from '../components/EventCard';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!user?._id) return;
        const profileRes = await getPublicProfile(user._id);
        setProfile(profileRes.data.data.profile);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user]);

  const skills = profile?.skills_list || [];
  const initials = (profile?.full_name || 'U')[0]?.toUpperCase();

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            My Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { label: 'Events Joined', value: profile?.events?.length || 0, icon: CalendarDays, color: 'var(--accent)' },
            { label: 'Skills Listed', value: skills.length, icon: Star, color: '#fbbf24' },
            { label: 'Profile Views', value: '—', icon: TrendingUp, color: 'var(--success)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>{label}</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Profile Card */}
          <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
              {profile?.profile_pic_url && !profile.profile_pic_url.includes('default') ? (
                <img
                  src={profile.profile_pic_url}
                  alt="Profile"
                  style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', marginBottom: '0.75rem', border: '2px solid var(--border)' }}
                />
              ) : (
                <div style={{
                  width: '64px', height: '64px', borderRadius: '18px',
                  background: 'var(--accent-dim)', border: '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)',
                  marginBottom: '0.75rem',
                }}>
                  {initials}
                </div>
              )}
              <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {profile?.full_name || 'Your Name'}
              </p>
              <span className="badge badge-upcoming" style={{ fontSize: '0.6875rem' }}>Participant</span>
            </div>

            {profile?.bio && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem', textAlign: 'center' }}>
                {profile.bio}
              </p>
            )}

            {skills.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Skills
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {skills.map(s => (
                    <span key={s} className="badge badge-seminar">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile?.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                <BookOpen size={13} /> Portfolio
              </a>
            )}

            <Link
              to="/profile"
              className="btn-secondary"
              style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: '0.625rem', textDecoration: 'none' }}
            >
              Edit Profile
            </Link>
          </div>

          {/* Events section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={16} style={{ color: 'var(--text-tertiary)' }} />
                Registered Events
              </h2>
              <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
                Browse →
              </Link>
            </div>

            {profile?.events && profile.events.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {profile.events.map(ev => (
                  <EventCard key={ev._id} event={ev} />
                ))}
              </div>
            ) : (
              <div className="card" style={{ borderStyle: 'dashed' }}>
                <EmptyState
                  icon={Layers}
                  message="No registered events yet"
                  sub="Browse and register for events you are interested in"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
