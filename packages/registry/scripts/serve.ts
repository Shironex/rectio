/**
 * Serves dist/registry on localhost for CLI development.
 *   pnpm --filter @rectio/registry serve            (port 4873)
 *   PORT=5000 RECTIO_DEV_LICENSE_KEYS=key-a,key-b pnpm --filter @rectio/registry serve
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serveRegistry } from '../src/serve.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'registry');
const licenseKeys = (process.env.RECTIO_DEV_LICENSE_KEYS ?? '')
  .split(',')
  .map((key) => key.trim())
  .filter((key) => key !== '');
const registry = await serveRegistry({
  dir,
  licenseKeys,
  port: Number(process.env.PORT ?? 4873),
});
console.log(`registry: serving ${dir} at ${registry.url} (${licenseKeys.length} dev license keys)`);
