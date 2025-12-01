import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Only replace the specific API Key variable.
      // Do NOT overwrite the entire process object as it breaks React's NODE_ENV checks.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});