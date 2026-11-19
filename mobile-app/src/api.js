import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Client API Djassa Online — même REST `/api/v1` que le web.
 * Android émulateur → 10.0.2.2 ; iOS simulateur / web → 127.0.0.1
 * Surcharge : EXPO_PUBLIC_API_URL (ex. https://api.djassaonline.ci/api/v1)
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8899/api/v1' : 'http://127.0.0.1:8899/api/v1');

const TOKEN_KEY = 'djassa_token';

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return globalThis.__djassa_token_memory ?? null;
  }
}

export async function setToken(token) {
  globalThis.__djassa_token_memory = token ?? null;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // exécution hors device (web) : SecureStore indisponible → mémoire vive
  }
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Déconnexion forcée sur 401 (reliée au AuthContext par setUnauthorizedHandler) */
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      await setToken(null);
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);
