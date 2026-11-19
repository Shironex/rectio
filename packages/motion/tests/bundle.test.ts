import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { build, type Rolldown } from 'vite';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

/** Module ids that belong to the Motion library, under any of its package names. */
const MOTION =
  /[\\/]node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(motion|motion-dom|motion-utils|framer-motion)[\\/]/;

async function bundle(entry: string) {
  const result = (await build({
    configFile: false,
    logLevel: 'silent',
    root: here,
    build: {
      write: false,
      minify: true,
      rolldownOptions: { input: join(here, 'fixtures', entry), preserveEntrySignatures: 'strict' },
    },
  })) as Rolldown.RolldownOutput | Rolldown.RolldownOutput[];
  const output = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
  const chunks = output.filter((o): o is Rolldown.OutputChunk => o.type === 'chunk');
  return {
    modules: chunks.flatMap((c) => c.moduleIds),
    gzip: gzipSync(chunks.map((c) => c.code).join('')).length,
  };
}

describe('bundle cost', () => {
  it('keeps Motion out of an app that imports only the plain components, and costs a few kB with it', async () => {
    const plain = await bundle('plain-entry.ts');
    const motion = await bundle('motion-entry.ts');

    expect(plain.modules.filter((id) => MOTION.test(id))).toEqual([]);
    expect(motion.modules.some((id) => MOTION.test(id))).toBe(true);

    const added = (motion.gzip - plain.gzip) / 1024;
    console.info(`motion add-on: +${added.toFixed(1)} kB gzip over the plain components`);
    // Measured at 12.9 kB: mini animate and spring, AnimatePresence for rows, the components
    // (the toast's stack reflow added 0.4 kB).
    // A jump past this means a heavier Motion entry point (motion/react `motion.*`) slipped in.
    expect(added).toBeLessThan(14);
  }, 120_000);

  it('adds little for the display components: their entrances use the Web Animations API directly', async () => {
    const plain = await bundle('display-plain-entry.ts');
    const motion = await bundle('display-motion-entry.ts');
    // No Motion library at all: entrances and exits are element.animate calls. Measured at 4.2 kB:
    // the token reader and reduced motion switch (shared with the rest of the add-on), the
    // first-view and presence helpers, and eight thin wrappers.
    expect(motion.modules.filter((id) => MOTION.test(id))).toEqual([]);
    const added = (motion.gzip - plain.gzip) / 1024;
    console.info(`motion display components: +${added.toFixed(1)} kB gzip over the plain ones`);
    expect(added).toBeLessThan(5);
  }, 120_000);
});
