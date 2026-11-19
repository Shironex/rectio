/** The MCP tools against the locally built registry, with and without a license key. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createRegistryClient } from '../src/core/registry-client.ts';
import { themeValues } from '../src/mcp/tokens.ts';
import {
  getAddCommand,
  getDocs,
  getItem,
  getItemSource,
  getTokens,
  guard,
  listItems,
  searchItems,
  type McpDeps,
} from '../src/mcp/tools.ts';
import { VITE_APP, buildTestRegistry, capture, tempDir, writeTree } from './helpers.ts';

let registry: ReturnType<typeof buildTestRegistry>;
let project: ReturnType<typeof tempDir>;
beforeAll(() => {
  registry = buildTestRegistry();
  project = tempDir('rectio-mcp-project-');
  writeTree(project.dir, VITE_APP);
});
afterAll(() => {
  registry.cleanup();
  project.cleanup();
});

const KEY = 'sk-test-secret-key';

function deps(vars: Record<string, string> = {}, cwd = project.dir): McpDeps {
  return { client: createRegistryClient(registry.url), env: capture(cwd, vars).ctx.env, cwd };
}
const withKey = () => deps({ RECTIO_LICENSE_KEY: KEY });

describe('list_items', () => {
  it('lists every item with its tier and never any source', async () => {
    const { text, isError } = await listItems(deps(), { limit: 200 });
    expect(isError).toBeUndefined();
    expect(text).toContain('button | component | free |');
    expect(text).toContain('ledger-summary | block | pro |');
    expect(text).toContain('invoice-list | block | pro |');
    expect(text).not.toContain('export ');
  });

  it('filters by type and tier', async () => {
    const themes = await listItems(deps(), { type: 'theme' });
    expect(themes.text).toContain('theme-ledger');
    expect(themes.text).not.toContain('button |');
    const pro = await listItems(deps(), { tier: 'pro' });
    expect(pro.text).toContain('ledger-summary');
    // The motion add-on is pro too, every item of it.
    expect(pro.text).toContain('motion-toast | component | pro |');
    expect(pro.text).toContain('motion-core | lib | pro |');
    expect(pro.text).not.toContain('| free |');
  });

  it('lists the whole registry by default, with nothing cut off', async () => {
    const { text } = await listItems(deps(), {});
    const [header = '', , ...rows] = text.split('\n');
    const count = Number(/^(\d+) item/.exec(header)?.[1]);
    expect(count).toBeGreaterThan(40);
    expect(rows).toHaveLength(count);
    expect(text).not.toMatch(/more; narrow/);
  });

  it('truncates with a hint', async () => {
    const { text } = await listItems(deps(), { limit: 2 });
    expect(text).toMatch(/\.\.\. \d+ more/);
  });
});

describe('search_items', () => {
  it('finds by name, description and category, best first', async () => {
    const byName = await searchItems(deps(), { query: 'money' });
    expect(byName.text.split('\n')[2]).toMatch(/^money \|/);
    const byCategory = await searchItems(deps(), { query: 'overlays' });
    expect(byCategory.text).toContain('dialog');
  });

  it('needs every word to match and respects filters', async () => {
    expect((await searchItems(deps(), { query: 'date picker' })).text).toContain('date-picker');
    expect((await searchItems(deps(), { query: 'money zzzz' })).text).toContain('0 match(es)');
    expect((await searchItems(deps(), { query: 'finance', tier: 'pro' })).text).toContain(
      'ledger-summary',
    );
    expect((await searchItems(deps(), { query: '   ' })).isError).toBe(true);
  });
});

describe('get_item', () => {
  it('shows metadata, files and what installs with a free item', async () => {
    const { text } = await getItem(deps(), { name: 'data-table' });
    expect(text).toContain('data-table | component | free');
    expect(text).toMatch(/Registry dependencies \(installed with it\): .*cn/);
    expect(text).toContain('Add: rectio add data-table');
  });

  it('names close items for a typo', async () => {
    const result = await guard(() => getItem(deps(), { name: 'buton' }));
    expect(result.isError).toBe(true);
    expect(result.text).toContain('no item named "buton"');
    expect(result.text).toContain('button');
  });

  it('shows pro metadata without a key but hides files', async () => {
    const { text, isError } = await getItem(deps(), { name: 'ledger-summary' });
    expect(isError).toBeUndefined();
    expect(text).toContain('ledger-summary | block | pro');
    expect(text).toMatch(/installed with it\): .*money/);
    expect(text).toContain('a license key is needed');
    expect(text).not.toContain('blocks/ledger-summary.tsx');
  });

  it('shows pro files with a key', async () => {
    const { text } = await getItem(withKey(), { name: 'ledger-summary' });
    expect(text).toContain('blocks/ledger-summary.tsx -> @blocks/ledger-summary.tsx');
  });
});

describe('get_item_source', () => {
  it('returns free source, one file or all', async () => {
    const all = await getItemSource(deps(), { name: 'cn' });
    expect(all.text).toContain('--- lib/cn.ts (installs as @lib/cn.ts)');
    const one = await getItemSource(deps(), { name: 'cn', file: 'lib/cn.ts' });
    expect(one.text).toContain('1 of 1 file(s)');
    const missing = await getItemSource(deps(), { name: 'cn', file: 'nope.ts' });
    expect(missing.isError).toBe(true);
    expect(missing.text).toContain('lib/cn.ts');
  });

  it('uses the registry import form without a rectio.json', async () => {
    const { text } = await getItemSource(deps(), { name: 'money' });
    expect(text).toContain('@registry/');
  });

  it('rewrites imports to the project aliases when rectio.json exists', async () => {
    const app = tempDir('rectio-mcp-configured-');
    try {
      writeTree(app.dir, {
        ...VITE_APP,
        'rectio.json': JSON.stringify({
          schemaVersion: 1,
          registry: registry.url,
          framework: 'vite',
          css: 'src/index.css',
          theme: 'default',
          aliases: {
            ui: '@/components/ui',
            blocks: '@/components/blocks',
            lib: '@/lib',
            hooks: '@/hooks',
            styles: '@/styles',
          },
        }),
      });
      const { text } = await getItemSource(deps({}, app.dir), { name: 'money' });
      expect(text).toContain('rewritten to the aliases');
      expect(text).not.toContain("'@registry/");
      expect(text).toContain('@/lib/cn');
    } finally {
      app.cleanup();
    }
  });

  it('refuses a pro item without a key: how to get one, and no source', async () => {
    const { text, isError } = await getItemSource(deps(), { name: 'ledger-summary' });
    expect(isError).toBe(true);
    expect(text).toContain('pro item');
    expect(text).toContain('RECTIO_LICENSE_KEY');
    expect(text).toContain('auth.json');
    expect(text).not.toContain('LedgerSummary');
    expect(text).not.toContain('export function');
  });

  it('returns pro source with a key and never echoes the key', async () => {
    const { text, isError } = await getItemSource(withKey(), { name: 'ledger-summary' });
    expect(isError).toBeUndefined();
    expect(text).toContain('export function LedgerSummary');
    expect(text).not.toContain(KEY);
  });

  it('gates the motion add-on source like any pro item', async () => {
    const without = await getItemSource(deps(), { name: 'motion-dialog' });
    expect(without.isError).toBe(true);
    expect(without.text).not.toContain('export function');
    const withIt = await getItemSource(withKey(), { name: 'motion-dialog' });
    expect(withIt.isError).toBeUndefined();
    expect(withIt.text).toContain('export function DialogContent');
  });

  it('reads the key from auth.json in the config folder too', async () => {
    const home = tempDir('rectio-mcp-home-');
    try {
      writeTree(home.dir, { 'rectio/auth.json': JSON.stringify({ licenseKey: KEY }) });
      const { text } = await getItemSource(deps({ XDG_CONFIG_HOME: home.dir, APPDATA: home.dir }), {
        name: 'ledger-summary',
      });
      expect(text).toContain('export function LedgerSummary');
    } finally {
      home.cleanup();
    }
  });
});

describe('get_tokens', () => {
  it('lists the default theme in light mode with tailwind utilities', async () => {
    const { text, isError } = await getTokens(deps(), {});
    expect(isError).toBeUndefined();
    expect(text).toContain('Theme "default", light mode');
    expect(text).toMatch(/--rx-surface: oklch\(.*\[tailwind: color-surface\]/);
    expect(text).toContain('--rx-font-family-sans');
  });

  it('applies the dark overrides and filters by family', async () => {
    const light = await getTokens(deps(), { theme: 'ledger', filter: 'surface' });
    const dark = await getTokens(deps(), { theme: 'ledger', mode: 'dark', filter: 'surface' });
    expect(dark.text).toContain('dark mode');
    expect(dark.text).not.toBe(light.text);
    expect(dark.text).not.toContain('--rx-font');
  });

  it('names the themes for an unknown one, and a filter with no match', async () => {
    const unknown = await getTokens(deps(), { theme: 'nope' });
    expect(unknown.isError).toBe(true);
    expect(unknown.text).toContain('default, ledger');
    const none = await getTokens(deps(), { filter: 'zzzz' });
    expect(none.isError).toBe(true);
  });

  it('parses only the rules of the named theme', () => {
    const css = `
      :root, [data-theme="a"] { --rx-x: 1; }
      [data-theme="a"][data-mode="dark"] { --rx-x: 2; --rx-y: 3; }
      [data-theme="b"] { --rx-x: 9; }
      @media (prefers-color-scheme: dark) { [data-theme="a"]:not([data-mode]) { --rx-x: 7; } }
    `;
    expect([...themeValues(css, 'a', 'light')]).toEqual([['--rx-x', '1']]);
    expect([...themeValues(css, 'a', 'dark')]).toEqual([
      ['--rx-x', '2'],
      ['--rx-y', '3'],
    ]);
  });
});

describe('get_docs', () => {
  it('gives the general rules without an item', async () => {
    const { text } = await getDocs(deps(), {});
    expect(text).toContain('rectio init');
    expect(text).toContain('data-mode');
  });

  it('uses the registry notes when an item has them', async () => {
    const { text } = await getDocs(deps(), { item: 'theme-ledger' });
    expect(text).toContain('Usage notes: Set data-theme="ledger"');
    expect(text).toContain('Theme "ledger"');
  });

  it('derives a summary with exports when there are no notes', async () => {
    const { text } = await getDocs(deps(), { item: 'money' });
    expect(text).toContain('no usage notes');
    expect(text).toMatch(/Exports of .*money.*: .*Money/);
  });

  it('gates pro docs behind the key', async () => {
    expect((await getDocs(deps(), { item: 'ledger-summary' })).isError).toBe(true);
    expect((await getDocs(withKey(), { item: 'ledger-summary' })).text).toContain('LedgerSummary');
  });
});

describe('get_add_command', () => {
  it('returns the exact command and what else installs', async () => {
    const { text } = await getAddCommand(deps(), { items: ['button', 'money'] });
    expect(text.split('\n')[0]).toBe('rectio add button money');
    expect(text).toMatch(/Also installs: .*\bcn\b/);
    expect(text).toContain('does not write files');
  });

  it('adds flags and the registry that was passed to the server', async () => {
    const { text } = await getAddCommand(
      { ...deps(), registryFlag: 'https://example.test/r' },
      { items: ['button'], overwrite: true, dry_run: true },
    );
    expect(text.split('\n')[0]).toBe(
      'rectio add button --overwrite --dry-run --registry "https://example.test/r"',
    );
  });

  it('flags pro items, a missing key and a missing rectio.json', async () => {
    const noKey = await getAddCommand(deps(), { items: ['ledger-summary'] });
    expect(noKey.text).toContain('Pro items: ledger-summary. No license key found');
    expect(noKey.text).toContain('rectio init');
    const keyed = await getAddCommand(withKey(), { items: ['ledger-summary'] });
    expect(keyed.text).toContain('A license key was found');
    expect(keyed.text).not.toContain(KEY);
  });

  it('rejects an unknown item', async () => {
    const result = await guard(() => getAddCommand(deps(), { items: ['button', 'nope'] }));
    expect(result.isError).toBe(true);
    expect(result.text).toContain('no item named "nope"');
  });
});
