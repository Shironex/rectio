/**
 * `pnpm --filter @rectio/site preview`: serves the built site from out/ on port 4321, under the
 * base path it was built with (`SITE_BASE_PATH=/rectio` serves it at /rectio/, as Pages does).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BASE_PATH } from '../lib/base-path.ts';
import { serveStatic } from './static-server.ts';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const { url } = await serveStatic(out, Number(process.env.PORT ?? 4321), BASE_PATH);
console.log(`rectio site: ${url}${BASE_PATH}/`);
