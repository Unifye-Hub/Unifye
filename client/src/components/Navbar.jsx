import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Sun, Moon, Search } from 'lucide-react';
import UnifyeDarkLogo from '../assets/UnifyeDarkLogo.png';
import UnifyeLightLogo from '../assets/UnifyeLightLogo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, label }) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      style={{
        color: isActive(to) ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: '0.8125rem',
        fontWeight: '500',
        padding: '0.375rem 0.625rem',
        borderRadius: '8px',
        transition: 'all 0.15s',
        textDecoration: 'none',
        background: isActive(to) ? 'rgba(255,255,255,0.06)' : 'transparent',
      }}
      onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {label}
    </Link>
  );

  const initials = (user?.full_name || user?.company_name || 'U')[0]?.toUpperCase();

  return (
    <nav
      className="nav-blur"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px', height: '32px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img 
                src={theme === 'light' ? UnifyeDarkLogo : UnifyeLightLogo} 
                alt="Unifye Events Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Unifye Events
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }} className="hidden-mobile">
            <NavLink to="/" label="Discover" />
            {user?.role === 'participant' && <NavLink to="/dashboard" label="My Events" />}
            {user?.role === 'organizer' && <NavLink to="/organizer" label="Dashboard" />}
            {user?.role === 'organizer' && <NavLink to="/create-event" label="Create Event" />}
          </div>

          {/* Search Bar */}
          {user && (
            <form onSubmit={handleSearch} style={{ position: 'relative', margin: '0 1rem', flex: 1, maxWidth: '250px' }} className="hidden-mobile">
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.375rem 2rem 0.375rem 1rem',
                  fontSize: '0.8125rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
              />
            </form>
          )}

          {/* Desktop Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hidden-mobile">
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '0.375rem',
                cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: userMenuOpen ? 'var(--bg-hover)' : 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '0.3rem 0.625rem 0.3rem 0.375rem',
                    cursor: 'pointer', color: 'var(--text-primary)',
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: 'var(--accent-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent)',
                  }}>
                    {initials}
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                    {user?.full_name?.split(' ')[0] || user?.company_name || 'Account'}
                  </span>
                  <ChevronDown size={13} style={{ color: 'var(--text-tertiary)' }} />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '0.375rem',
                      boxShadow: 'var(--shadow-md)', minWidth: '160px',
                      zIndex: 100,
                    }}
                  >
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'block', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderRadius: '8px', textDecoration: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      Profile
                    </Link>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: 'var(--danger)', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', textDecoration: 'none', padding: '0.375rem 0.625rem', borderRadius: '8px' }}>
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem', borderRadius: '8px', textDecoration: 'none' }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="show-mobile btn-ghost"
            style={{ padding: '0.375rem' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.625rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Theme</span>
              <button
                onClick={toggleTheme}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.375rem',
                  cursor: 'pointer', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
            {user && (
              <form onSubmit={handleSearch} style={{ position: 'relative', margin: '0.5rem 0.625rem' }}>
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 2.5rem 0.5rem 1rem',
                    fontSize: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <button type="submit" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                  <Search size={16} />
                </button>
              </form>
            )}
            <NavLink to="/" label="Discover" />
            {user?.role === 'participant' && <NavLink to="/dashboard" label="My Events" />}
            {user?.role === 'organizer' && <NavLink to="/organizer" label="Dashboard" />}
            {user?.role === 'organizer' && <NavLink to="/create-event" label="Create Event" />}
            <NavLink to="/profile" label="Profile" />
            {user ? (
              <button onClick={handleLogout} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
                Sign out
              </button>
            ) : (
              <>
                <NavLink to="/login" label="Log in" />
                <NavLink to="/signup" label="Get started" />
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
