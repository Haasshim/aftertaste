import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base so built asset URLs resolve under the Capacitor WebView
  // (file:// / https://localhost) as well as on the web.
  base: './',
  server: {
    port: 3000,
  },
});
