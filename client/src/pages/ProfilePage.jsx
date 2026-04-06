import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, getPublicProfile, updateProfile } from '../services/eventService';
import toast from 'react-hot-toast';
import { Upload, X, Briefcase, MapPin, Link2, Edit2, Shield, CalendarDays, GitBranch, Calendar, Users } from 'lucide-react';
import { FaLinkedin, FaInstagram, FaTwitter, FaMedium } from 'react-icons/fa';
import EventCard from '../components/EventCard';

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isOwnProfile = !id || id === user?._id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
  const [form, setForm] = useState({});
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = isOwnProfile ? await getMyProfile() : await getPublicProfile(id);
        const p = res.data.data.profile;
        setProfile(p);

        const profileRole = p.profile_id?.role || p.organizer_id?.role || user?.role;

        if (profileRole === 'participant') {
          setForm({
            full_name: p.full_name || '',
            bio: p.bio || '',
            portfolio_url: p.portfolio_url || '',
            github_url: p.github_url || '',
            linkedin_url: p.linkedin_url || '',
            x_url: p.x_url || '',
            x_public: p.x_public || false,
            medium_url: p.medium_url || '',
            medium_public: p.medium_public || false,
            instagram_url: p.instagram_url || '',
            instagram_public: p.instagram_public || false,
            skills_list: (p.skills_list || []).join(', '),
          });
          setPreview(p.profile_pic_url);
        } else {
          setForm({
            company_name: p.company_name || '',
            description: p.description || '',
            github_url: p.github_url || '',
            linkedin_url: p.linkedin_url || '',
            x_url: p.x_url || '',
            x_public: p.x_public || false,
            medium_url: p.medium_url || '',
            medium_public: p.medium_public || false,
            instagram_url: p.instagram_url || '',
            instagram_public: p.instagram_public || false,
          });
          setPreview(p.logo_url);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id, isOwnProfile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      const payload = { ...form };

      if (user?.role === 'participant' && payload.skills_list !== undefined) {
        const skills = payload.skills_list.split(',').map((s) => s.trim()).filter(Boolean);
        if (skills.length > 0) {
          skills.forEach((s) => fd.append('skills_list[]', s));
        } else {
          // Send empty array marker or handle backend clearance 
          fd.append('skills_list[]', ''); 
        }
        delete payload.skills_list;
      }

      Object.entries(payload).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
      if (imageFile) fd.append('profile_image', imageFile);

      const res = await updateProfile(fd);
      const updatedP = res.data.data.profile;
      setProfile(updatedP);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
      // Update form with clean data
      const profileRole = updatedP.profile_id?.role || updatedP.organizer_id?.role || user?.role;
      if (profileRole === 'participant') {
        setForm({
          full_name: updatedP.full_name || '',
          bio: updatedP.bio || '',
          portfolio_url: updatedP.portfolio_url || '',
          github_url: updatedP.github_url || '',
          linkedin_url: updatedP.linkedin_url || '',
          x_url: updatedP.x_url || '',
          x_public: updatedP.x_public || false,
          medium_url: updatedP.medium_url || '',
          medium_public: updatedP.medium_public || false,
          instagram_url: updatedP.instagram_url || '',
          instagram_public: updatedP.instagram_public || false,
          skills_list: (updatedP.skills_list || []).join(', '),
        });
      } else {
        setForm({
          company_name: updatedP.company_name || '',
          description: updatedP.description || '',
          github_url: updatedP.github_url || '',
          linkedin_url: updatedP.linkedin_url || '',
          x_url: updatedP.x_url || '',
          x_public: updatedP.x_public || false,
          medium_url: updatedP.medium_url || '',
          medium_public: updatedP.medium_public || false,
          instagram_url: updatedP.instagram_url || '',
          instagram_public: updatedP.instagram_public || false,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', height: '400px', animation: 'pulse 2s infinite ease-in-out' }} />
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
      </div>
    );
  }

  const profileRole = profile?.profile_id?.role || profile?.organizer_id?.role || user?.role;
  const isParticipant = profileRole === 'participant';
  const displayName = isParticipant ? (form.full_name || user?.name) : (form.company_name || user?.name);
  const displayUsername = profile?.profile_id?.email?.split('@')[0] || profile?.organizer_id?.email?.split('@')[0] || user?.email?.split('@')[0];
  const skillsArray = isParticipant && form.skills_list ? form.skills_list.split(',').map(s => s.trim()).filter(Boolean) : [];
  const joinedDate = new Date(profile?.createdAt || user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // CSS variables for styling consistency
  const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' };
  const inputStyle = { width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.875rem', padding: '0.625rem 0.875rem', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' };

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        
        {/* Main Profile Card */}
        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
          
          {/* Cover Header */}
          <div style={{ 
            height: '180px', 
            background: 'linear-gradient(135deg, #FF3366 0%, #FF9933 50%, #FFD700 100%)', 
            position: 'relative' 
          }}>
            {isOwnProfile && (
              <button 
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                  } else {
                    setIsEditing(true);
                  }
                }} 
                className={isEditing ? 'btn-secondary' : 'btn-primary'}
                style={{ position: 'absolute', top: '16px', right: '16px', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: 'var(--radius-lg)', border: isEditing ? '1px solid var(--border)' : 'none', background: isEditing ? 'var(--bg-card)' : 'var(--bg-primary)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isEditing ? 'var(--text-primary)' : '#000' }}>
                   {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                   {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </div>
              </button>
            )}
          </div>

          <div style={{ padding: '0 2rem 2.5rem 2rem', position: 'relative' }}>
            
            {/* Avatar Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-60px', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '130px', height: '130px', 
                  borderRadius: '50%', 
                  border: '5px solid var(--bg-card)', 
                  backgroundColor: 'var(--bg-secondary)', 
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {preview && !preview.includes('default') ? (
                    <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>
                      {(displayName || 'U')[0]?.toUpperCase()}
                    </span>
                  )}

                  {/* Overlap Upload Overlay in Edit Mode */}
                  {isEditing && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'absolute', inset: 0, 
                        background: 'rgba(0,0,0,0.6)', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <Upload size={22} color="#fff" />
                      <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: '500' }}>Upload image</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>
              {/* No more Open to work Right Action Area */}
            </div>

            {/* Content Area */}
            {isEditing ? (
              // ================= EDIT MODE =================
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                  Edit Profile Details
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                  {isParticipant ? (
                    <>
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <input className="input-premium" style={inputStyle} value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                      </div>
                      <div>
                        <label style={labelStyle}>Bio</label>
                        <textarea className="input-premium" style={{...inputStyle, resize: 'vertical', minHeight: '100px'}} rows={4} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Tell us about yourself..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Portfolio / Website URL</label>
                        <input type="url" className="input-premium" style={inputStyle} value={form.portfolio_url} onChange={e => setForm({...form, portfolio_url: e.target.value})} placeholder="https://..." />
                      </div>
                      <div>
                        <label style={labelStyle}>GitHub URL</label>
                        <input type="url" className="input-premium" style={inputStyle} value={form.github_url} onChange={e => setForm({...form, github_url: e.target.value})} placeholder="https://github.com/..." />
                      </div>
                      <div>
                        <label style={labelStyle}>LinkedIn URL</label>
                        <input type="url" className="input-premium" style={inputStyle} value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>X (Twitter) URL</label>
                          <input type="url" className="input-premium" style={inputStyle} value={form.x_url} onChange={e => setForm({...form, x_url: e.target.value})} placeholder="https://x.com/..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.6rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Public</span>
                          <input type="checkbox" checked={form.x_public} onChange={e => setForm({...form, x_public: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>Medium URL</label>
                          <input type="url" className="input-premium" style={inputStyle} value={form.medium_url} onChange={e => setForm({...form, medium_url: e.target.value})} placeholder="https://medium.com/@..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.6rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Public</span>
                          <input type="checkbox" checked={form.medium_public} onChange={e => setForm({...form, medium_public: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>Instagram URL</label>
                          <input type="url" className="input-premium" style={inputStyle} value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} placeholder="https://instagram.com/..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.6rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Public</span>
                          <input type="checkbox" checked={form.instagram_public} onChange={e => setForm({...form, instagram_public: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Skills (Comma Separated)</label>
                        <input className="input-premium" style={inputStyle} value={form.skills_list} onChange={e => setForm({...form, skills_list: e.target.value})} placeholder="React, Node, UX Design..." />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label style={labelStyle}>Company Name</label>
                        <input className="input-premium" style={inputStyle} value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} />
                      </div>
                      <div>
                        <label style={labelStyle}>Organization Description</label>
                        <textarea className="input-premium" style={{...inputStyle, resize: 'vertical', minHeight: '120px'}} rows={5} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your organization's mission..." />
                      </div>
                      <div>
                        <label style={labelStyle}>GitHub URL (Optional)</label>
                        <input type="url" className="input-premium" style={inputStyle} value={form.github_url} onChange={e => setForm({...form, github_url: e.target.value})} placeholder="https://github.com/..." />
                      </div>
                      <div>
                        <label style={labelStyle}>LinkedIn URL (Optional)</label>
                        <input type="url" className="input-premium" style={inputStyle} value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>X (Twitter) URL (Optional)</label>
                          <input type="url" className="input-premium" style={inputStyle} value={form.x_url} onChange={e => setForm({...form, x_url: e.target.value})} placeholder="https://x.com/..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.6rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Public</span>
                          <input type="checkbox" checked={form.x_public} onChange={e => setForm({...form, x_public: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>Medium URL (Optional)</label>
                          <input type="url" className="input-premium" style={inputStyle} value={form.medium_url} onChange={e => setForm({...form, medium_url: e.target.value})} placeholder="https://medium.com/@..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.6rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Public</span>
                          <input type="checkbox" checked={form.medium_public} onChange={e => setForm({...form, medium_public: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>Instagram URL (Optional)</label>
                          <input type="url" className="input-premium" style={inputStyle} value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} placeholder="https://instagram.com/..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.6rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Public</span>
                          <input type="checkbox" checked={form.instagram_public} onChange={e => setForm({...form, instagram_public: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            ) : (
              // ================= VIEW MODE =================
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{displayName}</h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>@{displayUsername}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Briefcase size={16} />
                    <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <CalendarDays size={16} />
                    <span>Joined {joinedDate}</span>
                  </div>
                  {!isParticipant && profile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.875rem', fontWeight: 600 }}>
                      <span>⭐</span>
                      <span>{profile.average_rating ? profile.average_rating.toFixed(1) : 'No Ratings'}</span>
                    </div>
                  )}
                  {form.portfolio_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.875rem' }}>
                      <Link2 size={16} />
                      <a href={form.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">Portfolio</a>
                    </div>
                  )}
                  {form.github_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      <GitBranch size={16} />
                      <a href={form.github_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">GitHub</a>
                    </div>
                  )}
                  {form.linkedin_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0A66C2', fontSize: '0.875rem' }}>
                      <FaLinkedin size={18} />
                      <a href={form.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">LinkedIn</a>
                    </div>
                  )}
                  {form.x_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      <FaTwitter size={18} />
                      <a href={form.x_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">X</a>
                    </div>
                  )}
                  {form.medium_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      <FaMedium size={18} />
                      <a href={form.medium_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">Medium</a>
                    </div>
                  )}
                  {form.instagram_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E1306C', fontSize: '0.875rem' }}>
                      <FaInstagram size={18} />
                      <a href={form.instagram_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">Instagram</a>
                    </div>
                  )}
                </div>

                {isParticipant && skillsArray.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {skillsArray.map((skill, i) => (
                      <span key={i} style={{ 
                        padding: '0.35rem 0.875rem', 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-strong)', 
                        borderRadius: '100px', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-primary)' 
                      }}>
                        {skill}
                      </span>
                    ))}
                    <span style={{ padding: '0.35rem 0.6rem', background: 'var(--accent)', borderRadius: '100px', fontSize: '0.75rem', color: '#fff', fontWeight: 'bold' }}>
                      +
                    </span>
                  </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginTop: '2.5rem' }}>
                  {['about', 'activity'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ 
                        padding: '0.75rem 0', 
                        background: 'none', border: 'none', 
                        color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        fontWeight: activeTab === tab ? 600 : 400,
                        fontSize: '0.875rem',
                        textTransform: 'capitalize',
                        borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{ marginTop: '1.5rem' }}>
                  {activeTab === 'about' && (
                    <div className="glass-strong" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        <Shield size={18} className="text-gray-400" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>About</h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {isParticipant ? (form.bio || 'This user has not written a bio yet.') : (form.description || 'This organization has not provided a description yet.')}
                      </p>
                    </div>
                  )}
                  {activeTab === 'activity' && (
                    <div style={{ paddingTop: '0.5rem' }}>
                      {profileRole === 'participant' ? (
                        profile?.events && profile.events.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {profile.events.map(ev => (
                              <EventCard key={ev._id} event={ev} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                            No recent activity.
                          </div>
                        )
                      ) : (
                        profile?.reviews && profile.reviews.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {profile.reviews.map(rev => (
                              <div key={rev._id} className="glass-strong" style={{ padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>{rev.participant_id?.name || 'User'}</strong>
                                  <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⭐ {rev.score}/5</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Reviewed event: {rev.event_id?.title}</p>
                                {rev.review_text && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{rev.review_text}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                            No reviews yet.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default ProfilePage;
