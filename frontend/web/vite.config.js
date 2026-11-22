import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Djassa Online — dev server sur :5199 (5173 occupé sur la machine).
// /api est proxifié vers le gateway microservices (:8080) — pas de CORS en dev.
export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js (767 ko) est chargé uniquement à la demande via React.lazy :
    // il ne fait pas partie du payload initial.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@react-three/drei')) return 'three-drei';
          if (id.includes('node_modules/@react-three/postprocessing')) return 'three-fx';
          if (id.includes('node_modules/@react-three/fiber')) return 'three-fiber';
          if (id.includes('node_modules/three/')) return 'three-core';
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/lucide-react')) return 'lucide';
          if (id.includes('node_modules/@tanstack')) return 'query';
          if (id.includes('node_modules/@rive-app')) return 'rive';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor';
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
  },
});
