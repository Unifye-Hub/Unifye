import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchUsers } from '../services/eventService';
import { sendFriendRequest, acceptFriendRequest } from '../services/friendService';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get('q') || '';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (q) {
      fetchResults(q);
    } else {
      setResults([]);
    }
  }, [q, user, navigate]);

  const fetchResults = async (query) => {
    setLoading(true);
    try {
      const res = await searchUsers(query);
      // Filter out self
      const users = res.data.data.users.filter(u => u._id !== user._id);
      setResults(users);
    } catch (err) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId, index) => {
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
      const newResults = [...results];
      newResults[index].relationship = 'PENDING_SENT';
      setResults(newResults);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (userId, index) => {
    try {
      await acceptFriendRequest(userId);
      toast.success('Friend request accepted!');
      const newResults = [...results];
      newResults[index].relationship = 'FRIEND';
      setResults(newResults);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    }
  };

  return (
    <div className="dot-grid" style={{ minHeight: 'calc(100vh - 52px)', padding: '2rem 1.25rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Search Results
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {q ? `Showing results for "${q}"` : 'Enter a name or email in the navigation bar to search for friends.'}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>Loading...</div>
        ) : q && results.length === 0 ? (
          <div className="glass-strong" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No valid users found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((u, i) => (
              <div key={u._id} className="glass-strong" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {u.name?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      <Link to={`/profile/${u._id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline">
                        {u.name}
                      </Link>
                    </h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>{u.email}</p>
                  </div>
                </div>

                <div>
                  {u.relationship === 'FRIEND' && (
                    <button disabled style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'not-allowed', fontSize: '0.85rem' }}>
                      Friends
                    </button>
                  )}
                  {u.relationship === 'PENDING_SENT' && (
                    <button disabled style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed', fontSize: '0.85rem' }}>
                      Requested
                    </button>
                  )}
                  {u.relationship === 'PENDING_RECEIVED' && (
                    <button onClick={() => handleAcceptRequest(u._id, i)} className="btn-primary" style={{ padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                      Accept
                    </button>
                  )}
                  {u.relationship === 'NOT_FRIEND' && (
                    <button onClick={() => handleSendRequest(u._id, i)} className="btn-secondary" style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
