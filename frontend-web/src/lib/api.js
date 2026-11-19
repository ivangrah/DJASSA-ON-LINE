import axios from 'axios';

/**
 * Client API Djassa Online.
 * Dev  : baseURL `/api/v1` proxifié par Vite → http://127.0.0.1:8899
 * Prod : VITE_API_URL (ex. https://api.djassaonline.ci/api/v1)
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('djassa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('djassa_token');
      localStorage.removeItem('djassa_user');
      // Redirection douce hors routes d'auth
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

/** Télécharge un fichier authentifié (reçu PDF) via blob. */
export async function downloadAuthenticated(url, filename) {
  const res = await api.get(url.replace(/^.*\/api\/v1/, ''), { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
