import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, ImagePlus } from 'lucide-react';
import { createEvent, getEvent, updateEvent } from '../services/eventService';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EVENT_TYPES = ['hackathon', 'bootcamp', 'competition', 'workshop', 'seminar'];

const CreateEventPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(isEditMode);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    title: '', type: 'hackathon', date_time: '',
    capacity: '', location: '', description: '',
    eventType: 'INDIVIDUAL',
    minMembers: '',
    maxMembers: '',
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchEventData = async () => {
        try {
          const res = await getEvent(id);
          const ev = res.data.data.event;
          
          // Format date for datetime-local input (YYYY-MM-DDThh:mm)
          const dateObj = new Date(ev.date_time);
          const localIsoString = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

          setForm({
            title: ev.title || '',
            type: ev.type || 'hackathon',
            date_time: localIsoString,
            capacity: ev.capacity || '',
            location: ev.location || '',
            description: ev.description || '',
            eventType: ev.eventType || 'INDIVIDUAL',
            minMembers: ev.groupConfig?.minMembers || '',
            maxMembers: ev.groupConfig?.maxMembers || '',
          });
          setPreview(ev.cover_image);
        } catch (error) {
          toast.error("Failed to load event data for editing");
          navigate('/organizer');
        } finally {
          setInitialFetchLoading(false);
        }
      };
      fetchEventData();
    }
  }, [id, navigate, isEditMode]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditMode && !imageFile) { toast.error('Please upload a cover image'); return; }

    // Validate group config when required
    const needsGroupConfig = form.eventType === 'GROUP' || form.eventType === 'BOTH';
    if (needsGroupConfig) {
      const min = Number(form.minMembers);
      const max = Number(form.maxMembers);
      if (!min || min < 2) { toast.error('Minimum members must be at least 2'); return; }
      if (!max || max < min) { toast.error('Maximum members must be greater than or equal to minimum members'); return; }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      // Append base fields
      const { minMembers, maxMembers, eventType, ...baseFields } = form;
      Object.entries(baseFields).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (imageFile) fd.append('cover_image', imageFile);

      // Append participation mode fields
      fd.append('eventType', eventType);
      if (needsGroupConfig) {
        fd.append('groupConfig[minMembers]', minMembers);
        fd.append('groupConfig[maxMembers]', maxMembers);
      }

      if (isEditMode) {
        await updateEvent(id, fd);
        toast.success('Event updated successfully!');
        navigate('/organizer');
      } else {
        const res = await createEvent(fd);
        toast.success('Event created!');
        navigate(`/events/${res.data.data.event._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', background: 'var(--bg-secondary)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    color: 'var(--text-primary)', fontSize: '0.875rem',
    padding: '0.625rem 0.875rem', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: '500',
    color: 'var(--text-secondary)', marginBottom: '0.5rem',
  };

  if (initialFetchLoading) {
    return <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2.5rem 1.25rem 4rem', display: 'flex', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isEditMode ? 'Update the details of your event below' : 'Fill in the details to publish your event'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Cover Image */}
            <div>
              <label style={labelStyle}>Cover Image {!isEditMode && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                style={{
                  position: 'relative', cursor: 'pointer',
                  borderRadius: 'var(--radius-lg)',
                  border: preview ? '1px solid var(--border)' : '2px dashed var(--border)',
                  overflow: 'hidden', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { if (!preview) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { if (!preview) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {preview ? (
                  <div style={{ height: '200px', position: 'relative' }}>
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>Change image</span>
                    </div>
                    <button
                      type="button"
                      onClick={ev => { ev.stopPropagation(); setPreview(null); setImageFile(null); }}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '28px', height: '28px',
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div style={{
                    height: '160px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                    color: 'var(--text-tertiary)',
                  }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-hover)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImagePlus size={20} />
                    </div>
                    <p style={{ fontSize: '0.875rem' }}>Drop image or click to upload</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>PNG, JPG, WEBP — max 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Event Title <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                required type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Global Hack 2025"
                style={inputStyle}
                className="input-premium"
              />
            </div>

            {/* Type + Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Event Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="input-premium"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t} style={{ background: 'var(--bg-card)' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Capacity <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  required type="number" min={1}
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  placeholder="e.g. 200"
                  className="input-premium"
                />
              </div>
            </div>

            {/* Date + Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Date & Time <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  required type="datetime-local"
                  value={form.date_time}
                  onChange={e => setForm({ ...form, date_time: e.target.value })}
                  className="input-premium"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Location <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  required type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Main Auditorium or Online"
                  className="input-premium"
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <style>{`
                .quill { max-width: 100%; border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; background: var(--bg-card); color: var(--text-primary); }
                .ql-toolbar { border: none !important; border-bottom: 1px solid var(--border) !important; display: flex; flex-wrap: wrap; background: var(--bg-secondary); }
                .ql-container { border: none !important; min-height: 120px; }
              `}</style>
              <label style={labelStyle}>Description</label>
              <ReactQuill 
                theme="snow"
                value={form.description}
                onChange={value => setForm({ ...form, description: value })}
                placeholder="Tell participants what this event is about..."
              />
            </div>

            {/* Participation Mode */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <label style={{ ...labelStyle, marginBottom: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Participation Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                {[{ value: 'INDIVIDUAL', label: 'Individual', desc: 'Solo only' },
                  { value: 'GROUP',      label: 'Group',      desc: 'Teams only' },
                  { value: 'BOTH',       label: 'Both',       desc: 'Solo or team' }].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, eventType: opt.value, minMembers: '', maxMembers: '' })}
                    style={{
                      padding: '0.625rem 0.5rem',
                      borderRadius: 'var(--radius)',
                      border: form.eventType === opt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: form.eventType === opt.value ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-secondary)',
                      color: form.eventType === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Group config — shown only when GROUP or BOTH */}
              {(form.eventType === 'GROUP' || form.eventType === 'BOTH') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label style={labelStyle}>
                      Min Members <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={2}
                      value={form.minMembers}
                      onChange={e => setForm({ ...form, minMembers: e.target.value })}
                      placeholder="e.g. 2"
                      className="input-premium"
                    />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Minimum 2</p>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Max Members <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={form.minMembers || 2}
                      value={form.maxMembers}
                      onChange={e => setForm({ ...form, maxMembers: e.target.value })}
                      placeholder="e.g. 5"
                      className="input-premium"
                    />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Must be &ge; min members</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                {loading ? (
                  <>
                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (isEditMode ? 'Save Changes' : 'Publish Event')}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CreateEventPage;
