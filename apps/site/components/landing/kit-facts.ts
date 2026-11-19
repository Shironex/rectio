import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RECTIO = join(process.cwd(), 'node_modules', '@rectio');

/** Folders of a package's src that hold one item each (lib holds shared helpers). */
function itemFolders(pkg: string): string[] {
  return readdirSync(join(RECTIO, pkg, 'src'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'lib')
    .map((entry) => entry.name);
}

/**
 * The motion add-on's cost, as its bundle test measured it. The test asserts the budget; its
 * comment records the measured figure, so the site states what the test last saw.
 */
function motionGzipKb(): string {
  const test = readFileSync(join(RECTIO, 'motion', 'tests', 'bundle.test.ts'), 'utf8');
  const kb = /Measured at (\d+(?:\.\d+)?) kB/.exec(test)?.[1];
  if (kb === undefined) throw new Error('motion bundle test: no "Measured at <n> kB" note found');
  return kb;
}

export interface KitFacts {
  components: number;
  blocks: number;
  themes: number;
  modes: number;
  tokens: number;
  motionKb: string;
}

/** Facts about the kit, read from the packages at build time so the landing never drifts. */
export function kitFacts(): KitFacts {
  const tokens = JSON.parse(
    readFileSync(join(RECTIO, 'tokens', 'dist', 'tokens.json'), 'utf8'),
  ) as { themes: Record<string, Record<string, Record<string, string>>> };
  const themes = Object.values(tokens.themes);
  const first = themes[0] ?? {};
  return {
    components: itemFolders('ui').length,
    blocks: itemFolders('blocks').length,
    themes: themes.length,
    modes: Object.keys(first).length,
    tokens: Object.keys(Object.values(first)[0] ?? {}).length,
    motionKb: motionGzipKb(),
  };
}
