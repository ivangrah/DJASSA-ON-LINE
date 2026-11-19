import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('djassa_user') ?? 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('djassa_token'));
  const [loading, setLoading] = useState(false);

  const persist = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser) localStorage.setItem('djassa_user', JSON.stringify(nextUser));
    else localStorage.removeItem('djassa_user');
    if (nextToken) localStorage.setItem('djassa_token', nextToken);
    else localStorage.removeItem('djassa_token');
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.user, data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      persist(data.user, data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const loginWithGoogle = useCallback(async (idToken, wantedRole = 'user') => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { id_token: idToken, wanted_role: wantedRole });
      persist(data.user, data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // jeton déjà invalide — on déconnecte localement
    }
    persist(null, null);
  }, [persist]);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      persist(data.user, localStorage.getItem('djassa_token'));
      return data.user;
    } catch {
      return null;
    }
  }, [persist]);

  useEffect(() => {
    if (token && !user) refreshMe();
  }, [token, user, refreshMe]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    isPro: user?.role === 'pro_seller',
    isAdmin: user?.role === 'admin',
    boutique: user?.boutique ?? null,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshMe,
  }), [user, token, loading, login, register, loginWithGoogle, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
