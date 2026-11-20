import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The marketing blocks render as React Server Components wherever they can, so a landing page
// ships JavaScript only for the parts that move or take input. A module that needs the browser
// says so with 'use client'; every other one must stay importable from a server component.
const ROOT = join(import.meta.dirname, '../src/marketing');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : entry.name.endsWith('.tsx')
        ? [join(dir, entry.name)]
        : [],
  );
}

const sources = files(ROOT).map((path) => ({
  path: relative(ROOT, path),
  source: readFileSync(path, 'utf8'),
}));
const isClient = (source: string) => source.startsWith("'use client';");

/** React names a server component cannot import: state, effects, refs and context. */
const CLIENT_ONLY =
  /\b(useState|useEffect|useLayoutEffect|useRef|useContext|useReducer|createContext)\b/;
const reactImports = (source: string) =>
  [...source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'react'/g)]
    .filter((match) => !match[0].startsWith('import type'))
    .map((match) => match[1] ?? '')
    .join(',');

describe('marketing blocks on the server', () => {
  it('marks every module that holds state, effects or input as a client module', () => {
    const missing = sources
      .filter(({ source }) => CLIENT_ONLY.test(reactImports(source)) && !isClient(source))
      .map(({ path }) => path);
    expect(missing).toEqual([]);
  });

  it('keeps the static blocks server components', () => {
    const server = [
      'cta-band/cta-band.tsx',
      'faq/faq.tsx',
      'feature-grid/feature-grid.tsx',
      'hero/hero.tsx',
      'logo-strip/logo-strip.tsx',
      'site-footer/site-footer.tsx',
      'stat-row/stat-row.tsx',
      'team/team.tsx',
      'testimonials/testimonials.tsx',
      'blog/blog.tsx',
      'announcement-bar/announcement-bar.tsx',
      'lib/section.tsx',
      'lib/action.tsx',
      'lib/parts.tsx',
    ];
    const clientMarked = sources
      .filter(({ path, source }) => server.includes(path) && isClient(source))
      .map(({ path }) => path);
    expect(clientMarked).toEqual([]);
  });

  it('loads icons from the server-safe entry in server components', () => {
    const offenders = sources
      .filter(({ source }) => !isClient(source) && source.includes("from '@phosphor-icons/react';"))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('keeps the motion twins client modules', () => {
    const twins = sources.filter(({ path }) => path.endsWith('.motion.tsx'));
    expect(twins.length).toBeGreaterThan(0);
    expect(twins.filter(({ source }) => !isClient(source)).map(({ path }) => path)).toEqual([]);
  });
});
