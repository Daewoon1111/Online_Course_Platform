import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite on :5173 proxies API and media to Django on :8000.
// changeOrigin: false keeps Host = localhost:5173, so Django builds image URLs on the same origin.
const backend = { target: 'http://127.0.0.1:8000', changeOrigin: false };

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': backend, '/media': backend } },
});
