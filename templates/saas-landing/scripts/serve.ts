/** `pnpm preview`: serves the built site from out/ on port 4322. */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serveStatic } from './static-server.ts';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const { url } = await serveStatic(out, Number(process.env.PORT ?? 4322));
console.log(`SaaS landing: ${url}`);
