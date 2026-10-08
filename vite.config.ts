import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Only public configuration may enter import.meta.env in the browser bundle.
  // In particular, VITE_*_API_KEY must not expose server/provider credentials.
  envPrefix: ['VITE_API_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true,
  },
});
