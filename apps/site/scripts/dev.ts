/**
 * `pnpm dev`: next dev with the live template previews served beside it. The previews are static
 * builds (scripts/previews.ts), not routes of the site, so next dev cannot serve them itself: this
 * serves .previews/ on a free local port and hands that address to next.config, which proxies
 * /preview/* to it in development only. Arguments pass through to next dev (`pnpm dev -p 4350`).
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

import { PREVIEWS_DIR } from '../lib/previews.ts';
import { serveStatic } from './static-server.ts';

const site = join(import.meta.dirname, '..');
const { server, url } = await serveStatic(PREVIEWS_DIR, 0, '/preview');
console.log(
  `previews: /preview/* proxied to ${url} (next dev then warns that rewrites do not work with output: export; that is about the static build, which copies the previews instead)`,
);

const next = spawn(
  process.execPath,
  [join(site, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', ...process.argv.slice(2)],
  { cwd: site, stdio: 'inherit', env: { ...process.env, RECTIO_PREVIEW_ORIGIN: url } },
);

// Ctrl+C reaches next dev too; this process stays until it has shut down, then follows it.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    next.kill(signal);
  });
}
next.on('exit', (code, signal) => {
  server.closeAllConnections();
  server.close();
  process.exitCode = code ?? (signal === null ? 0 : 1);
});
