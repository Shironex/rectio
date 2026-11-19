/**
 * End to end: a fresh Vite + React + Tailwind v4 app in a temp folder, `rectio init` and
 * `rectio add button dialog money` against the locally built registry, then the app's own
 * typecheck and production build. Runs the built CLI (dist/bin.js) as a child process, the way a
 * user runs it, and installs real packages with pnpm (the store makes repeat runs fast).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { read, tempDir, writeTree } from './helpers.ts';

const here = dirname(fileURLToPath(import.meta.url));
const cliBin = join(here, '..', 'dist', 'bin.js');
const registryDir = join(here, '..', '..', 'registry', 'dist', 'registry');
const TIMEOUT = 300_000;

/** The outer pnpm run leaks npm_* settings (workspace dir, user agent) that must not reach the app. */
function cleanEnv(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key) && key !== 'INIT_CWD'),
  );
}

function run(cwd: string, command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd,
    env: cleanEnv(),
    encoding: 'utf8',
    // Package managers are .cmd shims on Windows; the arguments here are fixed strings.
    shell: process.platform === 'win32' && command !== process.execPath,
    timeout: TIMEOUT,
  });
  const output = `${result.stdout}${result.stderr}`;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${String(result.status)}):\n${output}`);
  }
  return output;
}

const rectio = (cwd: string, ...args: string[]) => run(cwd, process.execPath, [cliBin, ...args]);

const APP: Record<string, string> = {
  'package.json': `${JSON.stringify(
    {
      name: 'rectio-e2e-app',
      private: true,
      type: 'module',
      packageManager: 'pnpm@10.34.5',
      scripts: { typecheck: 'tsc --noEmit -p tsconfig.json', build: 'vite build' },
      dependencies: { react: '19.3.1', 'react-dom': '19.3.1' },
      devDependencies: {
        '@tailwindcss/vite': '4.3.5',
        '@types/react': '19.3.0',
        '@types/react-dom': '19.3.0',
        '@vitejs/plugin-react': '6.3.0',
        tailwindcss: '4.3.5',
        typescript: '6.0.3',
        vite: '8.3.8',
      },
    },
    null,
    2,
  )}\n`,
  'tsconfig.json': `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        verbatimModuleSyntax: true,
        noEmit: true,
        skipLibCheck: true,
        types: ['vite/client'],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['src'],
    },
    null,
    2,
  )}\n`,
  'vite.config.ts': [
    "import { fileURLToPath, URL } from 'node:url';",
    "import tailwindcss from '@tailwindcss/vite';",
    "import react from '@vitejs/plugin-react';",
    "import { defineConfig } from 'vite';",
    '',
    'export default defineConfig({',
    '  plugins: [react(), tailwindcss()],',
    "  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },",
    '});',
    '',
  ].join('\n'),
  'index.html':
    '<!doctype html>\n<html lang="en" data-theme="default">\n  <head><meta charset="UTF-8" /><title>e2e</title></head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n',
  'src/index.css': '@import "tailwindcss";\n',
  'src/main.tsx': [
    "import { StrictMode } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    '',
    "import { App } from './app';",
    "import './index.css';",
    '',
    "const root = document.getElementById('root');",
    "if (root === null) throw new Error('no #root');",
    'createRoot(root).render(',
    '  <StrictMode>',
    '    <App />',
    '  </StrictMode>,',
    ');',
    '',
  ].join('\n'),
  // Until `rectio add` runs, the app has nothing to import.
  'src/app.tsx': 'export function App() {\n  return null;\n}\n',
};

const USES_COMPONENTS = `import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Money } from '@/components/ui/money';

export function App() {
  return (
    <main className="bg-surface-canvas p-6 text-fg">
      <Money amount={-1234.5} currency="EUR" tone="auto" accounting />
      <Dialog>
        <DialogTrigger render={<Button variant="secondary" />}>Review</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve the expense</DialogTitle>
            <DialogDescription>It posts to the March ledger.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Money amount={98.2} currency="PLN" locale="pl-PL" />
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button loading>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
`;

describe('a fresh Vite app', () => {
  let app: ReturnType<typeof tempDir>;

  beforeAll(() => {
    if (!existsSync(cliBin) || !existsSync(join(registryDir, 'index.json'))) {
      throw new Error('build first: pnpm --filter @rectio/registry --filter @rectio/cli build');
    }
    app = tempDir('rectio-e2e-');
    writeTree(app.dir, APP);
    run(app.dir, 'pnpm', ['install', '--prefer-offline']);
  }, TIMEOUT);

  afterAll(() => {
    app.cleanup();
  });

  it(
    'inits, adds button dialog money, then typechecks and builds',
    () => {
      const registry = pathToFileURL(registryDir).href;
      expect(rectio(app.dir, 'init', '--registry', registry)).toContain('Set up rectio for vite');
      expect(rectio(app.dir, 'add', 'button', 'dialog', 'money')).toContain('Installed');

      for (const file of ['button', 'dialog', 'money', 'theme-scope']) {
        expect(existsSync(join(app.dir, `src/components/ui/${file}.tsx`)), file).toBe(true);
      }
      const pkg = JSON.parse(read(app.dir, 'package.json')) as {
        dependencies: Record<string, string>;
      };
      expect(pkg.dependencies).toHaveProperty('@base-ui/react');
      expect(existsSync(join(app.dir, 'node_modules/@base-ui/react/package.json'))).toBe(true);

      writeTree(app.dir, { 'src/app.tsx': USES_COMPONENTS });
      run(app.dir, 'pnpm', ['run', 'typecheck']);
      run(app.dir, 'pnpm', ['run', 'build']);

      const assets = join(app.dir, 'dist', 'assets');
      const cssFile = readdirSync(assets).find((f) => f.endsWith('.css'));
      expect(cssFile).toBeDefined();
      const css = readFileSync(join(assets, cssFile ?? ''), 'utf8');
      // Token utilities compiled and theme variables present: the tokens reached Tailwind.
      expect(css).toContain('--rx-accent');
      expect(css).toMatch(/\.bg-accent\b/);
      expect(css).toContain('IBM Plex Sans');

      // A second add of the same items is a no-op.
      expect(rectio(app.dir, 'add', 'button', 'dialog', 'money')).toContain('already up to date');
      expect(rectio(app.dir, 'diff', 'dialog')).toContain('No differences.');
    },
    TIMEOUT,
  );
});
