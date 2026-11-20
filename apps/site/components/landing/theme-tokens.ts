import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { READOUT, type Readout, type ReadoutToken } from './readout';

/** The resolved tokens of every theme and mode, built by @rectio/tokens (its tokens.json export). */
const tokens = JSON.parse(
  readFileSync(
    join(process.cwd(), 'node_modules', '@rectio', 'tokens', 'dist', 'tokens.json'),
    'utf8',
  ),
) as { themes: Record<string, Record<string, Record<string, string>>> };

/** Picks the readout tokens of the default theme in every mode, at build time, on the server. */
export function readoutValues(): Readout {
  const modes = tokens.themes.default ?? {};
  return Object.fromEntries(
    Object.entries(modes).map(([mode, values]) => [
      mode,
      Object.fromEntries(READOUT.map(({ token }) => [token, values[token] ?? ''])) as Record<
        ReadoutToken,
        string
      >,
    ]),
  );
}
