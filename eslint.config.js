// @ts-check
import js from '@eslint/js';
import architecture from '@noctcore/eslint-plugin-architecture';
import asyncSafety from '@noctcore/eslint-plugin-async-safety';
import codeQuality from '@noctcore/eslint-plugin-code-quality';
import monorepo from '@noctcore/eslint-plugin-monorepo';
import react from '@noctcore/eslint-plugin-react';
import security from '@noctcore/eslint-plugin-security';
import designRules from '@rectio/design-rules/eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TS = ['**/*.{ts,tsx,mts}'];
const JS = ['**/*.{js,mjs}'];

/** Spread a noctcore preset onto the TypeScript files with the typescript-eslint parser. */
const onTs = (/** @type {Record<string, unknown>} */ preset) => ({
  ...preset,
  files: TS,
  languageOptions: { parser: tseslint.parser },
});

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '.rounds/**',
      '**/coverage/**',
      '**/.next/**',
      '**/out/**',
      '**/.source/**',
      '**/next-env.d.ts',
      '.preview-builds/**',
      '**/.previews/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: TS })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({ ...config, files: TS })),
  {
    files: TS,
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: JS,
    languageOptions: { globals: { ...globals.node } },
  },

  // React
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Owner's noctcore plugins, recommended presets per each README.
  onTs(react.configs.recommended),
  onTs(codeQuality.configs.recommended),
  onTs(architecture.configs.recommended),
  onTs(monorepo.configs.recommended),
  onTs(security.configs.recommended),
  onTs(asyncSafety.configs.recommended),
  { ...codeQuality.configs.tests, languageOptions: { parser: tseslint.parser } },

  // Package boundaries.
  {
    files: TS,
    rules: {
      'noctcore-architecture/barrel-purity': 'error',
      'noctcore-architecture/max-import-depth': ['error', { max: 2 }],
      'noctcore-monorepo/no-unexported-subpath-import': ['error', { scopes: ['@rectio'] }],
      'noctcore-architecture/no-restricted-imports-layered': [
        'error',
        {
          bans: {
            noApps: [
              {
                modules: ['@rectio/playground', '**/apps/**'],
                message: 'Packages never depend on an app.',
              },
            ],
            noUi: [
              {
                modules: ['@rectio/ui', '**/packages/ui/**'],
                message: 'Tokens sit below the components: ui may import tokens, not the reverse.',
              },
            ],
            noReact: [{ modules: ['react', 'react-dom'], message: 'Tokens are framework free.' }],
            noPackageSources: [
              {
                modules: ['**/packages/**'],
                message: 'Import a package through its name and public entry point.',
              },
            ],
          },
          layers: [
            { files: ['packages/**'], bans: ['noApps'] },
            { files: ['packages/tokens/**'], bans: ['noUi', 'noReact'] },
            { files: ['apps/**', 'templates/**'], bans: ['noPackageSources'] },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/**/*.{ts,tsx}', 'templates/**/*.{ts,tsx}'],
    rules: {
      // `@rectio/blocks/motion` is a declared entry: each block's motioned twin, picked by import path.
      // `@rectio/blocks/marketing` (and its `/motion`) is the declared entry of the marketing group.
      // `@rectio/blocks/docs` (and its `/motion`) is the declared entry of the docs group.
      // `@rectio/blocks/ai` (and its `/motion`) is the declared entry of the AI group.
      // `@rectio/blocks/analytics` (and its `/motion`) is the declared entry of the analytics group.
      // `@rectio/motion/navigation` is the motioned navigation, split to stay inside its bundle budget.
      // `@rectio/motion/chat` is the motioned chat, split so an app without a conversation never loads it.
      // `@rectio/tokens/generator` (and its `.json` data) is the theme generator core the docs page runs.
      // `@rectio/ui/charts` (and `@rectio/motion/charts`) keeps the chart library out of apps without charts.
      'noctcore-monorepo/no-deep-package-imports': [
        'error',
        {
          scopes: ['@rectio'],
          allowedSubpaths: [
            'motion',
            'marketing',
            'marketing/motion',
            'docs',
            'docs/motion',
            'ai',
            'ai/motion',
            'analytics',
            'analytics/motion',
            'navigation',
            'chat',
            'generator',
            'generator.json',
            'charts',
          ],
        },
      ],
    },
  },

  // The token rule: components, the motion add-on and the site never hardcode a design value.
  {
    files: [
      'packages/ui/src/**/*.{ts,tsx}',
      'packages/motion/src/**/*.{ts,tsx}',
      'packages/blocks/src/**/*.{ts,tsx}',
      'apps/site/{app,components,demos,lib}/**/*.{ts,tsx}',
      'templates/*/{app,components,data,lib}/**/*.{ts,tsx}',
    ],
    ignores: ['**/*.test.{ts,tsx}'],
    plugins: { rectio: designRules },
    rules: {
      'rectio/no-hardcoded-design-values': 'error',
      'rectio/no-invisible-focus-ring': 'error',
    },
  },

  // Plain JS config and tooling files are not in a tsconfig project.
  { files: JS, ...tseslint.configs.disableTypeChecked },
);
