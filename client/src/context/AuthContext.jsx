import { createContext, useContext, useState, useEffect } from 'react';
import { getMyProfile } from '../services/eventService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await getMyProfile();
          const data = res.data.data;

          // Google OAuth user who hasn't selected a role yet
          if (data.needsRole) {
            // Don't set user — they'll be redirected to role selection
            setLoading(false);
            return;
          }

          const profileData = data.profile;
          // Normalize the user object so it identically matches the login payload
          const baseUser = profileData.organizer_id || profileData.profile_id;
          const profilePic = profileData.profile_pic_url || profileData.logo_url || null;
          setUser({ ...baseUser, profilePic });
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = ({ token: newToken, user: newUser }) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
