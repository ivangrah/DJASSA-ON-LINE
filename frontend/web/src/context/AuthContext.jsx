import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

/** Normalise un utilisateur stocké avec l'ancien schéma (user/pro_seller, plan). */
function normalizeUser(raw) {
  if (!raw) return null;

  const role = raw.role === 'user' ? 'particulier'
    : raw.role === 'pro_seller' ? 'vendeur_pro'
      : raw.role;

  const plan = raw.plan_abonnement
    ?? (raw.plan === 'pro' ? 'pro' : raw.plan === 'free' ? 'gratuit' : null);

  return {
    ...raw,
    role,
    plan_abonnement: plan,
    abonnement_actif_jusqu_au: raw.abonnement_actif_jusqu_au ?? raw.plan_expire_at ?? null,
    is_pro: role === 'vendeur_pro',
    is_particulier: role === 'particulier',
    needs_plan: plan === null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return normalizeUser(JSON.parse(localStorage.getItem('djassa_user') ?? 'null'));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('djassa_token'));
  const [loading, setLoading] = useState(false);

  const persist = useCallback((nextUser, nextToken) => {
    const normalized = normalizeUser(nextUser);
    setUser(normalized);
    setToken(nextToken);
    if (normalized) localStorage.setItem('djassa_user', JSON.stringify(normalized));
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

  const loginWithGoogle = useCallback(async (idToken) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { id_token: idToken });
      persist(data.user, data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const selectPlan = useCallback(async (plan) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/select-plan', { plan });
      persist(data.user, localStorage.getItem('djassa_token'));
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
      persist(null, null);
      return null;
    }
  }, [persist]);

  // Au démarrage, on resynchronise le profil (rôles/plans renommés côté API).
  useEffect(() => {
    if (token) refreshMe();
  }, [token, refreshMe]);

  const value = useMemo(() => {
    const role = user?.role ?? null;
    const plan = user?.plan_abonnement ?? null;
    const isPro = role === 'vendeur_pro';
    const isParticulier = role === 'particulier';
    const isAdmin = role === 'admin';

    const needsPlan = Boolean(user) && plan === null;

    let dashboardPath = '/';
    if (needsPlan) dashboardPath = '/choisir-offre';
    else if (isPro) dashboardPath = '/dashboard-pro';
    else if (isParticulier) dashboardPath = '/dashboard';
    else if (isAdmin) dashboardPath = '/dashboard-pro';

    return {
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      isPro,
      isParticulier,
      isAdmin,
      needsPlan,
      plan,
      dashboardPath,
      boutique: user?.boutique ?? null,
      login,
      register,
      loginWithGoogle,
      selectPlan,
      logout,
      refreshMe,
    };
  }, [user, token, loading, login, register, loginWithGoogle, selectPlan, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
