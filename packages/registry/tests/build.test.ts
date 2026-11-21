import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import config from '../registry.config.ts';
import {
  buildRegistry,
  findImports,
  fontSlug,
  packageName,
  replaceImports,
  splitBlocks,
  writeRegistry,
} from '../src/build/index.ts';
import { REGISTRY_URL, SITE_URL, registryItemSchema, verifyItem } from '../src/index.ts';
import { FIXTURE_SOURCES, fixtureConfig, fixtureItem, tempTree } from './helpers.ts';

let cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
});
function fixture(extra: Record<string, string> = {}) {
  const tree = tempTree({ ...FIXTURE_SOURCES, ...extra });
  cleanups.push(tree.cleanup);
  return tree.dir;
}

describe('imports', () => {
  it('finds static, type, re-export, dynamic and side-effect imports but not strings', () => {
    const source = [
      "import { a } from '../lib/cn';",
      'import type { X } from "react";',
      "export { b } from './b';",
      "const c = await import('./c');",
      "import './side.css';",
      'const text = "import x from \'fake\'";',
      "// import y from 'commented'",
    ].join('\n');
    expect(findImports(source).map((s) => s.specifier)).toEqual([
      '../lib/cn',
      'react',
      './b',
      './c',
      './side.css',
    ]);
  });

  it('replaces specifiers in place', () => {
    const source = 'import { a } from \'../a\';\nimport { b } from "../b";\n';
    const out = replaceImports(source, findImports(source), (s) => s.replace('..', '@registry/ui'));
    expect(out).toBe(
      'import { a } from \'@registry/ui/a\';\nimport { b } from "@registry/ui/b";\n',
    );
  });

  it('maps a deep import to its package', () => {
    expect(packageName('@base-ui/react/button')).toBe('@base-ui/react');
    expect(packageName('motion/react')).toBe('motion');
    expect(packageName('clsx')).toBe('clsx');
  });
});

describe('buildRegistry on a fixture', () => {
  it('computes dependencies, rewrites imports, normalises line endings and hashes', () => {
    const { items, index } = buildRegistry(fixtureConfig(fixture()));
    const byName = new Map(items.map((i) => [i.name, i]));

    const badge = byName.get('badge');
    expect(badge?.registryDependencies).toEqual(['cn']);
    expect(badge?.dependencies).toEqual({});
    expect(badge?.requires.react).toBe('^19.0.0');
    expect(badge?.files[0]).toMatchObject({ path: 'ui/badge.tsx', target: '@ui/badge.tsx' });
    expect(badge?.files[0]?.content).toContain("from '@registry/lib/cn'");
    expect(badge?.files[0]?.content).not.toContain('\r');
    // No hook, no UI package: stays a server-safe module.
    expect(badge?.files[0]?.content.startsWith("'use client'")).toBe(false);

    const toggle = byName.get('toggle');
    expect(toggle?.dependencies).toEqual({ '@base-ui/react': '^1.9.0' });
    expect(toggle?.files[0]?.content.startsWith("'use client';\n\n")).toBe(true);

    const card = byName.get('ledger-card');
    expect(card).toMatchObject({ type: 'block', version: '2.1.0' });
    expect(card?.dependencies).toEqual({ motion: '^14.0.0' });
    expect(card?.registryDependencies).toEqual(['badge']);
    expect(card?.files[0]?.target).toBe('@blocks/ledger-card.tsx');

    const cn = byName.get('cn');
    expect(cn?.files[0]).toMatchObject({ path: 'lib/cn.ts', target: '@lib/cn.ts', type: 'lib' });

    for (const item of items) {
      expect(registryItemSchema.safeParse(item).success).toBe(true);
      expect(verifyItem(item)).toEqual([]);
    }
    expect(index.items.map((i) => i.name)).toEqual(['badge', 'cn', 'ledger-card', 'toggle']);
    expect(index.items[0]).not.toHaveProperty('tier');
  });

  it('is deterministic', () => {
    const dir = fixture();
    expect(buildRegistry(fixtureConfig(dir))).toEqual(buildRegistry(fixtureConfig(dir)));
  });

  it('fails on an import no package.json declares', () => {
    const dir = fixture({
      'src/badge/badge.tsx': "import dayjs from 'dayjs';\nexport const d = dayjs;\n",
    });
    expect(() => buildRegistry(fixtureConfig(dir))).toThrow(
      'badge: badge/badge.tsx imports dayjs, which no package.json declares',
    );
  });

  it('fails on a relative import outside every item', () => {
    const dir = fixture({
      'src/badge/badge.tsx': "import { x } from '../internal/x';\nexport const y = x;\n",
      'src/internal/x.ts': 'export const x = 1;\n',
    });
    const items = fixtureConfig(dir).items;
    expect(() =>
      buildRegistry({ ...fixtureConfig(dir, items), requireEveryFolder: false }),
    ).toThrow('imports ../internal/x, which is in no item');
  });

  it('fails on a source folder no item lists', () => {
    const dir = fixture({ 'src/chart/chart.tsx': 'export const Chart = 1;\n' });
    expect(() => buildRegistry(fixtureConfig(dir))).toThrow(
      'folder chart/ belongs to no registry item',
    );
  });

  it('builds an add-on tree on the base items through the base package barrel', () => {
    const dir = fixture({
      'base/index.ts':
        "export { Badge } from '../src/badge/badge';\nexport { cn } from '../src/lib/cn';\n",
      'addon/badge/badge.tsx':
        "import { Badge as Plain, cn } from '@fixture/base';\nexport const Badge = () => <Plain>{cn('x')}</Plain>;\n",
    });
    const result = buildRegistry({
      ...fixtureConfig(dir),
      workspacePackages: { '@fixture/base': join(dir, 'base/index.ts') },
      addons: [
        {
          sourceDir: join(dir, 'addon'),
          targetFolder: 'extra',
          requireEveryFolder: true,
          items: [fixtureItem({ name: 'extra-badge', files: ['badge/badge.tsx'] })],
        },
      ],
    });
    const extra = result.items.find((i) => i.name === 'extra-badge');
    expect(extra?.registryDependencies).toEqual(['badge', 'cn']);
    expect(extra?.files[0]?.target).toBe('@ui/extra/badge.tsx');
    expect(extra?.files[0]?.content).toContain(
      "import { Badge as Plain } from '@registry/ui/badge';",
    );
    expect(extra?.files[0]?.content).toContain("import { cn } from '@registry/lib/cn';");
  });

  it('lets any add-on item depend on any base item', () => {
    const dir = fixture({
      'base/index.ts': "export { LedgerCard } from '../src/ledger-card/ledger-card';\n",
      'addon/card/card.tsx':
        "import { LedgerCard } from '@fixture/base';\nexport const Card = LedgerCard;\n",
    });
    const result = buildRegistry({
      ...fixtureConfig(dir),
      workspacePackages: { '@fixture/base': join(dir, 'base/index.ts') },
      addons: [
        {
          sourceDir: join(dir, 'addon'),
          targetFolder: 'extra',
          items: [fixtureItem({ name: 'extra-card', files: ['card/card.tsx'] })],
        },
      ],
    });
    const card = result.items.find((i) => i.name === 'extra-card');
    expect(card?.registryDependencies).toEqual(['ledger-card']);
  });

  it('fails on a test file in an item', () => {
    const dir = fixture({ 'src/badge/badge.test.tsx': 'export {};\n' });
    const items = [fixtureItem({ name: 'badge', files: ['badge/badge.test.tsx'] })];
    expect(() =>
      buildRegistry({ ...fixtureConfig(dir, items), requireEveryFolder: false }),
    ).toThrow('is a test or story file');
  });

  it('writes the index, latest and versioned copies of every item, and the schemas', () => {
    const dir = fixture();
    const out = join(dir, 'out');
    writeRegistry(out, buildRegistry(fixtureConfig(dir)));
    for (const path of [
      'index.json',
      'items/badge.json',
      'items/badge@1.0.0.json',
      'items/ledger-card.json',
      'items/ledger-card@2.1.0.json',
      'schema/item.json',
      'schema/index.json',
      'schema/config.json',
    ]) {
      expect(existsSync(join(out, path)), path).toBe(true);
    }
    expect(existsSync(join(out, 'pro'))).toBe(false);
    const index = readFileSync(join(out, 'index.json'), 'utf8');
    expect(index).not.toContain('content');
  });
});

describe('the token split', () => {
  it('reads a font slug from a family list', () => {
    expect(fontSlug('"IBM Plex Sans Variable", "IBM Plex Sans", sans-serif')).toBe('ibm-plex-sans');
    expect(fontSlug('"Source Serif 4 Variable", serif')).toBe('source-serif-4');
    expect(fontSlug('ui-sans-serif, system-ui')).toBeUndefined();
  });

  it('splits nested blocks and keeps comments with them', () => {
    const blocks = splitBlocks(
      '/* a */\n:root {\n  --x: 1;\n}\n@media (y) {\n  b {\n    --z: 2;\n  }\n}\n',
    );
    expect(blocks.map((b) => [b.comment, b.prelude])).toEqual([
      ['/* a */', ':root'],
      ['', '@media (y)'],
    ]);
    expect(splitBlocks(blocks[1]?.body ?? '').map((b) => b.prelude)).toEqual(['b']);
  });
});

describe('the rectio registry', () => {
  const result = buildRegistry(config);
  const byName = new Map(result.items.map((i) => [i.name, i]));

  it('points the index and every item at the site on GitHub Pages', () => {
    expect(SITE_URL).toBe('https://shironex.github.io/rectio');
    expect(REGISTRY_URL).toBe(`${SITE_URL}/r`);
    expect(result.index.homepage).toBe(SITE_URL);
    expect(result.index.$schema).toBe(`${REGISTRY_URL}/schema/index.json`);
    for (const item of result.items) expect(item.$schema).toBe(`${REGISTRY_URL}/schema/item.json`);
  });

  it('publishes every component, the tokens, one theme item per theme and one per skin', () => {
    expect([...byName.keys()].sort()).toEqual([
      'accordion',
      'activity-feed',
      'ai-chat-thread',
      'ai-core',
      'alert',
      'alert-dialog',
      'amount-input',
      'announcement-bar',
      'api-keys',
      'app-shell',
      'ar-aging',
      'area-chart',
      'avatar',
      'avatar-group',
      'badge',
      'bank-reconciliation',
      'banner',
      'bar-chart',
      'billing',
      'blocks-core',
      'blog',
      'breadcrumb',
      'budget-vs-actual',
      'button',
      'calendar',
      'card',
      'cash-flow',
      'cash-runway',
      'changelog',
      'chart',
      'chart-card',
      'chat-loader',
      'chat-message',
      'chat-source',
      'chat-thread',
      'checkbox',
      'cn',
      'collapsible',
      'combobox',
      'command-menu',
      'comment-thread',
      'contact',
      'context-menu',
      'cookie-consent',
      'copy-button',
      'cta-band',
      'data-table',
      'date-picker',
      'dialog',
      'docs',
      'docs-api-reference',
      'docs-changelog',
      'docs-code-block',
      'docs-code-tabs',
      'docs-core',
      'docs-feedback',
      'docs-home',
      'docs-layout',
      'docs-page-nav',
      'docs-prose',
      'docs-search',
      'docs-sidebar',
      'docs-switchers',
      'docs-toc',
      'donut-chart',
      'drawer',
      'empty-state',
      'event-card',
      'expense-approval',
      'faq',
      'feature-grid',
      'field',
      'fieldset',
      'file-manager',
      'file-upload',
      'finance-app',
      'hero',
      'hover-card',
      'input-group',
      'invoice-detail',
      'invoice-list',
      'kanban-board',
      'kbd',
      'kpi-row',
      'ledger',
      'legal',
      'line-chart',
      'link',
      'local-date',
      'logo-strip',
      'markdown',
      'marketing-core',
      'menu',
      'message-actions',
      'meter',
      'money',
      'motion-activity-feed',
      'motion-ai-chat-thread',
      'motion-alert',
      'motion-alert-dialog',
      'motion-amount-input',
      'motion-api-keys',
      'motion-ar-aging',
      'motion-area-chart',
      'motion-bank-reconciliation',
      'motion-banner',
      'motion-bar-chart',
      'motion-billing',
      'motion-blocks-core',
      'motion-blog',
      'motion-budget-vs-actual',
      'motion-button',
      'motion-cash-flow',
      'motion-cash-runway',
      'motion-changelog',
      'motion-chart',
      'motion-chat',
      'motion-combobox',
      'motion-comment-thread',
      'motion-contact',
      'motion-cookie-consent',
      'motion-copy-button',
      'motion-core',
      'motion-cta-band',
      'motion-data-table',
      'motion-dialog',
      'motion-docs-changelog',
      'motion-docs-code-tabs',
      'motion-docs-core',
      'motion-docs-feedback',
      'motion-docs-home',
      'motion-docs-toc',
      'motion-donut-chart',
      'motion-expense-approval',
      'motion-faq',
      'motion-feature-grid',
      'motion-file-manager',
      'motion-file-upload',
      'motion-hero',
      'motion-hover-card',
      'motion-invoice-detail',
      'motion-invoice-list',
      'motion-kanban-board',
      'motion-kpi-row',
      'motion-ledger',
      'motion-line-chart',
      'motion-loading-overlay',
      'motion-logo-strip',
      'motion-marketing-core',
      'motion-menu',
      'motion-meter',
      'motion-money',
      'motion-multi-select',
      'motion-newsletter',
      'motion-notification-preferences',
      'motion-notifications-center',
      'motion-number-field',
      'motion-onboarding-checklist',
      'motion-payouts',
      'motion-popover',
      'motion-pricing-table',
      'motion-profile-settings',
      'motion-profit-and-loss',
      'motion-progress',
      'motion-reset-password',
      'motion-saas-core',
      'motion-select',
      'motion-sessions',
      'motion-sign-in',
      'motion-sign-up',
      'motion-skeleton',
      'motion-sparkline',
      'motion-stat-row',
      'motion-switch',
      'motion-tabs',
      'motion-tax-summary',
      'motion-team',
      'motion-team-members',
      'motion-testimonials',
      'motion-time-series-chart',
      'motion-timeline',
      'motion-toast',
      'motion-toggle',
      'motion-two-factor',
      'motion-users-table',
      'motion-vendors-list',
      'motion-week-agenda',
      'multi-select',
      'navigation-menu',
      'newsletter',
      'notification-preferences',
      'notifications-center',
      'number-field',
      'onboarding-checklist',
      'otp-input',
      'pagination',
      'payouts',
      'popover',
      'pricing-table',
      'product-launch',
      'profile-settings',
      'profit-and-loss',
      'progress',
      'progress-circle',
      'prompt-input',
      'radio-group',
      'rating',
      'reasoning',
      'reset-password',
      'resizable',
      'saas-admin',
      'saas-core',
      'saas-landing',
      'scroll-area',
      'search-input',
      'select',
      'separator',
      'sessions',
      'sheet',
      'sidebar',
      'sign-in',
      'sign-up',
      'site-footer',
      'site-header',
      'skeleton',
      'skin-dense',
      'skin-editorial',
      'slider',
      'sparkline',
      'spinner',
      'stat',
      'stat-row',
      'stepper',
      'switch',
      'tabs',
      'tag-input',
      'tax-summary',
      'team',
      'team-members',
      'testimonials',
      'textarea',
      'theme-default',
      'theme-scope',
      'time-field',
      'time-series-chart',
      'timeline',
      'toast',
      'toggle',
      'tokens',
      'tool-call',
      'tooltip',
      'tree',
      'trend-chip',
      'two-factor',
      'users-table',
      'vendors-list',
      'week-agenda',
    ]);
  });

  it('links the data table to the checkbox, button, field, select, menu and search it renders', () => {
    expect(byName.get('data-table')?.registryDependencies).toEqual([
      'tokens',
      'button',
      'checkbox',
      'cn',
      'field',
      'menu',
      'search-input',
      'select',
    ]);
    expect(byName.get('data-table')?.dependencies).toMatchObject({
      '@tanstack/react-table': '^9.3.1',
    });
  });

  it('derives the component graph from the imports', () => {
    expect(byName.get('dialog')?.registryDependencies).toEqual(['tokens', 'cn', 'theme-scope']);
    expect(byName.get('select')?.registryDependencies).toEqual([
      'tokens',
      'cn',
      'field',
      'theme-scope',
    ]);
    expect(byName.get('button')?.dependencies).toEqual({
      '@base-ui/react': '^1.9.0',
      '@phosphor-icons/react': '^2.1.10',
    });
    expect(byName.get('cn')?.dependencies).toEqual({ clsx: '^2.1.1', 'tailwind-merge': '^3.7.0' });
  });

  it('publishes the motion add-on as items built on the plain ones', () => {
    const motion = result.items.filter((item) => item.name.startsWith('motion-'));
    expect(motion.length).toBeGreaterThan(0);
    // The npm dependency is computed from the imports, not declared by hand.
    expect(byName.get('motion-core')?.dependencies).toEqual({ motion: '^14.12.0' });
    expect(byName.get('motion-core')?.files.map((f) => f.target)).toContain(
      '@lib/motion/animate.ts',
    );
    // Imports of @rectio/ui became registry dependencies on the items that export each name.
    expect(byName.get('motion-dialog')?.registryDependencies).toEqual([
      'tokens',
      'cn',
      'dialog',
      'motion-core',
    ]);
    const dialog = byName.get('motion-dialog')?.files[0];
    expect(dialog?.target).toBe('@ui/motion/dialog.tsx');
    expect(dialog?.content).toContain("from '@registry/ui/dialog'");
    expect(dialog?.content).not.toContain('@rectio/ui');
    expect(byName.get('motion-toast')?.registryDependencies).toContain('toast');
  });

  it('publishes every finance block as a block with its motion twin', () => {
    const blocks = [
      'ar-aging',
      'budget-vs-actual',
      'cash-flow',
      'expense-approval',
      'invoice-detail',
      'invoice-list',
      'kpi-row',
      'ledger',
    ];
    for (const name of blocks) {
      for (const item of [byName.get(name), byName.get(`motion-${name}`)]) {
        expect(item, name).toBeDefined();
        expect(item?.type, item?.name).toBe('block');
        expect(item?.version, item?.name).toMatch(/^0\.1\.\d+$/);
      }
      // The plain block rests on the shared core; its twin on the plain block and the motion core.
      expect(byName.get(name)?.registryDependencies).toContain('blocks-core');
      expect(byName.get(`motion-${name}`)?.registryDependencies).toEqual(
        expect.arrayContaining([name, 'motion-blocks-core']),
      );
    }
    // npm dependencies come from the imports: recharts only where a chart is drawn.
    expect(byName.get('cash-flow')?.dependencies).toHaveProperty('recharts');
    expect(byName.get('ledger')?.dependencies).not.toHaveProperty('recharts');
    // Imports of @rectio/motion became registry dependencies on the motion add-on items.
    expect(byName.get('motion-blocks-core')?.registryDependencies).toContain('motion-core');
    const list = byName.get('invoice-list')?.files.find((f) => f.path.endsWith('invoice-list.tsx'));
    expect(list?.target).toBe('@blocks/finance/invoice-list.tsx');
    expect(list?.content).toContain("from '@registry/lib/finance/finance'");
    expect(list?.content).not.toMatch(/@rectio\/(ui|motion)/);
  });

  it('publishes the marketing blocks under their own folder, built on the marketing core', () => {
    const withMotion = [
      'blog',
      'contact',
      'cookie-consent',
      'cta-band',
      'faq',
      'feature-grid',
      'hero',
      'logo-strip',
      'newsletter',
      'stat-row',
      'team',
      'testimonials',
    ];
    const plainOnly = ['announcement-bar', 'legal', 'site-footer', 'site-header'];
    for (const name of [...withMotion, ...plainOnly]) {
      const item = byName.get(name);
      expect(item, name).toBeDefined();
      expect(item?.type, name).toBe('block');
      expect(item?.categories, name).toEqual(['marketing', 'blocks']);
      expect(item?.registryDependencies, name).toContain('marketing-core');
      for (const file of item?.files ?? []) expect(file.target).toMatch(/^@blocks\/marketing\//);
    }
    for (const name of withMotion) {
      expect(byName.get(`motion-${name}`)?.registryDependencies).toEqual(
        expect.arrayContaining([name, 'motion-marketing-core']),
      );
    }
    for (const name of plainOnly) expect(byName.has(`motion-${name}`), name).toBe(false);
    // The core's form and dialog pieces come from the free components, the motion core from motion.
    expect(byName.get('cookie-consent')?.registryDependencies).toContain('dialog');
    expect(byName.get('motion-marketing-core')?.registryDependencies).toContain('motion-button');
    const legal = byName.get('legal')?.files.find((f) => f.path.endsWith('legal.logic.ts'));
    expect(legal?.content).toContain('This is not legal advice.');
  });

  it('publishes every saas block under blocks/saas with its motion twin', () => {
    const blocks = [
      'sign-in',
      'sign-up',
      'two-factor',
      'reset-password',
      'profile-settings',
      'team-members',
      'billing',
      'api-keys',
      'notification-preferences',
      'pricing-table',
      'onboarding-checklist',
      'activity-feed',
      'notifications-center',
      'changelog',
      'users-table',
      'kanban-board',
      'comment-thread',
      'file-manager',
      'sessions',
      'time-series-chart',
    ];
    for (const name of blocks) {
      for (const item of [byName.get(name), byName.get(`motion-${name}`)]) {
        expect(item, name).toBeDefined();
        expect(item?.type, item?.name).toBe('block');
      }
      expect(byName.get(name)?.categories).toContain('saas');
      // Every block rests on a core: the shared panel and parts, and most on the saas core too.
      expect(byName.get(name)?.registryDependencies).toContain('blocks-core');
      expect(byName.get(`motion-${name}`)?.registryDependencies).toEqual(
        expect.arrayContaining([name, 'motion-saas-core']),
      );
    }
    expect(byName.get('motion-saas-core')?.registryDependencies).toContain('motion-blocks-core');
    expect(byName.get('sign-in')?.registryDependencies).toContain('saas-core');
    const signIn = byName.get('sign-in')?.files.find((f) => f.path.endsWith('sign-in.tsx'));
    expect(signIn?.target).toBe('@blocks/saas/sign-in.tsx');
    expect(signIn?.content).toContain("from '@registry/lib/saas/auth'");
    expect(signIn?.content).not.toMatch(/@rectio\/(ui|motion)/);
  });

  it('publishes the docs blocks under their own folder, built on the docs core', () => {
    const withMotion = [
      'docs-toc',
      'docs-code-tabs',
      'docs-feedback',
      'docs-home',
      'docs-changelog',
    ];
    const plainOnly = [
      'docs-layout',
      'docs-sidebar',
      'docs-prose',
      'docs-code-block',
      'docs-api-reference',
      'docs-page-nav',
    ];
    for (const name of [...withMotion, ...plainOnly]) {
      const item = byName.get(name);
      expect(item, name).toBeDefined();
      expect(item?.categories, name).toEqual(['docs', 'blocks']);
      expect(item?.registryDependencies, name).toContain('docs-core');
      for (const file of item?.files ?? []) expect(file.target).toMatch(/^@blocks\/docs\//);
    }
    for (const name of withMotion) {
      expect(byName.get(`motion-${name}`)?.registryDependencies).toEqual(
        expect.arrayContaining([name, 'motion-docs-core']),
      );
    }
    for (const name of plainOnly) expect(byName.has(`motion-${name}`), name).toBe(false);
    // The motioned tab indicator comes from the motion add-on's navigation entry.
    expect(byName.get('motion-docs-core')?.registryDependencies).toContain('motion-tabs');
    // Code tabs build on the code block; the MDX map pulls in what a page can write.
    expect(byName.get('docs-code-tabs')?.registryDependencies).toContain('docs-code-block');
    expect(byName.get('docs-prose')?.registryDependencies).toContain('docs-api-reference');
  });

  it('writes the motion items under items/ with the rest', () => {
    const dir = fixture();
    const out = join(dir, 'registry');
    writeRegistry(out, result);
    expect(existsSync(join(out, 'items/motion-dialog.json'))).toBe(true);
    expect(existsSync(join(out, 'items/motion-dialog@0.2.0.json'))).toBe(true);
    expect(existsSync(join(out, 'pro'))).toBe(false);
  });

  it('publishes every template as a template item that names no workspace package', () => {
    const templates = result.items.filter((i) => i.type === 'template');
    expect(templates.map((t) => t.name).sort()).toEqual([
      'docs',
      'finance-app',
      'product-launch',
      'saas-admin',
      'saas-landing',
    ]);
    for (const template of templates) {
      expect(template.registryDependencies).toEqual(
        expect.arrayContaining(['tokens', 'theme-default', ...(template.template?.uses ?? [])]),
      );
      for (const file of template.files) {
        expect(file.target, file.path).toMatch(/^@project\//);
        expect(file.content, file.path).not.toContain('@rectio/');
        expect(file.content, file.path).not.toContain('rectio:workspace');
      }
      const pkg = template.files.find((f) => f.path === 'template/package.json');
      expect(pkg?.content).not.toContain('workspace:');
    }
  });

  it('keeps no relative import in published kit code', () => {
    // A template is a project of its own: its files may import each other relatively.
    for (const item of result.items.filter((i) => i.type !== 'template')) {
      for (const file of item.files) {
        expect(file.content, file.path).not.toMatch(/from '\.\.?\//);
      }
    }
  });

  it('gives each theme its own selectors and fonts, and the base layer to tokens', () => {
    // The ledger theme was deprecated for one release and is gone; its look is a generator preset.
    expect(byName.has('theme-ledger')).toBe(false);
    expect(result.items.filter((i) => i.type === 'theme').map((i) => i.name)).toEqual([
      'theme-default',
    ]);
    expect(byName.get('theme-default')?.deprecated).toBeUndefined();

    const defaults = byName.get('theme-default')?.files[0]?.content ?? '';
    expect(defaults).toContain(':root,\n[data-theme="default"] {');
    expect(defaults).not.toContain('schibsted');

    const tokens = byName.get('tokens')?.files[0]?.content ?? '';
    expect(tokens).toContain('@theme inline {');
    expect(tokens).toContain('[data-density="compact"]');
    expect(tokens).toContain('prefers-reduced-motion');
    expect(tokens).not.toContain("@import './themes.css'");
    expect(tokens).not.toContain('[data-theme="ledger"]');
    // Skins live in their own items, never in the tokens or a theme.
    expect(tokens).not.toContain('[data-skin="');
    expect(tokens).toContain('[data-density="compact"][data-skin]');
    expect(defaults).not.toContain('[data-skin="');
  });

  it('publishes each skin as its own item, with its fonts', () => {
    const editorial = byName.get('skin-editorial');
    expect(editorial?.type).toBe('skin');
    expect(editorial?.categories).toEqual(['skin']);
    expect(editorial?.registryDependencies).toEqual(['tokens']);
    expect(editorial?.skin?.id).toBe('editorial');
    expect(editorial?.skin?.tokens).toContain('--rx-font-family-display');
    expect(editorial?.dependencies).toEqual({ '@fontsource/ibm-plex-serif': '^5.3.0' });
    const file = editorial?.files[0];
    expect(file?.type).toBe('skin');
    expect(file?.target).toBe('@styles/skins/editorial.css');
    expect(file?.content).toContain("@import '@fontsource/ibm-plex-serif/500.css';");
    expect(file?.content).toContain(
      '[data-skin="editorial"] :where([data-theme]:not([data-skin])) {',
    );
    expect(file?.content).not.toContain('[data-skin="dense"]');
    expect(editorial?.docs).toContain('data-skin="editorial"');

    const dense = byName.get('skin-dense');
    expect(dense?.dependencies).toEqual({});
    expect(dense?.files[0]?.content).not.toContain('@import');
    expect(result.index.items.find((i) => i.name === 'skin-dense')?.type).toBe('skin');
  });
});
