import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Djassa Online — dev server sur :5199 (5173 occupé sur la machine).
// /api est proxifié vers l'API Laravel (:8899) — pas de CORS en dev.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8899',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
  },
});
