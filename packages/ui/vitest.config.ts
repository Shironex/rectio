import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { clientBoundary } from './test/client-boundary';

export default defineConfig({
  plugins: [react()],
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          exclude: ['**/node_modules/**', 'src/**/*.server.test.ts'],
        },
      },
      {
        // The kit as a React Server Component sees it: React's server build, and every
        // 'use client' module swapped for client references, as Next does.
        extends: true,
        plugins: [clientBoundary()],
        resolve: { conditions: ['react-server', 'module', 'import', 'default'] },
        ssr: { resolve: { conditions: ['react-server', 'module', 'import', 'default'] } },
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.server.test.ts'],
          execArgv: ['--conditions=react-server'],
          server: { deps: { inline: [/@base-ui\/react/] } },
        },
      },
    ],
  },
});
