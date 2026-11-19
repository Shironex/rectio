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
            { files: ['apps/**'], bans: ['noPackageSources'] },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/**/*.{ts,tsx}'],
    rules: {
      'noctcore-monorepo/no-deep-package-imports': ['error', { scopes: ['@rectio'] }],
    },
  },

  // The token rule: components and the motion add-on never hardcode a design value.
  {
    files: ['packages/ui/src/**/*.{ts,tsx}', 'packages/motion/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    plugins: { rectio: designRules },
    rules: { 'rectio/no-hardcoded-design-values': 'error' },
  },

  // Plain JS config and tooling files are not in a tsconfig project.
  { files: JS, ...tseslint.configs.disableTypeChecked },
);
