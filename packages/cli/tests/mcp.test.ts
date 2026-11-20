/** The MCP tools against the locally built registry. */
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
import { VITE_APP, buildTestRegistry, tempDir, writeTree } from './helpers.ts';

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

function deps(cwd = project.dir): McpDeps {
  return { client: createRegistryClient(registry.url), cwd };
}

describe('list_items', () => {
  it('lists every item with its type and version and never any source', async () => {
    const { text, isError } = await listItems(deps(), { limit: 500 });
    expect(isError).toBeUndefined();
    expect(text).toContain('name | type | version | title');
    expect(text).toMatch(/\nbutton \| component \| \d+\.\d+\.\d+ \| Button\n/);
    expect(text).toContain('ledger-summary | block |');
    expect(text).toContain('invoice-list | block |');
    expect(text).not.toMatch(/\| (?:free|pro) \|/);
    expect(text).not.toContain('export ');
  });

  it('filters by type', async () => {
    const themes = await listItems(deps(), { type: 'theme' });
    expect(themes.text).toContain('theme-ledger');
    expect(themes.text).not.toContain('button |');
    const libs = await listItems(deps(), { type: 'lib' });
    expect(libs.text).toContain('motion-core | lib |');
    expect(libs.text).not.toContain('| component |');
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
    expect(
      (await searchItems(deps(), { query: 'finance', type: 'block', limit: 100 })).text,
    ).toContain('ledger-summary');
    expect((await searchItems(deps(), { query: '   ' })).isError).toBe(true);
  });
});

describe('get_item', () => {
  it('shows metadata, files and what installs with an item', async () => {
    const { text } = await getItem(deps(), { name: 'data-table' });
    expect(text).toMatch(/^data-table \| component \| \d+\.\d+\.\d+\n/);
    expect(text).toMatch(/Registry dependencies \(installed with it\): .*cn/);
    expect(text).toContain('Add: rectio add data-table');
  });

  it('names close items for a typo', async () => {
    const result = await guard(() => getItem(deps(), { name: 'buton' }));
    expect(result.isError).toBe(true);
    expect(result.text).toContain('no item named "buton"');
    expect(result.text).toContain('button');
  });

  it('shows the files of a block with no key', async () => {
    const { text, isError } = await getItem(deps(), { name: 'ledger-summary' });
    expect(isError).toBeUndefined();
    expect(text).toMatch(/installed with it\): .*money/);
    expect(text).toContain('blocks/ledger-summary.tsx -> @blocks/ledger-summary.tsx');
    expect(text).not.toContain('license');
  });
});

describe('get_item_source', () => {
  it('returns source, one file or all', async () => {
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
      const { text } = await getItemSource(deps(app.dir), { name: 'money' });
      expect(text).toContain('rewritten to the aliases');
      expect(text).not.toContain("'@registry/");
      expect(text).toContain('@/lib/cn');
    } finally {
      app.cleanup();
    }
  });

  it('returns the source of a block and of a motion item with no key', async () => {
    const block = await getItemSource(deps(), { name: 'ledger-summary' });
    expect(block.isError).toBeUndefined();
    expect(block.text).toContain('export function LedgerSummary');
    const motion = await getItemSource(deps(), { name: 'motion-dialog' });
    expect(motion.isError).toBeUndefined();
    expect(motion.text).toContain('export function DialogContent');
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

  it('gives the docs of a block with no key', async () => {
    const { text, isError } = await getDocs(deps(), { item: 'ledger-summary' });
    expect(isError).toBeUndefined();
    expect(text).toContain('LedgerSummary');
  });

  it('says nothing about a license in the general rules', async () => {
    expect((await getDocs(deps(), {})).text).not.toMatch(/licen[cs]e|pro item/i);
  });
});

describe('get_add_command', () => {
  it('returns the exact command and what else installs', async () => {
    const { text } = await getAddCommand(deps(), { items: ['button', 'money'] });
    expect(text.split('\n')[0]).toBe('rectio add button money');
    expect(text).toMatch(/Also installs: .*\bcn\b/);
    expect(text).toContain('does not write files');
  });

  it('answers a template with the init --template command', async () => {
    const { text } = await getAddCommand(deps(), { items: ['books'] });
    expect(text.split('\n')[0]).toBe('rectio init --template books books');
    expect(text).toContain('is a template');
    expect(text).not.toContain('rectio add');
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

  it('flags a missing rectio.json and needs no key for a block', async () => {
    const { text } = await getAddCommand(deps(), { items: ['ledger-summary'] });
    expect(text.split('\n')[0]).toBe('rectio add ledger-summary');
    expect(text).toContain('rectio init');
    expect(text).not.toMatch(/licen[cs]e|pro item/i);
  });

  it('rejects an unknown item', async () => {
    const result = await guard(() => getAddCommand(deps(), { items: ['button', 'nope'] }));
    expect(result.isError).toBe(true);
    expect(result.text).toContain('no item named "nope"');
  });
});
