import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 4175 },
  preview: { port: 4175 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/three/') || id.includes('three-mesh-bvh')) return 'three-core';
          if (id.includes('@react-three')) return 'react-three';
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-core';
          if (id.includes('zustand') || id.includes('zod')) return 'app-vendor';
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
