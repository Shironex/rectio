/**
 * Writes dist/generator.json for the theme generator (the docs page and `rectio add <theme link>`):
 * the derivation presets from scripts/derive.ts, every gated colour pair the kit draws and the
 * compact density values. Run after scripts/build.ts, which writes dist/themes.css.
 *
 *   node scripts/generator-data.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GeneratorData, PackedPair } from '../generator/resolve.ts';
import { derivePairs } from './contrast.ts';
import { LEDGER_LOOK, PRESETS } from './derive.ts';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/** The compact block of dist/themes.css: its own values, not the var() aliases. */
function compactValues(): Record<string, string> {
  const css = readFileSync(join(dist, 'themes.css'), 'utf8');
  const block = /\[data-density="compact"\][^{]*\{([^}]*)\}/.exec(css)?.[1];
  if (block === undefined) throw new Error('dist/themes.css has no compact density block');
  return Object.fromEntries(
    [...block.matchAll(/(--rx-[a-z0-9-]+): ([^;]+);/g)]
      .filter((m) => !(m[2] ?? '').startsWith('var('))
      .map((m) => [m[1] ?? '', m[2] ?? '']),
  );
}

function packedPairs(): PackedPair[] {
  const seen = new Map<string, PackedPair>();
  for (const p of derivePairs()) {
    if (p.gate === 'info') continue;
    const packed: PackedPair = [
      p.fg,
      p.fgAlpha,
      p.bg,
      p.bgAlpha,
      p.min,
      p.gate === 'text' ? 't' : 'u',
    ];
    seen.set(packed.join('|'), packed);
  }
  return [...seen.values()].sort((a, b) => (a.join('|') < b.join('|') ? -1 : 1));
}

const data: GeneratorData = {
  version: 1,
  presets: [...PRESETS, LEDGER_LOOK],
  pairs: packedPairs(),
  compact: compactValues(),
};
writeFileSync(join(dist, 'generator.json'), `${JSON.stringify(data)}\n`);
console.log(
  `generator: ${String(data.presets.length)} presets, ${String(data.pairs.length)} gated pairs -> dist/generator.json`,
);
