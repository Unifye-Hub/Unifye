import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { EventCardSkeleton, EmptyState } from '../components/Loader';
import { getAllEvents } from '../services/eventService';

const EVENT_TYPES = ['all', 'hackathon', 'bootcamp', 'competition', 'workshop', 'seminar'];

const HomePage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await getAllEvents(params);
      const data = res.data.data;
      setEvents(data.events);
      setTotalPages(data.totalPages || 1);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [debouncedSearch, typeFilter, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.25rem 4rem' }}>
        
        {/* Organizer Quick Access Banner */}
        {user?.role === 'organizer' && (
          <div style={{ 
            marginBottom: '3rem', 
            background: 'linear-gradient(to right, rgba(255, 75, 75, 0.1), rgba(255, 42, 95, 0.05))',
            border: '1px solid rgba(255, 75, 75, 0.2)',
            borderRadius: '16px', padding: '1.5rem 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Organizer Mode Active</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>You are viewing the public feed. Go to your dashboard to manage or create new events.</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto mt-2 md:mt-0">
              <Link to="/organizer" className="btn-secondary" style={{ padding: '0.625rem 1.25rem', textDecoration: 'none', flex: '1 1 140px', justifyContent: 'center', whiteSpace: 'nowrap' }}>Go to Dashboard</Link>
              <Link to="/create-event" style={{ background: '#FF4B4B', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '100px', fontWeight: '600', textDecoration: 'none', fontSize: '0.875rem', flex: '1 1 140px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>+ Create Event</Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{ marginBottom: '3rem', maxWidth: '560px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent-dim)', border: '1px solid rgba(124,111,255,0.2)',
            borderRadius: '999px', padding: '0.25rem 0.75rem 0.25rem 0.5rem',
            marginBottom: '1.25rem',
          }}>
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '500' }}>
              Events for builders
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: '700', letterSpacing: '-0.03em',
            lineHeight: '1.15',
            color: 'var(--text-primary)',
            marginBottom: '0.875rem',
          }}>
            Discover events<br />
            <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>that move you forward</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
            Find hackathons, bootcamps, competitions, and workshops — all in one place.
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div style={{
          display: 'flex', gap: '0.625rem', marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute', left: '0.875rem',
                top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-premium"
              style={{ paddingLeft: '2.375rem' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <SlidersHorizontal
              size={14}
              style={{
                position: 'absolute', left: '0.875rem',
                top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', pointerEvents: 'none',
              }}
            />
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="input-premium"
              style={{ paddingLeft: '2.375rem', paddingRight: '2rem', cursor: 'pointer', minWidth: '160px' }}
            >
              {EVENT_TYPES.map(t => (
                <option key={t} value={t} style={{ background: 'var(--bg-card)' }}>
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {EVENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`pill ${typeFilter === t ? 'pill-active' : ''}`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            message="No events found"
            sub="Try a different search or filter"
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {events.map(event => <EventCard key={event._id} event={event} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginTop: '3rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', padding: '0 0.5rem' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
