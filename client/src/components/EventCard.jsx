import { Link } from 'react-router-dom';
import { Calendar, Users, Tag, ArrowUpRight, MapPin } from 'lucide-react';

const EVENT_TYPE_BADGE = {
  hackathon: 'badge-hackathon',
  bootcamp: 'badge-bootcamp',
  competition: 'badge-competition',
  workshop: 'badge-workshop',
  seminar: 'badge-seminar',
};

const formatDate = (dt) => {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const EventCard = ({ event }) => {
  const badgeClass = EVENT_TYPE_BADGE[event.type] || 'badge-seminar';
  const organizerName = event.organizer_id?.name || event.organizer?.name || 'Unknown';
  const pct = event.capacity
    ? Math.min(Math.round(((event.current_registrations ?? 0) / event.capacity) * 100), 100)
    : 0;

  return (
    <Link
      to={`/events/${event._id}`}
      className="card card-hover"
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textDecoration: 'none', position: 'relative' }}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: '#1a1a1a' }}>
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(22,22,22,0.7) 0%, transparent 60%)',
        }} />

        {/* Status badge */}
        {event.status && event.status !== 'upcoming' && (
          <span
            className={`badge badge-${event.status}`}
            style={{ position: 'absolute', top: '10px', right: '10px', backdropFilter: 'blur(10px)' }}
          >
            {event.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}>
        {/* Type */}
        <span className={`badge ${badgeClass}`}>{event.type}</span>

        {/* Title */}
        <h3 style={{
          fontSize: '0.9375rem', fontWeight: '600',
          color: 'var(--text-primary)', lineHeight: '1.4',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          letterSpacing: '-0.01em',
        }}>
          {event.title}
        </h3>

        {/* Meta */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            <Calendar size={11} />
            <span>{formatDate(event.date_time)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            <Users size={11} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{organizerName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            <MapPin size={11} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location || 'Main Auditorium'}</span>
          </div>

          {/* Capacity mini bar */}
          {event.capacity > 0 && (
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                  {event.current_registrations ?? 0}/{event.capacity}
                </span>
                <span style={{ fontSize: '0.6875rem', color: pct >= 90 ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: pct >= 90 ? 'var(--danger)' : 'var(--accent)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover arrow */}
      <div style={{
        position: 'absolute', top: '10px', left: '10px',
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'rgba(124,111,255,0.15)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.2s ease',
      }} className="card-arrow">
        <ArrowUpRight size={14} style={{ color: 'var(--accent)' }} />
      </div>

      <style>{`
        a:hover .card-arrow { opacity: 1 !important; }
      `}</style>
    </Link>
  );
};

export default EventCard;
