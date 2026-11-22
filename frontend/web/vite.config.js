import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Djassa Online — dev server sur :5199 (5173 occupé sur la machine).
// /api est proxifié vers le gateway microservices (:8080) — pas de CORS en dev.
export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js (767 ko) est chargé uniquement à la demande via React.lazy :
    // il ne fait pas partie du payload initial.
    // recharts/pdf/confetti sont isolés dans des chunks lazy (hors payload initial).
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@react-three/drei')) return 'three-drei';
          if (id.includes('node_modules/@react-three/postprocessing')) return 'three-fx';
          if (id.includes('node_modules/@react-three/fiber')) return 'three-fiber';
          if (id.includes('node_modules/three/')) return 'three-core';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor')) return 'charts';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/dompurify') || id.includes('node_modules/canvg')) return 'pdf';
          if (id.includes('node_modules/canvas-confetti')) return 'confetti';
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
      '/uploads': {
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
