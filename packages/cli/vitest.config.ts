import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Most suites build the whole registry in beforeAll. That takes a few seconds alone, and
    // longer when the gate runs every package's tests at once.
    hookTimeout: 60_000,
  },
});
