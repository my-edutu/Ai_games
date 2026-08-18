import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { port: 4175 },
  preview: { port: 4175 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
