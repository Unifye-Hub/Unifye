import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../services/eventService';
import { Spinner } from '../components/Loader';

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const authError = searchParams.get('error');

    if (authError) {
      setError('Google login failed. Please try again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!token) {
      setError('No authentication token received.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    (async () => {
      try {
        localStorage.setItem('token', token);

        const profileRes = await getMyProfile();
        const data = profileRes.data.data;

        // New Google user who hasn't selected a role yet
        if (data.needsRole) {
          navigate(`/auth/select-role?token=${token}`, { replace: true });
          return;
        }

        const profileData = data.profile;
        const baseUser = profileData.organizer_id || profileData.profile_id;
        const profilePic = profileData.profile_pic_url || profileData.logo_url || null;

        login({ token, user: { ...baseUser, profilePic } });

        const role = baseUser.role;
        if (role === 'organizer') navigate('/organizer', { replace: true });
        else navigate('/dashboard', { replace: true });
      } catch {
        localStorage.removeItem('token');
        setError('Failed to complete login. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    })();
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{error}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem' }}>Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
