import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { RegistryItem } from '@rectio/registry';
import {
  decodeTheme,
  encodeTheme,
  generatorPresets,
  type GeneratorData,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import generatorData from '@rectio/tokens/generator.json' with { type: 'json' };
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { runAdd } from '../src/commands/add.ts';
import { runDiff } from '../src/commands/diff.ts';
import { runInit } from '../src/commands/init.ts';
import { runUpdate } from '../src/commands/update.ts';
import { readLock } from '../src/core/lockfile.ts';
import { themeCss } from '../src/core/theme-link.ts';
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

const noInstall = { install: false } as const;
const presets = generatorPresets((generatorData as unknown as GeneratorData).presets);
const preset = (id: string): ThemeInputs => {
  const found = presets.find((p) => p.id === id);
  if (found === undefined) throw new Error(`no preset ${id}`);
  return structuredClone(found.inputs);
};
const link = (inputs: ThemeInputs) =>
  `https://example.com/rectio/docs/theming/generator?theme=${encodeTheme(inputs)}`;

async function initialised() {
  const temp = tempDir('rectio-cli-theme-');
  cleanups.push(temp.cleanup);
  writeTree(temp.dir, VITE_APP);
  await runInit(capture(temp.dir).ctx, { registry: registry.url, ...noInstall });
  return temp.dir;
}

const template = (): RegistryItem =>
  JSON.parse(
    readFileSync(join(registry.dir, 'items', 'theme-default.json'), 'utf8'),
  ) as RegistryItem;

describe('add <theme link>', () => {
  it('writes the theme the page shows, locks it with its code and imports it after default', async () => {
    const cwd = await initialised();
    const inputs = preset('ink');
    const { ctx, out } = capture(cwd);
    const report = await runAdd(ctx, [link(inputs)], noInstall);

    expect(report.requested).toEqual(['theme-custom']);
    const css = read(cwd, 'src/styles/rectio/themes/custom.css');
    expect(css).toBe(themeCss(decodeTheme(link(inputs)), template()));
    expect(css).toContain('[data-theme="custom"][data-mode="dark"] {');
    expect(css).toContain(`theme code ${encodeTheme(inputs)}`);

    const locked = readLock(cwd).items['theme-custom'];
    expect(locked).toMatchObject({ type: 'theme', themeCode: encodeTheme(inputs) });
    const entry = read(cwd, 'src/index.css');
    expect(entry.indexOf('themes/default.css')).toBeLessThan(entry.indexOf('themes/custom.css'));
    expect(out.join('\n')).toContain('data-theme="custom"');
  });

  it('adds the font packages a theme imports, under its own name', async () => {
    const cwd = await initialised();
    const inputs = { ...preset('ledger'), name: 'acme-books' };
    await runAdd(capture(cwd).ctx, [link(inputs)], noInstall);
    const pkg = JSON.parse(read(cwd, 'package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies).toMatchObject({
      '@fontsource-variable/schibsted-grotesk': '^5.3.0',
      '@fontsource-variable/source-serif-4': '^5.3.1',
    });
    expect(read(cwd, 'src/styles/rectio/themes/acme-books.css')).toContain(
      '[data-theme="acme-books"]',
    );
  });

  it('accepts a bare theme code, and replaces an untouched theme with a new one', async () => {
    const cwd = await initialised();
    await runAdd(capture(cwd).ctx, [encodeTheme(preset('graphite'))], noInstall);
    const again = capture(cwd);
    await runAdd(again.ctx, [encodeTheme(preset('graphite'))], noInstall);
    expect(again.out.join('\n')).toContain('already up to date');

    const onyx = preset('onyx');
    await runAdd(capture(cwd).ctx, [link(onyx)], noInstall);
    expect(readLock(cwd).items['theme-custom']?.themeCode).toBe(encodeTheme(onyx));
  });

  it('diffs a generated theme against its rebuild, and lists a changed rebuild in update', async () => {
    const cwd = await initialised();
    const inputs = preset('graphite');
    await runAdd(capture(cwd).ctx, [link(inputs)], noInstall);
    const clean = capture(cwd);
    expect((await runDiff(clean.ctx, 'theme-custom')).files[0]?.state).toBe('same');
    expect(clean.out.join('\n')).toContain('No differences.');
    expect(await runUpdate(capture(cwd).ctx)).toEqual([]);

    const file = join(cwd, 'src/styles/rectio/themes/custom.css');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(
        '--rx-radius-control: 0.25rem;',
        '--rx-radius-control: 1rem;',
      ),
    );
    const edited = capture(cwd);
    const result = await runDiff(edited.ctx, 'theme-custom');
    expect(result.files[0]).toMatchObject({ state: 'changed', editedLocally: true });
    expect(edited.out.join('\n')).toContain(`rectio add ${encodeTheme(inputs)} --overwrite`);

    // A rebuild that no longer matches what was installed (here: the lock is older).
    const lockFile = join(cwd, 'rectio.lock.json');
    const lock = JSON.parse(read(cwd, 'rectio.lock.json')) as {
      items: Record<string, { integrity: string }>;
    };
    const custom = lock.items['theme-custom'];
    if (custom === undefined) throw new Error('theme-custom is not locked');
    custom.integrity = 'sha256-older=';
    writeFileSync(lockFile, JSON.stringify(lock));
    const update = capture(cwd);
    const outdated = await runUpdate(update.ctx);
    expect(outdated).toEqual([
      expect.objectContaining({ name: 'theme-custom', code: encodeTheme(inputs) }),
    ]);
    expect(update.out.join('\n')).toContain(`rectio add ${encodeTheme(inputs)} --overwrite`);
  });

  it('refuses a link without a code, a damaged code and a name the registry uses', async () => {
    const cwd = await initialised();
    await expect(runAdd(capture(cwd).ctx, ['https://example.com/docs'], noInstall)).rejects.toThrow(
      'holds no theme code',
    );
    await expect(
      runAdd(capture(cwd).ctx, ['https://example.com/x?theme=1.bm90IGpzb24'], noInstall),
    ).rejects.toThrow('the theme code is damaged');
    await expect(
      runAdd(capture(cwd).ctx, [link({ ...preset('ink'), name: 'scope' })], noInstall),
    ).rejects.toThrow('the registry already has an item called theme-scope');
    expect(readLock(cwd).items['theme-custom']).toBeUndefined();
  });

  it('runs from arguments next to ordinary items', async () => {
    const cwd = await initialised();
    const run = capture(cwd);
    expect(await main(['add', 'button', link(preset('onyx')), '--no-install'], run.ctx)).toBe(0);
    expect(Object.keys(readLock(cwd).items)).toEqual(
      expect.arrayContaining(['button', 'theme-custom']),
    );
  });
});
