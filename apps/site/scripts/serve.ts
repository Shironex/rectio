/** `pnpm --filter @rectio/site preview`: serves the built site from out/ on port 4321. */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serveStatic } from './static-server.ts';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const { url } = await serveStatic(out, Number(process.env.PORT ?? 4321));
console.log(`rectio site: ${url}`);
