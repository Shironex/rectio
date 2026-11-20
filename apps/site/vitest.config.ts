import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Component tests only; tests/ holds the node:test checks of the built site.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['components/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
  },
});
