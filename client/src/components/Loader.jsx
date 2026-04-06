// Skeleton card for loading state
export const EventCardSkeleton = () => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <div className="skeleton" style={{ height: '160px', borderRadius: 0 }} />
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="skeleton" style={{ height: '18px', width: '60px' }} />
      <div className="skeleton" style={{ height: '16px', width: '100%' }} />
      <div className="skeleton" style={{ height: '16px', width: '75%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.5rem' }}>
        <div className="skeleton" style={{ height: '12px', width: '40%' }} />
        <div className="skeleton" style={{ height: '12px', width: '55%' }} />
        <div className="skeleton" style={{ height: '2px', width: '100%', marginTop: '4px' }} />
      </div>
    </div>
  </div>
);

// Full-page spinner
export const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
    <div style={{
      width: '24px', height: '24px',
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Empty state
export const EmptyState = ({ icon: Icon, message, sub }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '5rem 1rem', gap: '0.75rem', textAlign: 'center',
  }}>
    {Icon && (
      <div style={{
        width: '48px', height: '48px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color: 'var(--text-tertiary)' }} />
      </div>
    )}
    <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.9375rem' }}>{message}</p>
    {sub && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{sub}</p>}
  </div>
);
