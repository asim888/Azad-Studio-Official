import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Replaces specific env access
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill global process to prevent crashes in libraries that assume Node.js env
      'process.env': {},
      'process': { env: {} }
    }
  };
});