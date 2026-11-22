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
  // La source de vérité est le cookie HttpOnly validé par /auth/me — pas le localStorage.
  // On démarre donc non authentifié jusqu'à la résolution, pour éviter les 401 au chargement.
  const [user, setUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  // Jeton conservé uniquement en mémoire — l'authentification web passe par le cookie HttpOnly.
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const persist = useCallback((nextUser, nextToken) => {
    const normalized = normalizeUser(nextUser);
    setUser(normalized);
    setToken(nextToken ?? null);
    setAuthResolved(true);
    if (normalized) {
      localStorage.setItem('djassa_user', JSON.stringify(normalized));
      // Simple indicateur (aucun secret) : dit qu'une session existe côté cookie HttpOnly.
      localStorage.setItem('djassa_session_hint', '1');
    } else {
      localStorage.removeItem('djassa_user');
      localStorage.removeItem('djassa_session_hint');
    }
    // Ne plus jamais stocker le jeton dans localStorage (mitigation XSS) — le serveur le pose en cookie HttpOnly.
    localStorage.removeItem('djassa_token');
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
      persist(data.user, null);
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
      if (data?.user) {
        persist(data.user, null);
        return data.user;
      }
      setAuthResolved(true);
      return null;
    } catch (err) {
      // Pas de session valide (401) ou erreur transitoire : on résout comme non connecté, sans requête en quarantaine.
      setAuthResolved(true);
      if (err?.response?.status === 401) {
        // Session expirée/corrompue : purge complète du hint + user stockés côté client.
        localStorage.removeItem('djassa_user');
        localStorage.removeItem('djassa_session_hint');
      }
      return null;
    }
  }, [persist]);

  // Au démarrage : uniquement resynchroniser si une session est suspectée (côté cookie HttpOnly).
  // Sinon, on marque immédiatement comme non connecté SANS appeler /auth/me (évite 401 + Request aborted).
  useEffect(() => {
    if (localStorage.getItem('djassa_session_hint') === '1') {
      refreshMe();
    } else {
      setAuthResolved(true);
    }
  }, [refreshMe]);

  const value = useMemo(() => {
    const role = user?.role ?? null;
    const plan = user?.plan_abonnement ?? null;
    const isPro = role === 'vendeur_pro';
    const isParticulier = role === 'particulier';
    const isAdmin = role === 'admin';
    const hasActiveProPlan = Boolean(user?.has_active_pro_plan);

    // L'administrateur n'est jamais astreint au choix d'offre / onboarding.
    const needsPlan = Boolean(user) && !isAdmin && plan === null;

    let dashboardPath = '/';
    if (isAdmin) dashboardPath = '/admin';
    else if (needsPlan) dashboardPath = '/choisir-offre';
    else if (isPro) dashboardPath = '/dashboard-pro';
    else if (isParticulier) dashboardPath = '/dashboard';

    return {
      user,
      token,
      loading,
      authResolved,
      isAuthenticated: Boolean(user),
      isPro,
      isParticulier,
      isAdmin,
      hasActiveProPlan,
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
  }, [user, token, loading, authResolved, login, register, loginWithGoogle, selectPlan, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
