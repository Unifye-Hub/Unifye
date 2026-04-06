import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', marginTop: '0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} Unify Events — Built for builders
          </p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {['Privacy', 'Terms', 'Help'].map(item => (
              <a key={item} href="/" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
