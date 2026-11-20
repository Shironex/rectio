import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RECTIO = join(process.cwd(), 'node_modules', '@rectio');

/** Folders of a directory that hold one item each (lib holds shared helpers). */
function folders(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'lib')
    .map((entry) => entry.name);
}

const itemFolders = (pkg: string) => folders(join(RECTIO, pkg, 'src'));

/**
 * Blocks by family: the finance blocks sit directly in packages/blocks/src, one folder each; the
 * other families (saas, marketing, docs) are folders of block folders.
 */
function blockFamilies(): Record<string, number> {
  const src = join(RECTIO, 'blocks', 'src');
  const families: Record<string, number> = { finance: 0 };
  for (const name of folders(src)) {
    const inner = folders(join(src, name));
    if (inner.length === 0) families.finance = (families.finance ?? 0) + 1;
    else families[name] = inner.length;
  }
  return families;
}

/** Motion twins: a folder per motioned component, a `.motion.tsx` file per motioned block. */
function motionTwins(): number {
  const blocks = readdirSync(join(RECTIO, 'blocks', 'src'), { recursive: true, encoding: 'utf8' });
  return itemFolders('motion').length + blocks.filter((f) => f.endsWith('.motion.tsx')).length;
}

/** Templates: every folder of the repo's templates/ with a template.json. */
function templateCount(): number {
  const dir = join(process.cwd(), '..', '..', 'templates');
  return folders(dir).filter((name) => existsSync(join(dir, name, 'template.json'))).length;
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
  /** Blocks per family: finance, saas, marketing, docs. */
  families: Record<string, number>;
  templates: number;
  motionTwins: number;
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
  const families = blockFamilies();
  return {
    components: itemFolders('ui').length,
    blocks: Object.values(families).reduce((sum, n) => sum + n, 0),
    families,
    templates: templateCount(),
    motionTwins: motionTwins(),
    themes: themes.length,
    modes: Object.keys(first).length,
    tokens: Object.keys(Object.values(first)[0] ?? {}).length,
    motionKb: motionGzipKb(),
  };
}
