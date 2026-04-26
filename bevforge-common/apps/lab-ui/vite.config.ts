import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number.parseInt(process.env.PORT ?? '5175', 10),
    strictPort: true,
  },
});
