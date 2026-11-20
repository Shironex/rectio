import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { runAdd } from '../src/commands/add.ts';
import { packageNameFor, runInitTemplate } from '../src/commands/init-template.ts';
import { runList } from '../src/commands/list.ts';
import { readConfig } from '../src/core/config.ts';
import { readLock } from '../src/core/lockfile.ts';
import { main } from '../src/main.ts';
import { buildTestRegistry, capture, read, tempDir } from './helpers.ts';

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

function parent() {
  const temp = tempDir('rectio-cli-template-');
  cleanups.push(temp.cleanup);
  return temp.dir;
}

const noInstall = { install: false } as const;

describe('init --template', () => {
  it('creates the project with no key, rewrites kit imports to its own paths and installs the kit items', async () => {
    const cwd = parent();
    const { ctx, out } = capture(cwd);
    const result = await runInitTemplate(ctx, 'books', {
      registry: registry.url,
      dir: 'My Books',
      ...noInstall,
    });
    const root = join(cwd, 'My Books');
    expect(result.root).toBe(root);

    const page = read(root, 'app/page.tsx');
    expect(page).toContain("import { Button } from '@/components/ui/button';");
    expect(page).toContain("import { Money } from '@/components/ui/money';");
    expect(page).not.toContain('@registry/');

    for (const file of ['components/ui/button.tsx', 'components/ui/money.tsx', 'lib/cn.ts']) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
    expect(existsSync(join(root, 'styles/rectio/themes/ledger.css'))).toBe(true);

    const config = readConfig(root);
    expect(config).toMatchObject({ framework: 'next', css: 'app/globals.css', theme: 'default' });
    expect(config?.aliases.ui).toBe('@/components/ui');

    const lock = readLock(root);
    expect(Object.keys(lock.items)).toEqual(
      expect.arrayContaining(['button', 'money', 'tokens', 'theme-default', 'theme-ledger']),
    );
    // The template itself is the buyer's code from now on, not a tracked item.
    expect(lock.items.books).toBeUndefined();

    expect(read(root, 'app/globals.css')).toMatch(
      /@import 'tailwindcss';\n\/\* rectio:start[^\n]*\n@import '\.\.\/styles\/rectio\/themes\/default\.css';/,
    );
    const pkg = JSON.parse(read(root, 'package.json')) as {
      name: string;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('my-books');
    expect(pkg.dependencies.next).toBe('16.4.6');
    expect(pkg.dependencies).toHaveProperty('@base-ui/react');
    expect(out.join('\n')).toContain('Created My Books from Books');
  });

  it('refuses a folder that is not empty unless --force', async () => {
    const cwd = parent();
    mkdirSync(join(cwd, 'books'));
    writeFileSync(join(cwd, 'books', 'notes.txt'), 'mine\n');
    const { ctx } = capture(cwd);
    await expect(
      runInitTemplate(ctx, 'books', { registry: registry.url, ...noInstall }),
    ).rejects.toThrow('books is not empty');
    expect(existsSync(join(cwd, 'books', 'app'))).toBe(false);
    await runInitTemplate(ctx, 'books', { registry: registry.url, force: true, ...noInstall });
    expect(read(join(cwd, 'books'), 'notes.txt')).toBe('mine\n');
    expect(existsSync(join(cwd, 'books', 'app', 'page.tsx'))).toBe(true);
  });

  it('names the templates when the name is unknown or not a template', async () => {
    const { ctx } = capture(parent());
    await expect(runInitTemplate(ctx, 'bookz', { registry: registry.url })).rejects.toThrow(
      'unknown template "bookz"',
    );
    await expect(runInitTemplate(ctx, 'button', { registry: registry.url })).rejects.toThrow(
      'button is a component, not a template',
    );
    await expect(
      runInitTemplate(ctx, 'books', { registry: registry.url, theme: 'neon' }),
    ).rejects.toThrow('unknown theme "neon"');
  });

  it('prints the plan with --dry-run and writes nothing', async () => {
    const cwd = parent();
    const run = capture(cwd);
    expect(
      await main(
        ['init', '--template', 'books', 'shop', '--registry', registry.dir, '--dry-run'],
        run.ctx,
      ),
    ).toBe(0);
    expect(run.out.join('\n')).toContain('Would create shop from Books');
    expect(existsSync(join(cwd, 'shop'))).toBe(false);
  });

  it('runs from arguments, with the folder as the one positional', async () => {
    const cwd = parent();
    const run = capture(cwd);
    expect(
      await main(
        ['init', '--template', 'books', 'apps/shop', '--registry', registry.dir, '--no-install'],
        run.ctx,
      ),
    ).toBe(0);
    expect(existsSync(join(cwd, 'apps', 'shop', 'components', 'ui', 'button.tsx'))).toBe(true);
    expect(await main(['init', '--template', 'books', 'a', 'b'], capture(cwd).ctx)).toBe(1);
    expect(await main(['init', 'shop'], capture(cwd).ctx)).toBe(1);
  });

  it('turns a folder name into a package name', () => {
    expect(packageNameFor('My Books')).toBe('my-books');
    expect(packageNameFor('ledger_app')).toBe('ledger_app');
    expect(packageNameFor('--')).toBe('rectio-app');
  });
});

describe('templates elsewhere in the CLI', () => {
  it('lists templates with --templates', async () => {
    const { ctx, out } = capture(parent());
    const templates = await runList(ctx, { registry: registry.url, templates: true });
    expect(templates.map((t) => t.name)).toContain('books');
    expect(templates.every((t) => t.type === 'template')).toBe(true);
    expect(out.join('\n')).toMatch(/books\s+app\s+pro\s+Books: A small bookkeeping app\./);
  });

  it('never adds a template to an existing project', async () => {
    const cwd = parent();
    const { ctx } = capture(cwd);
    await runInitTemplate(ctx, 'books', { registry: registry.url, ...noInstall });
    await expect(runAdd(capture(join(cwd, 'books')).ctx, ['books'], noInstall)).rejects.toThrow(
      'books is a template',
    );
  });
});
