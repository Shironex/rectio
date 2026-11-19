import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { runAdd } from '../src/commands/add.ts';
import { runDiff } from '../src/commands/diff.ts';
import { runInit } from '../src/commands/init.ts';
import { runList, runSearch } from '../src/commands/list.ts';
import { runUpdate } from '../src/commands/update.ts';
import { readLock } from '../src/core/lockfile.ts';
import { main } from '../src/main.ts';
import { VITE_APP, buildTestRegistry, capture, read, tempDir, writeTree } from './helpers.ts';

let registry: ReturnType<typeof buildTestRegistry>;
beforeAll(() => {
  registry = buildTestRegistry();
});
afterAll(() => {
  registry.cleanup();
});

let cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
});

function app(extra: Record<string, string> = {}) {
  const temp = tempDir('rectio-cli-app-');
  cleanups.push(temp.cleanup);
  writeTree(temp.dir, { ...VITE_APP, ...extra });
  return temp.dir;
}

/** Every file under a folder with its content, to prove a failed command wrote nothing. */
function snapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else out[path.slice(root.length)] = readFileSync(path, 'utf8');
    }
  };
  walk(root);
  return out;
}

const noInstall = { install: false } as const;

async function initialised(env: Record<string, string> = {}) {
  const cwd = app();
  const { ctx } = capture(cwd, env);
  await runInit(ctx, { registry: registry.url, ...noInstall });
  return cwd;
}

describe('init', () => {
  it('writes the config, the tokens, the default theme and cn, and wires the CSS entry', async () => {
    const cwd = app();
    const { ctx, out } = capture(cwd);
    await runInit(ctx, { registry: registry.url, ...noInstall });

    const config = JSON.parse(read(cwd, 'rectio.json')) as Record<string, unknown>;
    expect(config).toMatchObject({
      framework: 'vite',
      css: 'src/index.css',
      theme: 'default',
      registry: registry.url,
      aliases: { ui: '@/components/ui', lib: '@/lib', styles: '@/styles/rectio' },
    });
    expect(existsSync(join(cwd, 'src/styles/rectio/tokens.css'))).toBe(true);
    expect(existsSync(join(cwd, 'src/styles/rectio/themes/default.css'))).toBe(true);
    expect(read(cwd, 'src/lib/cn.ts')).toContain('extendTailwindMerge');

    const css = read(cwd, 'src/index.css');
    expect(css.indexOf("@import './styles/rectio/themes/default.css';")).toBeLessThan(
      css.indexOf("@import './styles/rectio/tokens.css';"),
    );
    expect(css.indexOf('@import "tailwindcss";')).toBe(0);

    const pkg = JSON.parse(read(cwd, 'package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies).toMatchObject({
      clsx: '^2.1.1',
      'tailwind-merge': '^3.7.0',
      '@fontsource-variable/ibm-plex-sans': '^5.3.0',
      react: '^19.3.1',
    });
    expect(Object.keys(readLock(cwd).items).sort()).toEqual(['cn', 'theme-default', 'tokens']);
    expect(out.join('\n')).toContain('Set up rectio for vite');
  });

  it('installs a second theme after the default one', async () => {
    const cwd = app();
    await runInit(capture(cwd).ctx, { registry: registry.url, theme: 'ledger', ...noInstall });
    const css = read(cwd, 'src/index.css');
    const order = ['themes/default.css', 'themes/ledger.css', 'tokens.css'].map((f) =>
      css.indexOf(f),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(JSON.parse(read(cwd, 'rectio.json'))).toMatchObject({ theme: 'ledger' });
  });

  it('is idempotent', async () => {
    const cwd = await initialised();
    const before = snapshot(cwd);
    const { ctx, out } = capture(cwd);
    await runInit(ctx, { registry: registry.url, ...noInstall });
    expect(snapshot(cwd)).toEqual(before);
    expect(out.join('\n')).toContain('already up to date');
  });

  it('explains a missing alias, a missing CSS entry and an unknown theme', async () => {
    const noAlias = app({ 'tsconfig.app.json': '{}' });
    await expect(runInit(capture(noAlias).ctx, { registry: registry.url })).rejects.toThrow(
      'found no import alias in tsconfig.json',
    );
    const noCss = app({ 'src/index.css': 'body {}' });
    await expect(runInit(capture(noCss).ctx, { registry: registry.url })).rejects.toThrow(
      'found no CSS file with @import "tailwindcss"',
    );
    const cwd = app();
    await expect(
      runInit(capture(cwd).ctx, { registry: registry.url, theme: 'neon' }),
    ).rejects.toThrow('unknown theme "neon"');
    expect(existsSync(join(cwd, 'rectio.json'))).toBe(false);
  });
});

describe('add', () => {
  it('adds items with their dependencies and rewritten imports', async () => {
    const cwd = await initialised();
    const { ctx, out } = capture(cwd);
    await runAdd(ctx, ['dialog'], noInstall);

    const dialog = read(cwd, 'src/components/ui/dialog.tsx');
    expect(dialog.startsWith("'use client';")).toBe(true);
    expect(dialog).toContain("from '@/lib/cn'");
    expect(dialog).toContain("from '@/components/ui/theme-scope'");
    expect(dialog).not.toContain('@registry/');
    expect(existsSync(join(cwd, 'src/components/ui/theme-scope.tsx'))).toBe(true);

    const lock = readLock(cwd);
    expect(lock.items.dialog).toMatchObject({ version: '0.1.0', tier: 'free', type: 'component' });
    expect(lock.items.dialog?.files[0]).toMatchObject({
      path: 'src/components/ui/dialog.tsx',
      source: 'ui/dialog.tsx',
    });
    const pkg = JSON.parse(read(cwd, 'package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies['@base-ui/react']).toBe('^1.9.0');
    expect(out.join('\n')).toContain('+ src/components/ui/dialog.tsx');
  });

  it('keeps a range the project already has', async () => {
    const cwd = await initialised();
    const pkgFile = join(cwd, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as {
      dependencies: Record<string, string>;
    };
    pkg.dependencies['@base-ui/react'] = '1.9.0';
    writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
    await runAdd(capture(cwd).ctx, ['button'], noInstall);
    expect(
      (JSON.parse(read(cwd, 'package.json')) as typeof pkg).dependencies['@base-ui/react'],
    ).toBe('1.9.0');
  });

  it('stops on a locally edited file and writes nothing, until --overwrite', async () => {
    const cwd = await initialised();
    await runAdd(capture(cwd).ctx, ['button'], noInstall);
    const file = join(cwd, 'src/components/ui/button.tsx');
    writeFileSync(file, `${readFileSync(file, 'utf8')}\nexport const local = 1;\n`);
    const before = snapshot(cwd);

    await expect(runAdd(capture(cwd).ctx, ['button', 'money'], noInstall)).rejects.toThrow(
      '1 file(s) differ from what rectio installed',
    );
    expect(snapshot(cwd)).toEqual(before);

    await runAdd(capture(cwd).ctx, ['button'], { ...noInstall, overwrite: true });
    expect(read(cwd, 'src/components/ui/button.tsx')).not.toContain('export const local');
  });

  it('treats a CRLF checkout of an untouched file as unchanged', async () => {
    const cwd = await initialised();
    await runAdd(capture(cwd).ctx, ['money'], noInstall);
    const file = join(cwd, 'src/components/ui/money.tsx');
    writeFileSync(file, readFileSync(file, 'utf8').replace(/\n/g, '\r\n'));
    const { ctx, out } = capture(cwd);
    await runAdd(ctx, ['money'], noInstall);
    expect(out.join('\n')).toContain('already up to date');
  });

  it('refuses a pro item without a key and writes nothing', async () => {
    const cwd = await initialised();
    const before = snapshot(cwd);
    await expect(runAdd(capture(cwd).ctx, ['ledger-summary'], noInstall)).rejects.toThrow(
      'ledger-summary is a pro item and no license key was found',
    );
    expect(snapshot(cwd)).toEqual(before);
  });

  it('refuses a motion item without a key and writes nothing', async () => {
    const cwd = await initialised();
    const before = snapshot(cwd);
    await expect(runAdd(capture(cwd).ctx, ['motion-dialog'], noInstall)).rejects.toThrow(
      'motion-core, motion-dialog are pro items and no license key was found',
    );
    expect(snapshot(cwd)).toEqual(before);
  });

  it('installs a motion item with a key beside the plain component it builds on', async () => {
    const cwd = await initialised();
    await runAdd(capture(cwd, { RECTIO_LICENSE_KEY: 'any-key' }).ctx, ['motion-dialog'], noInstall);
    const dialog = read(cwd, 'src/components/ui/motion/dialog.tsx');
    expect(dialog).toContain("from '@/components/ui/dialog'");
    expect(dialog).toContain("from '@/lib/motion/animate'");
    expect(read(cwd, 'src/components/ui/dialog.tsx')).toContain('export function DialogContent');
    expect(read(cwd, 'src/lib/motion/animate.ts')).toContain("from 'motion/mini'");
    const pkg = JSON.parse(read(cwd, 'package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies.motion).toBe('^14.12.0');
    expect(readLock(cwd).items['motion-dialog']?.tier).toBe('pro');
  });

  it('installs a pro item with a key, its free dependencies and its token additions', async () => {
    const cwd = await initialised();
    await runAdd(
      capture(cwd, { RECTIO_LICENSE_KEY: 'any-key' }).ctx,
      ['ledger-summary'],
      noInstall,
    );
    expect(read(cwd, 'src/components/blocks/ledger-summary.tsx')).toContain(
      "from '@/components/ui/money'",
    );
    expect(read(cwd, 'src/styles/rectio/vars/ledger-summary.css')).toContain(
      '--rx-ledger-summary-gap: 1rem;',
    );
    expect(read(cwd, 'src/index.css')).toContain(
      "@import './styles/rectio/vars/ledger-summary.css';",
    );
    expect(readLock(cwd).items['ledger-summary']?.tier).toBe('pro');
  });

  it('refuses a tampered item', async () => {
    const cwd = await initialised();
    const file = join(registry.dir, 'items/money.json');
    const original = readFileSync(file, 'utf8');
    try {
      writeFileSync(file, original.replace('tabular-nums', 'proportional-nums'));
      await expect(runAdd(capture(cwd).ctx, ['money'], noInstall)).rejects.toThrow(
        'money failed its integrity check',
      );
      expect(existsSync(join(cwd, 'src/components/ui/money.tsx'))).toBe(false);
    } finally {
      writeFileSync(file, original);
    }
  });

  it('writes nothing on --dry-run', async () => {
    const cwd = await initialised();
    const before = snapshot(cwd);
    const { ctx, out } = capture(cwd);
    await runAdd(ctx, ['select'], { ...noInstall, dryRun: true });
    expect(snapshot(cwd)).toEqual(before);
    expect(out.join('\n')).toContain('Would install');
    expect(out.join('\n')).toContain('+ src/components/ui/select.tsx');
  });

  it('names an unknown item and needs a config', async () => {
    const cwd = await initialised();
    await expect(runAdd(capture(cwd).ctx, ['nope'], noInstall)).rejects.toThrow(
      'unknown item "nope"',
    );
    await expect(runAdd(capture(app()).ctx, ['button'], noInstall)).rejects.toThrow(
      'no rectio.json',
    );
  });
});

describe('diff, list, search and update', () => {
  it('shows local edits as a patch against the registry', async () => {
    const cwd = await initialised();
    await runAdd(capture(cwd).ctx, ['money'], noInstall);
    const clean = capture(cwd);
    const same = await runDiff(clean.ctx, 'money');
    expect(same.files[0]?.state).toBe('same');
    expect(clean.out.join('\n')).toContain('No differences.');

    const file = join(cwd, 'src/components/ui/money.tsx');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace("const MINUS = '\\u2212';", "const MINUS = '-';"),
    );
    const { ctx, out } = capture(cwd);
    const result = await runDiff(ctx, 'money');
    expect(result.files[0]).toMatchObject({ state: 'changed', editedLocally: true });
    expect(out.join('\n')).toContain("-const MINUS = '-';");
    expect(out.join('\n')).toContain("+const MINUS = '\\u2212';");
    await expect(runDiff(capture(cwd).ctx, 'select')).rejects.toThrow('select is not installed');
  });

  it('lists with filters and marks installed items', async () => {
    const cwd = await initialised();
    const { ctx, out } = capture(cwd);
    const themes = await runList(ctx, { type: 'theme' });
    expect(themes.map((t) => t.name)).toEqual(['theme-default', 'theme-ledger']);
    expect(out[0]).toMatch(/^\* theme-default/);
    const pro = (await runList(capture(cwd).ctx, { tier: 'pro' })).map((t) => t.name);
    expect(pro).toContain('ledger-summary');
    expect(pro).toContain('motion-dialog');
    expect(pro.every((name) => name === 'ledger-summary' || name.startsWith('motion-'))).toBe(true);
  });

  it('searches names first, then titles, categories and descriptions', async () => {
    const cwd = await initialised();
    const hits = await runSearch(capture(cwd).ctx, 'money');
    // Names first (the plain item, then the motion one), then descriptions.
    expect(hits.map((h) => h.name)).toEqual(['money', 'motion-money', 'amount-input']);
    expect((await runSearch(capture(cwd).ctx, 'finance')).map((h) => h.name)).toContain(
      'ledger-summary',
    );
  });

  it('reports outdated items from update', async () => {
    const cwd = await initialised();
    const lockFile = join(cwd, 'rectio.lock.json');
    writeFileSync(
      lockFile,
      read(cwd, 'rectio.lock.json').replace('"version": "0.1.0"', '"version": "0.0.9"'),
    );
    const { ctx, out } = capture(cwd);
    expect(await runUpdate(ctx)).toHaveLength(1);
    expect(out.join('\n')).toContain('-> 0.1.0');
  });
});

describe('main', () => {
  it('prints help, the version and clean errors with exit codes', async () => {
    const cwd = app();
    const help = capture(cwd);
    expect(await main(['--help'], help.ctx)).toBe(0);
    expect(help.out.join('\n')).toContain('Usage: rectio <command>');

    const version = capture(cwd);
    expect(await main(['--version'], version.ctx)).toBe(0);
    expect(version.out[0]).toMatch(/^\d+\.\d+\.\d+/);

    const bad = capture(cwd);
    expect(await main(['add', 'button'], bad.ctx)).toBe(1);
    expect(bad.err.join('\n')).toContain('error: no rectio.json');
    expect(bad.err.join('\n')).toContain('Run `rectio init` first.');

    const unknown = capture(cwd);
    expect(await main(['launch'], unknown.ctx)).toBe(1);
    expect(await main(['add', '--nope'], unknown.ctx)).toBe(1);
  });

  it('runs init and add from arguments', async () => {
    const cwd = app();
    const run = capture(cwd);
    expect(await main(['init', '--registry', registry.dir, '--no-install'], run.ctx)).toBe(0);
    expect(await main(['add', 'button', '--no-install'], run.ctx)).toBe(0);
    expect(existsSync(join(cwd, 'src/components/ui/button.tsx'))).toBe(true);
  });
});
