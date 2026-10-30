import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const stored = localStorage.getItem('cc_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('cc_token', access_token);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { }
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      const updated = res.data.data;
      localStorage.setItem('cc_user', JSON.stringify(updated));
      setUser(updated);
    } catch { }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, isAdmin: user?.role === 'admin', isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
