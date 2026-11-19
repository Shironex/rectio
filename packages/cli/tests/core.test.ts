import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cssImports, updateCssEntry } from '../src/core/css-entry.ts';
import { parseJsonc, readText } from '../src/core/fs.ts';
import { mergeDependencies } from '../src/core/install.ts';
import { authFile, findLicenseKey, userConfigDir } from '../src/core/license.ts';
import type { Lockfile } from '../src/core/lockfile.ts';
import {
  checkTailwind,
  detectFramework,
  detectPackageManager,
  findCssEntry,
  majorOf,
  readAliasRoots,
  resolveAlias,
} from '../src/core/project.ts';
import { cssVarsFile, projectContent, rewriteImports } from '../src/core/transform.ts';
import { tempDir, writeTree } from './helpers.ts';

const aliases = {
  ui: '@/components/ui',
  blocks: '@/components/blocks',
  lib: '@/lib',
  hooks: '@/hooks',
  styles: '@/styles/rectio',
};

let cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
});
function project(files: Record<string, string>) {
  const temp = tempDir('rectio-cli-core-');
  cleanups.push(temp.cleanup);
  writeTree(temp.dir, files);
  return temp.dir;
}

describe('rewriteImports', () => {
  it('maps every alias key in single and double quotes', () => {
    const source = [
      "import { cn } from '@registry/lib/cn';",
      'import { Field } from "@registry/ui/field";',
      "export { useX } from '@registry/hooks/use-x';",
      "const lazy = import('@registry/blocks/summary');",
    ].join('\n');
    expect(rewriteImports(source, aliases)).toBe(
      [
        "import { cn } from '@/lib/cn';",
        'import { Field } from "@/components/ui/field";',
        "export { useX } from '@/hooks/use-x';",
        "const lazy = import('@/components/blocks/summary');",
      ].join('\n'),
    );
  });

  it('leaves unknown keys, prose and other packages alone', () => {
    const source =
      "// see @registry/ui/field\nimport x from '@registry/other/x';\nimport y from '@registryx/ui/y';\n";
    expect(rewriteImports(source, aliases)).toBe(source);
  });

  it('honours a custom alias with a trailing slash', () => {
    expect(rewriteImports("from '@registry/ui/button'", { ...aliases, ui: '~/ui/' })).toBe(
      "from '~/ui/button'",
    );
  });

  it('rewrites scripts only and normalises line endings', () => {
    const file = (path: string, content: string) => ({
      path,
      content,
      type: 'style' as const,
      target: '@styles/x.css',
      sha256: '',
    });
    expect(projectContent(file('ui/a.tsx', "a\r\nimport '@registry/lib/cn';\r\n"), aliases)).toBe(
      "a\nimport '@/lib/cn';\n",
    );
    expect(projectContent(file('styles/a.css', "/* '@registry/lib/cn' */"), aliases)).toBe(
      "/* '@registry/lib/cn' */",
    );
  });

  it('turns cssVars into a style file', () => {
    const file = cssVarsFile('chart', {
      theme: { '--color-chart-1': 'var(--rx-chart-1)' },
      dark: { '--rx-chart-1': 'red' },
    });
    expect(file?.target).toBe('@styles/vars/chart.css');
    expect(file?.content).toContain('@theme inline {\n  --color-chart-1: var(--rx-chart-1);\n}');
    expect(file?.content).toContain('[data-mode="dark"] {\n  --rx-chart-1: red;\n}');
    expect(cssVarsFile('empty', {})).toBeUndefined();
  });
});

describe('project detection', () => {
  it('detects TanStack Start before Vite, then Next, then Vite', () => {
    const cwd = project({});
    expect(
      detectFramework(cwd, { dependencies: { '@tanstack/react-start': '1', vite: '8' } }),
    ).toBe('tanstack-start');
    expect(detectFramework(cwd, { dependencies: { next: '16' } })).toBe('next');
    expect(detectFramework(cwd, { devDependencies: { vite: '8' } })).toBe('vite');
    expect(detectFramework(cwd, {})).toBeUndefined();
    expect(detectFramework(project({ 'vite.config.ts': '' }), {})).toBe('vite');
  });

  it('reads majors', () => {
    expect(majorOf('^4.3.5')).toBe(4);
    expect(majorOf('>=19')).toBe(19);
    expect(majorOf('latest')).toBeUndefined();
  });

  it('requires Tailwind v4, preferring the installed version', () => {
    const cwd = project({ 'node_modules/tailwindcss/package.json': '{"version":"4.3.5"}' });
    expect(checkTailwind(cwd, { devDependencies: { tailwindcss: '^3.4.0' } }, 'vite').version).toBe(
      '4.3.5',
    );
    expect(() =>
      checkTailwind(project({}), { devDependencies: { tailwindcss: '^3.4.0' } }, 'vite'),
    ).toThrow('rectio needs Tailwind CSS v4, found ^3.4.0');
    expect(() => checkTailwind(project({}), {}, 'next')).toThrow('Tailwind CSS is not installed');
    expect(
      checkTailwind(project({}), { devDependencies: { tailwindcss: '^4.1.0' } }, 'next')
        .warnings[0],
    ).toContain('@tailwindcss/postcss');
  });

  it('finds the CSS entry by its Tailwind import', () => {
    expect(findCssEntry(project({ 'src/index.css': "@import 'tailwindcss';\n" }))).toBe(
      'src/index.css',
    );
    expect(
      findCssEntry(
        project({
          'src/index.css': 'body{}',
          'src/theme/main.css': '@import "tailwindcss" source("../");\n',
        }),
      ),
    ).toBe('src/theme/main.css');
    expect(findCssEntry(project({ 'src/index.css': '@tailwind base;\n' }))).toBeUndefined();
  });

  it('picks the package manager from the nearest lockfile, then packageManager', () => {
    expect(detectPackageManager(project({ 'pnpm-lock.yaml': '' }))).toBe('pnpm');
    expect(detectPackageManager(project({ 'bun.lock': '' }))).toBe('bun');
    expect(detectPackageManager(project({ 'yarn.lock': '' }))).toBe('yarn');
    expect(detectPackageManager(project({ 'package-lock.json': '' }))).toBe('npm');
    expect(
      detectPackageManager(project({ 'package.json': '{"packageManager":"yarn@4.5.0"}' })),
    ).toBe('yarn');
    const workspace = project({ 'pnpm-lock.yaml': '', 'apps/web/package.json': '{}' });
    expect(detectPackageManager(join(workspace, 'apps/web'))).toBe('pnpm');
  });

  it('reads path aliases through references, extends and baseUrl', () => {
    const cwd = project({
      'tsconfig.json': '{ "files": [], "references": [{ "path": "./tsconfig.app.json" }] }',
      'tsconfig.app.json': '{ "extends": "./tsconfig.paths.json" }',
      'tsconfig.paths.json':
        '{ "compilerOptions": { "baseUrl": "./src", "paths": { "~/*": ["./*"], "exact": ["./x.ts"] } } }',
    });
    const roots = readAliasRoots(cwd);
    expect(roots).toEqual([{ prefix: '~/', dir: join(cwd, 'src') }]);
    expect(resolveAlias(roots, '~/components/ui')).toBe(join(cwd, 'src', 'components', 'ui'));
    expect(resolveAlias(roots, '@/x')).toBeUndefined();
  });

  it('parses JSON with comments and trailing commas but keeps strings intact', () => {
    expect(parseJsonc('{ // c\n "a": "http://x/*y*/", /* b */ "b": [1, 2,], }')).toEqual({
      a: 'http://x/*y*/',
      b: [1, 2],
    });
  });
});

describe('the CSS entry block', () => {
  const lock = (files: [string, string, 'theme' | 'style' | 'component'][]): Lockfile => ({
    lockfileVersion: 1,
    items: Object.fromEntries(
      files.map(([item, path, type]) => [
        item,
        {
          version: '1.0.0',
          type: 'style',
          tier: 'free',
          integrity: '',
          files: [{ path, source: path, type, sha256: '' }],
        },
      ]),
    ),
  });

  it('orders the default theme, other themes, then styles', () => {
    expect(
      cssImports(
        lock([
          ['tokens', 'src/styles/rectio/tokens.css', 'style'],
          ['theme-ledger', 'src/styles/rectio/themes/ledger.css', 'theme'],
          ['theme-default', 'src/styles/rectio/themes/default.css', 'theme'],
          ['button', 'src/components/ui/button.tsx', 'component'],
        ]),
      ),
    ).toEqual([
      'src/styles/rectio/themes/default.css',
      'src/styles/rectio/themes/ledger.css',
      'src/styles/rectio/tokens.css',
    ]);
  });

  it('inserts the block after the Tailwind import and replaces it later', () => {
    const css = '@import "tailwindcss";\n\nbody {\n  margin: 0;\n}\n';
    const once = updateCssEntry(css, 'src/index.css', ['src/styles/rectio/tokens.css']);
    expect(once).toBe(
      '@import "tailwindcss";\n/* rectio:start (managed by the rectio CLI, do not edit between the markers) */\n@import \'./styles/rectio/tokens.css\';\n/* rectio:end */\n\nbody {\n  margin: 0;\n}\n',
    );
    const twice = updateCssEntry(once, 'src/index.css', [
      'src/a.css',
      'src/styles/rectio/tokens.css',
    ]);
    expect(twice.match(/rectio:start/g)).toHaveLength(1);
    expect(twice).toContain("@import './a.css';\n@import './styles/rectio/tokens.css';");
    expect(
      updateCssEntry(twice, 'src/index.css', ['src/a.css', 'src/styles/rectio/tokens.css']),
    ).toBe(twice);
  });

  it('writes paths that climb out of the entry folder', () => {
    expect(
      updateCssEntry("@import 'tailwindcss';", 'app/globals.css', ['styles/rectio/tokens.css']),
    ).toContain("@import '../styles/rectio/tokens.css';");
  });

  it('refuses an entry without Tailwind', () => {
    expect(() => updateCssEntry('body{}', 'src/index.css', [])).toThrow('does not import Tailwind');
  });

  it('keeps the CRLF endings of a Windows checkout, block included', () => {
    const css = '@import "tailwindcss";\r\n\r\nbody {\r\n  margin: 0;\r\n}\r\n';
    const once = updateCssEntry(css, 'src/index.css', ['src/styles/rectio/tokens.css']);
    expect(once).toContain("@import './styles/rectio/tokens.css';\r\n");
    expect(once.replace(/\r\n/g, '')).not.toContain('\n');
    // A second run finds the CRLF block and replaces it instead of adding another.
    const twice = updateCssEntry(once, 'src/index.css', ['src/styles/rectio/tokens.css']);
    expect(twice).toBe(once);
  });
});

describe('license key lookup', () => {
  it('prefers the env var, then auth.json in the user config dir', () => {
    const home = project({ 'rectio/auth.json': '{"licenseKey":" file-key "}' });
    expect(findLicenseKey({ RECTIO_LICENSE_KEY: 'env-key', XDG_CONFIG_HOME: home })?.key).toBe(
      'env-key',
    );
    expect(findLicenseKey({ XDG_CONFIG_HOME: home })).toEqual({
      key: 'file-key',
      source: join(home, 'rectio', 'auth.json'),
    });
    expect(
      findLicenseKey({ RECTIO_LICENSE_KEY: '  ', XDG_CONFIG_HOME: join(home, 'none') }),
    ).toBeUndefined();
  });

  it('uses APPDATA on Windows', () => {
    expect(userConfigDir({ APPDATA: 'C:\\Users\\x\\AppData\\Roaming' }, 'win32')).toContain(
      'rectio',
    );
    expect(authFile({ XDG_CONFIG_HOME: '/cfg' }, 'darwin')).toBe(
      join('/cfg', 'rectio', 'auth.json'),
    );
  });
});

describe('package.json edits', () => {
  it('keep the CRLF endings and the indentation of a Windows checkout', () => {
    const temp = tempDir('rectio-crlf-');
    try {
      writeTree(temp.dir, {
        'package.json':
          '{\r\n\t"name": "app",\r\n\t"dependencies": {\r\n\t\t"react": "^19.0.0"\r\n\t}\r\n}\r\n',
      });
      mergeDependencies(temp.dir, { dependencies: { motion: '^14.12.0' }, devDependencies: {} });
      const text = readText(join(temp.dir, 'package.json')) ?? '';
      expect(text).toContain('\t\t"motion": "^14.12.0",\r\n');
      expect(text.replace(/\r\n/g, '')).not.toContain('\n');
    } finally {
      temp.cleanup();
    }
  });
});
