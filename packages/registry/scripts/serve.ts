/**
 * Serves dist/registry on localhost for CLI development.
 *   pnpm --filter @rectio/registry serve            (port 4873)
 *   PORT=5000 pnpm --filter @rectio/registry serve
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serveRegistry } from '../src/serve.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'registry');
const registry = await serveRegistry({ dir, port: Number(process.env.PORT ?? 4873) });
console.log(`registry: serving ${dir} at ${registry.url}`);
