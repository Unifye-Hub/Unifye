import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Trash2, Search, CalendarDays, MapPin, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, deleteEvent, getEventParticipants } from '../services/eventService';
import { getGroupsByEvent } from '../services/groupService';
import { Spinner, EmptyState } from '../components/Loader';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['All', 'hackathon', 'bootcamp', 'competition', 'workshop', 'seminar'];

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');

  // Participants Modal
  const [participantsModal, setParticipantsModal] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [modalGroups, setModalGroups] = useState([]);
  const [modalTab, setModalTab] = useState('participants'); // 'participants' | 'groups'
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

  const handleViewParticipants = async (event) => {
    setParticipantsModal(event);
    setLoadingParts(true);
    setModalTab('participants');
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
    } catch { toast.error('Failed to load participants'); setParticipants([]); }
    finally { setLoadingParts(false); }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeType === 'All' || e.type.toLowerCase() === activeType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [events, searchQuery, activeType]);

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Search Bar (Mockup style) */}
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
                  border: 'none',
                  background: isActive ? '#fff' : 'var(--bg-card)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.875rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}
              >
                {type}
              </button>
            )
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
                  {/* Image Header with floating absolute elements */}
                  <div style={{ position: 'relative', height: '190px', width: '100%' }}>
                    <img src={bgCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {/* Dark gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
                    
                    {/* Category Pill */}
                    <div style={{ 
                      position: 'absolute', top: '16px', left: '16px',
                      background: 'rgba(255,255,255,0.95)', color: '#000',
                      padding: '0.35rem 0.75rem', borderRadius: '100px',
                      fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase'
                    }}>
                      {event.type}
                    </div>

                    {/* Actions Container */}
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '0.5rem' }}>
                      {/* Edit Action Circle */}
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

                      {/* Delete Action Circle */}
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

                  {/* Body Content */}
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

                    {/* Action Button */}
                    <button 
                      onClick={() => handleViewParticipants(event)}
                      style={{ 
                        marginTop: 'auto', width: '100%', 
                        background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0.875rem', borderRadius: '12px',
                        color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem',
                        transition: 'background 0.2s', cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                    >
                      View Participants ({event.current_registrations || 0})
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Participants Modal */}
      {participantsModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setParticipantsModal(null)}
        >
          <div
            className="glass-strong"
            style={{ width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-xl)', padding: '1.75rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Participants</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{participantsModal.title}</p>
              </div>
              <button
                onClick={() => setParticipantsModal(null)}
                style={{ padding: '0.5rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Tabs — only for GROUP/BOTH events */}
            {(participantsModal.eventType === 'GROUP' || participantsModal.eventType === 'BOTH') && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[{ key: 'participants', label: `All Participants (${participants.length})` }, { key: 'groups', label: `Groups (${modalGroups.length})` }].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setModalTab(tab.key)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)',
                      background: modalTab === tab.key ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: modalTab === tab.key ? '#fff' : 'var(--text-secondary)',
                      border: 'none', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingParts ? <Spinner /> : (
                <>
                  {/* ── All Participants Tab ── */}
                  {(modalTab === 'participants' || participantsModal.eventType === 'INDIVIDUAL') && (
                    participants.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: '2rem 0' }}>No participants yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {participants.map((reg, i) => (
                          <Link
                            key={i}
                            to={`/profile/${reg.participant_id?._id}`}
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

                  {/* ── Groups Tab ── */}
                  {modalTab === 'groups' && (participantsModal.eventType === 'GROUP' || participantsModal.eventType === 'BOTH') && (
                    modalGroups.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: '2rem 0' }}>No groups formed yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {modalGroups.map(group => {
                          const isOpen = expandedGroup === group._id;
                          return (
                            <div key={group._id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                              {/* Group header — click to expand */}
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
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{group.members?.length || 0} members · <span style={{ color: group.status === 'CLOSED' ? 'var(--success)' : 'var(--text-tertiary)' }}>{group.status}</span></p>
                                  </div>
                                </div>
                                {isOpen ? <ChevronUp size={14} color="var(--text-tertiary)" /> : <ChevronDown size={14} color="var(--text-tertiary)" />}
                              </button>

                              {/* Members list */}
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
