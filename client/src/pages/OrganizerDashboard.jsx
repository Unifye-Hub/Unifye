import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Trash2, Search, CalendarDays, MapPin, Edit2, ChevronDown, ChevronUp, BarChart3, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, deleteEvent, getEventParticipants } from '../services/eventService';
import { getGroupsByEvent } from '../services/groupService';
import { Spinner, EmptyState } from '../components/Loader';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['All', 'hackathon', 'bootcamp', 'competition', 'workshop', 'seminar'];

const CHART_COLORS = {
  filled: '#7C6FFF',
  remaining: 'rgba(255,255,255,0.08)',
  individual: '#3ecf8e',
  group: '#7C6FFF',
};

// ─── Custom Pie Tooltip ─────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <span style={{ fontWeight: 600 }}>{d.name}:</span> {d.value}
    </div>
  );
};

// ─── Custom Bar Tooltip ─────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <span style={{ fontWeight: 600 }}>{label}:</span> {payload[0].value} members
    </div>
  );
};

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
  <div style={{
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '1rem',
    textAlign: 'center', flex: 1, minWidth: '100px',
  }}>
    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: accent || 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
  </div>
);

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');

  // Analytics Modal
  const [analyticsModal, setAnalyticsModal] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [modalGroups, setModalGroups] = useState([]);
  const [modalTab, setModalTab] = useState('analytics');
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getAllEvents({ limit: 100 });
      const all = res.data.data.events || [];
      const myEvents = all.filter(e => e.organizer_id?._id === user?._id || e.organizer_id === user?._id);
      setEvents(myEvents);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      toast.success('Event deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleViewAnalytics = async (event) => {
    setAnalyticsModal(event);
    setLoadingAnalytics(true);
    setModalTab('analytics');
    setExpandedGroup(null);
    try {
      const [partRes, groupRes] = await Promise.allSettled([
        getEventParticipants(event._id),
        (event.eventType === 'GROUP' || event.eventType === 'BOTH')
          ? getGroupsByEvent(event._id)
          : Promise.resolve(null),
      ]);
      setParticipants(partRes.status === 'fulfilled' ? partRes.value.data.data.participants || [] : []);
      setModalGroups(groupRes.status === 'fulfilled' && groupRes.value ? groupRes.value.data.data.groups || [] : []);
    } catch { toast.error('Failed to load analytics'); setParticipants([]); }
    finally { setLoadingAnalytics(false); }
  };

  // ── Computed analytics ──────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!analyticsModal) return null;

    const totalRegistrations = participants.length;
    const capacity = analyticsModal.capacity || 0;
    const remaining = Math.max(0, capacity - totalRegistrations);
    const fillPct = capacity ? Math.round((totalRegistrations / capacity) * 100) : 0;

    const individualCount = participants.filter(p => p.registration_type === 'individual').length;
    const groupCount = participants.filter(p => p.registration_type === 'group').length;

    const totalTeams = modalGroups.length;
    const lockedTeams = modalGroups.filter(g => g.status === 'LOCKED').length;
    const teamSizes = modalGroups.map(g => ({
      name: g.name.length > 12 ? g.name.slice(0, 12) + '...' : g.name,
      members: g.members?.length || 0,
    }));

    const seatData = [
      { name: 'Seats Filled', value: totalRegistrations },
      { name: 'Seats Remaining', value: remaining },
    ];

    const typeData = (individualCount > 0 || groupCount > 0)
      ? [
          { name: 'Individual', value: individualCount },
          { name: 'Team', value: groupCount },
        ]
      : [];

    return { totalRegistrations, capacity, remaining, fillPct, individualCount, groupCount, totalTeams, lockedTeams, teamSizes, seatData, typeData };
  }, [analyticsModal, participants, modalGroups]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeType === 'All' || e.type.toLowerCase() === activeType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [events, searchQuery, activeType]);

  const hasGroups = analyticsModal && (analyticsModal.eventType === 'GROUP' || analyticsModal.eventType === 'BOTH');

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Top Search Bar */}
        <div style={{ marginBottom: '2.5rem', maxWidth: '400px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search Unifye..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          />
        </div>

        {/* Heading & Create Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Events
          </h1>
          <Link
            to="/create-event"
            style={{
              background: 'linear-gradient(135deg, #FF4B4B 0%, #FF2A5F 100%)',
              color: '#fff', textDecoration: 'none',
              padding: '0.625rem 1.25rem', borderRadius: '100px',
              fontWeight: '600', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(255, 75, 75, 0.4)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={18} /> Create
          </Link>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {EVENT_TYPES.map(type => {
            const isActive = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '100px',
                  border: isActive ? 'none' : '1px solid var(--border)',
                  background: isActive ? '#fff' : 'var(--bg-card)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.875rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Event Grid */}
        {loading ? <Spinner /> : filteredEvents.length === 0 ? (
          <div className="glass-strong" style={{ padding: '4rem', borderRadius: '24px', textAlign: 'center' }}>
            <EmptyState icon={CalendarDays} message="No events matched" sub="Try adjusting your filters or create a new event." />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {filteredEvents.map(event => {
              const bgCover = event.cover_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';
              const formattedDate = new Date(event.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={event._id} className="glass-strong" style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  {/* Image Header */}
                  <div style={{ position: 'relative', height: '190px', width: '100%' }}>
                    <img src={bgCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
                    <div style={{
                      position: 'absolute', top: '16px', left: '16px',
                      background: 'rgba(255,255,255,0.95)', color: '#000',
                      padding: '0.35rem 0.75rem', borderRadius: '100px',
                      fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase'
                    }}>
                      {event.type}
                    </div>
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={`/edit-event/${event._id}`}
                        style={{
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          width: '36px', height: '36px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-secondary)', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'transform 0.2s, color 0.2s', textDecoration: 'none'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        title="Edit Event"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(event._id)}
                        style={{
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          width: '36px', height: '36px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ef4444', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.3 }}>
                      {event.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <CalendarDays size={16} color="#FF4B4B" />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formattedDate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={16} color="#FF4B4B" />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{event.location || 'Main Auditorium'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewAnalytics(event)}
                      style={{
                        marginTop: 'auto', width: '100%',
                        background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0.875rem', borderRadius: '12px',
                        color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem',
                        transition: 'background 0.2s', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                    >
                      <BarChart3 size={16} /> View Analytics ({event.current_registrations || 0})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  ANALYTICS MODAL                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {analyticsModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setAnalyticsModal(null)}
        >
          <div
            className="glass-strong"
            style={{ width: '100%', maxWidth: '720px', borderRadius: 'var(--radius-xl)', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {analyticsModal.title}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  Event Analytics & Management
                </p>
              </div>
              <button
                onClick={() => setAnalyticsModal(null)}
                style={{ padding: '0.375rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '0.25rem' }}>
              {[
                { key: 'analytics', label: 'Analytics' },
                { key: 'participants', label: `Participants (${participants.length})` },
                ...(hasGroups ? [{ key: 'groups', label: `Groups (${modalGroups.length})` }] : []),
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setModalTab(tab.key)}
                  style={{
                    flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'calc(var(--radius) - 2px)',
                    background: modalTab === tab.key ? 'var(--accent)' : 'transparent',
                    color: modalTab === tab.key ? '#fff' : 'var(--text-secondary)',
                    border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingAnalytics ? <Spinner /> : (
                <>
                  {/* ═══ Analytics Tab ═══ */}
                  {modalTab === 'analytics' && analytics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                      {/* Stats Cards Row */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <StatCard label="Registered" value={analytics.totalRegistrations} accent="var(--accent)" />
                        <StatCard label="Capacity" value={analytics.capacity} />
                        <StatCard label="Remaining" value={analytics.remaining} accent={analytics.remaining === 0 ? 'var(--danger)' : 'var(--success)'} />
                        {hasGroups && <StatCard label="Teams" value={analytics.totalTeams} accent="var(--accent)" />}
                      </div>

                      {/* Fill percentage bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Registration Progress</span>
                          <span style={{ fontSize: '0.75rem', color: analytics.fillPct >= 90 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600 }}>{analytics.fillPct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${analytics.fillPct}%`,
                            background: analytics.fillPct >= 90
                              ? 'linear-gradient(90deg, var(--danger), #ff9a9a)'
                              : 'linear-gradient(90deg, var(--accent), #a78bfa)',
                            borderRadius: '999px', transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>

                      {/* Charts Row */}
                      <div className={`grid gap-4 ${hasGroups && analytics.typeData.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>

                        {/* Pie Chart — Seat Usage */}
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Seat Usage</p>
                          {analytics.capacity === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '2rem 0' }}>No capacity set</p>
                          ) : (
                            <ResponsiveContainer width="100%" height={180}>
                              <PieChart>
                                <Pie
                                  data={analytics.seatData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  <Cell fill={CHART_COLORS.filled} />
                                  <Cell fill={CHART_COLORS.remaining} />
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS.filled }} />
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Filled ({analytics.totalRegistrations})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Remaining ({analytics.remaining})</span>
                            </div>
                          </div>
                        </div>

                        {/* Pie Chart — Registration Type (only if both types exist) */}
                        {analytics.typeData.length > 0 && (
                          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Registration Type</p>
                            <ResponsiveContainer width="100%" height={180}>
                              <PieChart>
                                <Pie
                                  data={analytics.typeData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  <Cell fill={CHART_COLORS.individual} />
                                  <Cell fill={CHART_COLORS.group} />
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS.individual }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Individual ({analytics.individualCount})</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS.group }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Team ({analytics.groupCount})</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bar Chart — Team Sizes (only for group events with teams) */}
                      {hasGroups && analytics.teamSizes.length > 0 && (
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Team Sizes</p>
                          <ResponsiveContainer width="100%" height={Math.max(160, analytics.teamSizes.length * 40)}>
                            <BarChart data={analytics.teamSizes} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                              <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                              <Bar dataKey="members" fill={CHART_COLORS.filled} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ Participants Tab ═══ */}
                  {modalTab === 'participants' && (
                    participants.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: '2rem 0' }}>No participants yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {participants.map((reg, i) => (
                          <Link
                            key={i}
                            to={`/profile/${reg.participant_id?._id}`}
                            onClick={() => setAnalyticsModal(null)}
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent)', flexShrink: 0 }}>
                              {(reg.participant_id?.name || 'U')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{reg.participant_id?.name}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.participant_id?.email}</p>
                            </div>
                            <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '6px', background: reg.registration_type === 'group' ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-hover)', color: reg.registration_type === 'group' ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: '600' }}>
                              {reg.registration_type || 'individual'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )
                  )}

                  {/* ═══ Groups Tab ═══ */}
                  {modalTab === 'groups' && hasGroups && (
                    modalGroups.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: '2rem 0' }}>No groups formed yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {modalGroups.map(group => {
                          const isOpen = expandedGroup === group._id;
                          return (
                            <div key={group._id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                              <button
                                onClick={() => setExpandedGroup(isOpen ? null : group._id)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer', gap: '0.75rem' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={14} color="var(--accent)" />
                                  </div>
                                  <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{group.name}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{group.members?.length || 0} members · <span style={{ color: group.status === 'LOCKED' ? 'var(--accent)' : 'var(--text-tertiary)' }}>{group.status}</span></p>
                                  </div>
                                </div>
                                {isOpen ? <ChevronUp size={14} color="var(--text-tertiary)" /> : <ChevronDown size={14} color="var(--text-tertiary)" />}
                              </button>
                              {isOpen && (
                                <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                                  <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.75rem 0 0.5rem' }}>Members</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                    {(group.members || []).map((member, mi) => {
                                      const mid = member._id || member;
                                      const isLeader = mid?.toString() === (group.leaderId?._id || group.leaderId)?.toString();
                                      return (
                                        <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isLeader ? 'var(--accent)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: isLeader ? '#fff' : 'var(--text-tertiary)', flexShrink: 0 }}>
                                            {(member.name || '?')[0].toUpperCase()}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>{member.name || 'Unknown'}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</p>
                                          </div>
                                          {isLeader && <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700', flexShrink: 0 }}>Leader</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
