import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken, setUnauthorizedHandler } from '../api';

const AuthContext = createContext(null);

const USER_KEY = 'djassa_user';

async function readUser() {
  try {
    const raw = globalThis.localStorage?.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return globalThis.__djassa_user_memory ?? null;
}

async function writeUser(user) {
  globalThis.__djassa_user_memory = user ?? null;
  try {
    if (user) globalThis.localStorage?.setItem(USER_KEY, JSON.stringify(user));
    else globalThis.localStorage?.removeItem(USER_KEY);
  } catch {
    /* noop */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [booted, setBooted] = useState(false);

  const persist = useCallback(async (nextUser, nextToken) => {
    setUser(nextUser);
    setTokenState(nextToken);
    await setToken(nextToken);
    await writeUser(nextUser);
  }, []);

  useEffect(() => {
    (async () => {
      const [tok, usr] = await Promise.all([
        import('../api').then((m) => m.getToken()),
        readUser(),
      ]);
      if (tok) {
        setTokenState(tok);
        if (usr) setUser(usr);
        // Revalidation en tâche de fond
        api.get('/auth/me')
          .then(({ data }) => writeUser(data.user).then(() => setUser(data.user)))
          .catch(() => persist(null, null));
      }
      setBooted(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => persist(null, null));
  }, [persist]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await persist(data.user, data.token);
    return data.user;
  }, [persist]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    await persist(data.user, data.token);
    return data.user;
  }, [persist]);

  const loginWithGoogle = useCallback(async (idToken, wantedRole = 'user') => {
    const { data } = await api.post('/auth/google', { id_token: idToken, wanted_role: wantedRole });
    await persist(data.user, data.token);
    return data;
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* jeton déjà invalide */
    }
    await persist(null, null);
  }, [persist]);

  const refreshMe = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    await persist(data.user, token);
    return data.user;
  }, [persist, token]);

  const value = useMemo(() => ({
    user,
    token,
    booted,
    isAuthenticated: Boolean(token),
    isPro: user?.role === 'pro_seller',
    boutique: user?.boutique ?? null,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshMe,
  }), [user, token, booted, login, register, loginWithGoogle, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
