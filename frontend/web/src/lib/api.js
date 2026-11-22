import axios from 'axios';

/** Client API Djassa Online — dev : /api/v1 proxifié vers la gateway :8080. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
  timeout: 20000,
  // Cookie HttpOnly envoyé automatiquement (authentification web).
  withCredentials: true,
});

/** Jeton Bearer courant (stocké en mémoire uniquement — mitigation XSS). */
let memoryToken = null;

export function setApiToken(token) {
  memoryToken = token;
}

export function getApiToken() {
  return memoryToken;
}

/** Déduplication des GET identiques en vol (règle 4). */
const inFlight = new Map();

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get') {
    const key = `${config.baseURL}${config.url}?${JSON.stringify(config.params ?? {})}`;
    const existing = inFlight.get(key);
    if (existing) return existing.then((response) => ({ ...response, config }));

    let resolveRequest;
    let rejectRequest;
    const shared = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    inFlight.set(key, shared);
    config._dedupeKey = key;
    config._resolveDedupe = resolveRequest;
    config._rejectDedupe = rejectRequest;
  }
  // Compatibilité descendante : anciennes sessions stockées dans localStorage.
  // Les nouvelles sessions s'authentifient via le cookie HttpOnly (withCredentials).
  const legacyToken = localStorage.getItem('djassa_token');
  if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`;
  else if (legacyToken) config.headers.Authorization = `Bearer ${legacyToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config?._dedupeKey) {
      const { _dedupeKey, _resolveDedupe } = response.config;
      _resolveDedupe?.(response);
      setTimeout(() => inFlight.delete(_dedupeKey), 1000);
    }
    return response;
  },
  (error) => {
    if (error.config?._dedupeKey) {
      const { _dedupeKey, _rejectDedupe } = error.config;
      _rejectDedupe?.(error);
      inFlight.delete(_dedupeKey);
    }
    // Ne rediriger que sur un vrai état maintenance explicite (pas n'importe quel 503).
    if (error.response?.data?.maintenance === true) {
      const msg = encodeURIComponent(error.response?.data?.message ?? '');
      if (!window.location.pathname.startsWith('/maintenance')) {
        window.location.assign(`/maintenance${msg ? `?message=${msg}` : ''}`);
      }
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('djassa_token');
      localStorage.removeItem('djassa_user');
      localStorage.removeItem('djassa_session_hint');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export async function downloadAuthenticated(url, filename) {
  const res = await api.get(url.replace(/^.*\/api\/v1/, ''), { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
