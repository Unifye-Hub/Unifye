import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Tag, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEvent, registerForEvent, createReview, getMyRegistration } from '../services/eventService';
import { getGroupsByEvent } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loader';
import GroupPanel from '../components/GroupPanel';
import 'react-quill/dist/quill.snow.css';

const EVENT_TYPE_BADGE = {
  hackathon: 'badge-hackathon',
  bootcamp: 'badge-bootcamp',
  competition: 'badge-competition',
  workshop: 'badge-workshop',
  seminar: 'badge-seminar',
};

const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  // Persist review-submitted state across page refreshes using localStorage
  const reviewStorageKey = `reviewDone_${id}`;
  const [reviewSuccess, setReviewSuccess] = useState(
    () => localStorage.getItem(reviewStorageKey) === 'true'
  );
  const [groupCount, setGroupCount] = useState(0);

  useEffect(() => {
    // Wait for auth state to resolve before fetching user-specific data.
    // Without this gate, the effect runs while user is still null (auth loading),
    // causing registration status and role-gated UI to be skipped on first render.
    if (authLoading) return;

    setLoading(true);
    (async () => {
      try {
        const [eventRes, regRes] = await Promise.allSettled([
          getEvent(id),
          user?.role === 'participant' ? getMyRegistration(id) : Promise.resolve(null),
        ]);

        if (eventRes.status === 'fulfilled') {
          setEvent(eventRes.value.data.data.event);
        } else {
          toast.error('Event not found');
          navigate('/');
          return;
        }

        if (regRes.status === 'fulfilled' && regRes.value) {
          setRegistered(regRes.value.data.data.registered);
        }

        // Fetch group count for GROUP/BOTH events
        const evData = eventRes.status === 'fulfilled' ? eventRes.value.data.data.event : null;
        if (evData && (evData.eventType === 'GROUP' || evData.eventType === 'BOTH')) {
          try {
            const gRes = await getGroupsByEvent(evData._id);
            setGroupCount((gRes.data.data.groups || []).length);
          } catch { /* non-critical */ }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, user, authLoading]);

  const handleRegister = async () => {
    if (!token) { navigate('/login'); return; }
    setRegistering(true);
    try {
      await registerForEvent(id);
      setRegistered(true);
      setEvent(e => ({ ...e, current_registrations: (e.current_registrations || 0) + 1 }));
      toast.success('Registered successfully! 🎉');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (msg.toLowerCase().includes('already registered')) {
        setRegistered(true);
        toast('Already registered for this event.');
      } else {
        toast.error(msg);
      }
    } finally { setRegistering(false); }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await createReview(id, { score: reviewScore, review_text: reviewText });
      setReviewSuccess(true);
      localStorage.setItem(reviewStorageKey, 'true');
      toast.success('Thanks for your review!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading || loading) return <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (!event) return null;

  const badgeClass = EVENT_TYPE_BADGE[event.type] || 'badge-seminar';
  const isClosed = new Date(event.date_time) < new Date();
  const isFull = event.capacity && event.current_registrations >= event.capacity;
  const pct = event.capacity
    ? Math.min(Math.round(((event.current_registrations ?? 0) / event.capacity) * 100), 100)
    : 0;
  const organizerName = event.organizer_id?.name || 'Unknown organizer';

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
          style={{ marginBottom: '1.5rem', fontWeight: '500' }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Cover */}
        {event.cover_image && (
          <div style={{
            width: '100%', height: '340px',
            borderRadius: 'var(--radius-xl)', overflow: 'hidden',
            marginBottom: '2rem', position: 'relative',
            border: '1px solid var(--border)',
          }}>
            <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 50%)',
            }} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Main */}
          <div>
            <span className={`badge ${badgeClass}`} style={{ marginBottom: '0.875rem', display: 'inline-block' }}>
              {event.type}
            </span>

            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '700', letterSpacing: '-0.03em',
              color: 'var(--text-primary)', lineHeight: '1.2',
              marginBottom: '1.5rem',
            }}>
              {event.title}
            </h1>

            {/* Meta grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
              marginBottom: '1.75rem',
            }}>
              {[
                { icon: Calendar, label: 'Date & Time', value: formatDate(event.date_time) },
                { icon: Users, label: 'Organizer', value: organizerName },
                { icon: Tag, label: 'Status', value: isClosed ? 'closed' : event.status },
                event.capacity && { icon: Users, label: 'Capacity', value: `${event.current_registrations ?? 0} / ${event.capacity}` },
              ].filter(Boolean).map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    <Icon size={12} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500', lineHeight: '1.4' }}>
                    {label === 'Status' ? (
                      <span className={`badge badge-${isClosed ? 'completed' : event.status}`}>{value}</span>
                    ) : value}
                  </p>
                </div>
              ))}
            </div>

            {/* Capacity bar */}
            {event.capacity && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Registration progress</span>
                  <span style={{ fontSize: '0.75rem', color: pct >= 90 ? 'var(--danger)' : 'var(--text-secondary)' }}>{pct}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: pct >= 90
                      ? 'linear-gradient(90deg, var(--danger), #ff9a9a)'
                      : 'linear-gradient(90deg, var(--accent), #a78bfa)',
                    borderRadius: '999px', transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  About this event
                </h3>
                <div className="ql-snow">
                  <div 
                    className="ql-editor" 
                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.7', padding: 0 }}
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </div>
              </div>
            )}

            {/* Group Panel — visible only to registered participants */}
            {user?.role === 'participant' && registered && (
              <GroupPanel
                event={event}
                currentUserId={user._id}
                onRegisterSuccess={() => {
                  setRegistered(true);
                  setEvent(e => ({ ...e, current_registrations: (e.current_registrations || 0) + 1 }));
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '72px' }}>
            <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
              {event.capacity && (
                (event.eventType === 'GROUP' || event.eventType === 'BOTH') ? (
                  // Two stat cards for group events
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
                    {/* Card 1: Participants Registered */}
                    <div style={{
                      textAlign: 'center', padding: '0.875rem 0.5rem',
                      background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                    }}>
                      <p style={{ fontSize: '1.625rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {event.current_registrations ?? 0}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.3rem', lineHeight: 1.3 }}>
                        of {event.capacity}<br />registered
                      </p>
                    </div>
                    {/* Card 2: Groups Formed */}
                    <div style={{
                      textAlign: 'center', padding: '0.875rem 0.5rem',
                      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                    }}>
                      <p style={{ fontSize: '1.625rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {groupCount}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.3rem', lineHeight: 1.3 }}>
                        groups<br />formed
                      </p>
                    </div>
                  </div>
                ) : (
                  // Single stat card for individual events
                  <div style={{
                    textAlign: 'center', marginBottom: '1.25rem', padding: '1rem',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {event.current_registrations ?? 0}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                      of {event.capacity} spots filled
                    </p>
                  </div>
                )
              )}

              {user?.role === 'participant' && event.status === 'upcoming' && !isClosed && (
                <>
                  {/* Register Now button — shown for ALL event types */}
                  <button
                    onClick={handleRegister}
                    disabled={registering || registered || isFull}
                    className="btn-primary"
                    style={{
                      width: '100%', padding: '0.875rem',
                      background: registered ? 'rgba(62,207,142,0.15)' : isFull ? 'var(--bg-hover)' : 'var(--accent)',
                      color: registered ? 'var(--success)' : isFull ? 'var(--text-tertiary)' : '#fff',
                      border: registered ? '1px solid rgba(62,207,142,0.3)' : 'none',
                      cursor: registered || isFull ? 'default' : 'pointer',
                      boxShadow: registered || isFull ? 'none' : undefined,
                      gap: '0.5rem',
                    }}
                  >
                    {registered ? (
                      <><CheckCircle2 size={16} /> Registered</>
                    ) : registering ? (
                      <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Registering...</>
                    ) : isFull ? 'Event Full' : 'Register Now'}
                  </button>

                  {/* Post-registration guidance for GROUP events */}
                  {registered && (event.eventType === 'GROUP' || event.eventType === 'BOTH') && (
                    <div style={{
                      marginTop: '0.75rem',
                      textAlign: 'center', padding: '1rem',
                      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    }}>
                      <Users size={18} color="var(--accent)" style={{ marginBottom: '0.4rem' }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>Team Registration Required</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Scroll down to the <strong>Groups</strong> panel to create or join a team.</p>
                    </div>
                  )}
                </>
              )}

              {!user && event.status === 'upcoming' && !isClosed && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '0.875rem' }}>
                    Sign in to register for this event
                  </p>
                  <a href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.875rem' }}>
                    Log in to Register
                  </a>
                </div>
              )}

              {user?.role === 'organizer' && !isClosed && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  Switch to a participant account to register.
                </p>
              )}

              <div style={{
                marginTop: '1.25rem', padding: '0.875rem',
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Organized by</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>{organizerName}</p>
              </div>
              
              {/* Review Section */}
              {user?.role === 'participant' && registered && !reviewSuccess && (
                <div style={{
                  marginTop: '1.5rem', padding: '1.25rem',
                  background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Review the Organizer</p>
                  
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={18} 
                        onClick={() => setReviewScore(star)}
                        fill={star <= reviewScore ? '#fbbf24' : 'none'}
                        color={star <= reviewScore ? '#fbbf24' : 'var(--text-tertiary)'}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      />
                    ))}
                  </div>

                  <textarea 
                    className="input-premium"
                    placeholder="Tell us what you thought..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    style={{ width: '100%', resize: 'vertical', minHeight: '60px', padding: '0.5rem', fontSize: '0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}
                  />

                  <button 
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
              {reviewSuccess && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(62,207,142,0.1)', color: 'var(--success)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 'var(--radius)', textAlign: 'center', fontSize: '0.875rem' }}>
                  ✓ Review Submitted
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default EventDetailsPage;
