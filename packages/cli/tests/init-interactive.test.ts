import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  folderProblem,
  freeFolder,
  promptIO,
  shortDescription,
} from '../src/commands/init-flow.ts';
import { resolveThemeSource } from '../src/core/theme-source.ts';
import { main } from '../src/main.ts';
import { KEY, fakeTerminal, type FakeTerminal } from './fake-terminal.ts';
import { VITE_APP, buildTestRegistry, read, tempDir, writeTree } from './helpers.ts';

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
  vi.unstubAllEnvs();
});

function folder(files: Record<string, string> = {}) {
  const temp = tempDir('rectio-cli-interactive-');
  cleanups.push(temp.cleanup);
  writeTree(temp.dir, files);
  return temp.dir;
}

/** A folder of fake package managers, so the choice list does not depend on this machine. */
function binDir(names: readonly string[]) {
  const dir = folder();
  for (const name of names) {
    writeFileSync(join(dir, name), '#!/bin/sh\n');
    writeFileSync(join(dir, `${name}.cmd`), '@echo off\n');
  }
  return dir;
}

const MANAGERS_ONLY = () => ({ PATH: binDir(['pnpm', 'npm']), PATHEXT: '.CMD' });

/** Starts `rectio <args>` in the fake terminal; await the result after typing. */
function start(term: FakeTerminal, args: string[]) {
  return main([...args, '--registry', registry.dir], term.ctx);
}

const files = (dir: string) => readdirSync(dir).sort();

describe('interactive init: a new app from a template', () => {
  it('asks template, folder, theme, package manager and install, then creates the app', async () => {
    const cwd = folder();
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init']);
    await term.type('bo', KEY.enter); // filter to Books
    await term.type('my-', 'books', KEY.enter);
    await term.type(KEY.enter); // default theme
    await term.type(KEY.up, KEY.down, KEY.enter); // npm is detected; up to pnpm and back
    await term.type('n'); // install now? no
    expect(await run).toBe(0);

    const screen = term.screen();
    expect(screen).toContain('No package.json in this folder');
    expect(screen).toContain('✓ Template                  Books');
    expect(screen).toContain('✓ Project folder            my-books');
    expect(screen).toContain('✓ Theme                     default');
    expect(screen).toContain('✓ Package manager           npm');
    expect(screen).toContain('✓ Install dependencies?     no');
    // git is not on this PATH, so it is not asked.
    expect(screen).not.toContain('Initialise git');
    expect(screen).toContain(
      'books into my-books, default theme, npm, no install, no git (not on PATH)',
    );
    expect(screen).toContain('my-books is ready');
    expect(screen).toContain('npm install');
    expect(read(join(cwd, 'my-books'), 'rectio.json')).toContain('"theme": "default"');
    const pkg = JSON.parse(read(join(cwd, 'my-books'), 'package.json')) as { name: string };
    expect(pkg.name).toBe('my-books');
    // Raw mode was turned on and off for every prompt.
    expect(term.rawModes.filter((m) => m)).toHaveLength(term.rawModes.filter((m) => !m).length);
  });

  it('defaults the folder to the template name and initialises git with a first commit', async () => {
    vi.stubEnv('GIT_CONFIG_GLOBAL', join(folder(), 'none'));
    vi.stubEnv('GIT_AUTHOR_NAME', 'Test');
    vi.stubEnv('GIT_AUTHOR_EMAIL', 'test@example.com');
    vi.stubEnv('GIT_COMMITTER_NAME', 'Test');
    vi.stubEnv('GIT_COMMITTER_EMAIL', 'test@example.com');
    const cwd = folder();
    // A real PATH, so git is found; the template folder is outside any repo.
    const term = fakeTerminal(cwd, { PATH: process.env.PATH });
    const run = start(term, ['init', '--no-install', '--pm', 'npm']);
    await term.type(KEY.enter, KEY.enter, KEY.enter); // Books, books, default
    await term.type(KEY.enter); // git: yes
    expect(await run).toBe(0);
    const screen = term.screen();
    expect(screen).not.toContain('Package manager');
    expect(screen).not.toContain('Install dependencies');
    expect(screen).toContain('✓ Initialise git?           yes');
    expect(screen).toMatch(/\[6\/6\] Creating git repo .*first commit made/);
    expect(existsSync(join(cwd, 'books', '.git'))).toBe(true);
    // The template has no .gitignore, so a default one keeps node_modules out of the commit.
    expect(read(join(cwd, 'books'), '.gitignore')).toContain('node_modules');
    const tracked = spawnSync('git', ['ls-files'], { cwd: join(cwd, 'books'), encoding: 'utf8' });
    expect(tracked.stdout).toContain('.gitignore');
    expect(tracked.stdout).toContain('rectio.json');
  });

  it('skips every question a flag answers', async () => {
    const cwd = folder();
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, [
      'init',
      '--theme',
      'ledger',
      '--pm',
      'pnpm',
      '--no-install',
      '--no-git',
    ]);
    await term.type(KEY.enter, KEY.enter); // template and folder are still asked
    expect(await run).toBe(0);
    const screen = term.screen();
    for (const question of ['Theme', 'Package manager', 'Install dependencies', 'Initialise git']) {
      expect(screen).not.toContain(`? ${question}`);
      expect(screen).not.toContain(`✓ ${question}`);
    }
    expect(screen).toContain('books into books, ledger theme, pnpm, no install, no git');
    expect(read(join(cwd, 'books'), 'rectio.json')).toContain('"theme": "ledger"');
  });

  it('validates the folder and offers the next free name', async () => {
    const cwd = folder({ 'books/page.tsx': 'taken\n' });
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init', '--no-install', '--dry-run']);
    await term.type(KEY.enter); // Books
    await term.type('Bad Name', KEY.enter);
    expect(term.screen()).toContain('"Bad Name" is not a valid package name');
    await term.type(...Array.from({ length: 8 }, () => KEY.backspace), 'books', KEY.enter);
    expect(term.screen()).toContain('books is not empty, pick another name');
    await term.type(...Array.from({ length: 5 }, () => KEY.backspace), KEY.enter);
    await term.type(KEY.enter, KEY.enter);
    expect(await run).toBe(0);
    expect(term.screen()).toContain('✓ Project folder            books-2');
    expect(term.screen()).toContain('Dry run: nothing was written');
    expect(files(cwd)).toEqual(['books']);
  });

  it('refuses a theme URL until the generator support lands, and asks again', async () => {
    const cwd = folder();
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init', '--dry-run']);
    await term.type(KEY.enter, KEY.enter);
    await term.type('j', KEY.enter); // Paste a theme URL
    await term.type('not a url', KEY.enter);
    expect(term.screen()).toContain('paste the URL from the generator (https://...)');
    await term.type(KEY.ctrlC);
    expect(await run).toBe(130);
    expect(
      resolveThemeSource('https://shironex.github.io/rectio/docs/theming/generator#t=x'),
    ).toEqual({
      ok: false,
      message: 'theme URLs need a newer @rectio/cli; choose default for now',
    });
    expect(resolveThemeSource('default')).toEqual({
      ok: true,
      source: { kind: 'registry', id: 'default' },
    });
  });
});

describe('interactive init: rectio in an existing app', () => {
  it('confirms the detection, asks the theme and adds the chosen components', async () => {
    const cwd = folder(VITE_APP);
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init', '--no-install']);
    await term.type(KEY.enter); // Add rectio to this project
    await term.type(KEY.enter); // Vite (detected)
    await term.type(KEY.enter); // src/index.css
    await term.type('y'); // aliases
    await term.type(KEY.enter); // default theme
    await term.type(KEY.space, 'j', 'j', 'j', KEY.space, KEY.enter); // button, dialog
    expect(await run).toBe(0);

    const screen = term.screen();
    // The detection shows beside the first choice while it is asked.
    expect(term.raw()).toMatch(/Add rectio to this project.*Vite, Tailwind \^4/);
    expect(screen).toContain('✓ Framework                 Vite');
    expect(screen).toContain('✓ CSS entry                 src/index.css');
    expect(screen).toContain('✓ Keep these aliases?       yes');
    expect(screen).toContain('✓ Add components now?       button, dialog');
    expect(screen).toContain('Vite, src/index.css, default theme, button + dialog');
    expect(screen).toContain('Set up rectio for vite');
    expect(screen).toContain('Components');
    expect(existsSync(join(cwd, 'src/components/ui/button.tsx'))).toBe(true);
    expect(existsSync(join(cwd, 'src/components/ui/dialog.tsx'))).toBe(true);
    expect(read(cwd, 'rectio.json')).toContain('"ui": "@/components/ui"');
  });

  it('lets the user edit the aliases, checked against the tsconfig paths', async () => {
    const cwd = folder(VITE_APP);
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init', '--no-install', '--theme', 'default']);
    await term.type(KEY.enter, KEY.enter, KEY.enter);
    await term.type('n'); // edit the aliases
    await term.type('~/ui', KEY.enter);
    expect(term.screen()).toContain('start with a tsconfig path alias (@/)');
    await term.type(...Array.from({ length: 4 }, () => KEY.backspace), '@/kit/ui', KEY.enter);
    await term.type(KEY.enter, KEY.enter, KEY.enter, KEY.enter); // blocks, lib, hooks, styles
    await term.type(KEY.enter); // no components
    expect(await run).toBe(0);
    expect(term.screen()).not.toContain('✓ Theme');
    expect(term.screen()).toContain('Add components now?       none');
    expect(read(cwd, 'rectio.json')).toContain('"ui": "@/kit/ui"');
  });

  it('keeps an existing rectio.json and only asks for components', async () => {
    const cwd = folder(VITE_APP);
    expect(
      await main(
        ['init', '--no-install', '--registry', registry.dir],
        fakeTerminal(cwd, {}, { stdinTTY: false }).ctx,
      ),
    ).toBe(0);
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init', '--no-install']);
    await term.type(KEY.enter, KEY.enter);
    expect(await run).toBe(0);
    const screen = term.screen();
    expect(screen).toContain('rectio.json found');
    expect(screen).not.toContain('Framework');
    expect(screen).toContain('rectio.json (kept)');
  });

  it('offers a new app as the second choice', async () => {
    const cwd = folder(VITE_APP);
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init', '--dry-run']);
    await term.type(KEY.down, KEY.enter);
    await term.type(KEY.enter, KEY.enter, KEY.enter, KEY.enter);
    expect(await run).toBe(0);
    expect(term.screen()).toContain('✓ What do you want to do?   Start a new app from a template');
    expect(term.screen()).toContain('Dry run: nothing was written (books from Books)');
  });
});

describe('no questions', () => {
  it.each([
    ['--yes', ['--yes'], {}, {}],
    ['-y', ['-y'], {}, {}],
    ['--quiet', ['--quiet'], {}, {}],
    ['--css', ['--css', 'src/index.css'], {}, {}],
    ['--framework', ['--framework', 'vite'], {}, {}],
    ['CI', [], { CI: 'true' }, {}],
    ['TERM=dumb', [], { TERM: 'dumb' }, {}],
    ['stdin is not a terminal', [], {}, { stdinTTY: false }],
    ['stdout is not a terminal', [], {}, { stdoutTTY: false }],
  ] as const)('under %s, init runs with the defaults', async (_name, flags, env, tty) => {
    const cwd = folder(VITE_APP);
    const term = fakeTerminal(cwd, { ...MANAGERS_ONLY(), ...env }, tty);
    expect(await start(term, ['init', '--no-install', ...flags])).toBe(0);
    expect(term.input.listenerCount('keypress')).toBe(0);
    expect(term.raw()).not.toContain('What do you want to do?');
    expect(read(cwd, 'rectio.json')).toContain('"theme": "default"');
  });

  it('runs init --template exactly as before, even in a terminal', async () => {
    const cwd = folder();
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    expect(await start(term, ['init', '--template', 'books', 'shelf', '--no-install'])).toBe(0);
    expect(term.screen()).not.toContain('? ');
    expect(term.rawModes).toEqual([]);
    expect(term.screen()).toContain('shelf is ready');
  });

  it('names the missing flag when there is no safe default', async () => {
    const cwd = folder();
    const yes = fakeTerminal(cwd, MANAGERS_ONLY());
    expect(await start(yes, ['init', '--yes'])).toBe(1);
    expect(yes.stderr.join('\n')).toContain('--yes cannot pick a template');
    expect(yes.stderr.join('\n')).toContain('Pass --template <name>');

    const taken = folder({ 'books/x.txt': 'x\n' });
    const piped = fakeTerminal(taken, {}, { stdinTTY: false });
    expect(await start(piped, ['init', '--template', 'books', '--no-install'])).toBe(1);
    expect(piped.stderr.join('\n')).toContain('pass --force');

    const bad = fakeTerminal(folder(), {}, { stdinTTY: false });
    expect(await start(bad, ['init', '--template', 'books', '--pm', 'pip'])).toBe(1);
    expect(bad.stderr.join('\n')).toContain('unknown package manager "pip"');
  });

  it('never asks in mcp mode', () => {
    // The MCP server never reaches init; promptIO is the only door to a prompt and init the only caller.
    const term = fakeTerminal(folder(), { CI: '1' });
    expect(promptIO(term.ctx, 80)).toBeUndefined();
    expect(promptIO({ ...term.ctx, env: {} }, 80)).toBeDefined();
  });
});

describe('cancel', () => {
  // Each entry: the keys that reach the prompt, then the cancel key.
  const template: [string, string[]][] = [
    ['template', []],
    ['folder', [KEY.enter]],
    ['theme', [KEY.enter, KEY.enter]],
    ['theme URL', [KEY.enter, KEY.enter, 'j', KEY.enter]],
    ['package manager', [KEY.enter, KEY.enter, KEY.enter]],
    ['install', [KEY.enter, KEY.enter, KEY.enter, KEY.enter]],
  ];
  it.each(template)('at the %s prompt exits 130 and writes nothing', async (_name, keys) => {
    const cwd = folder();
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init']);
    await term.type(...keys, KEY.ctrlC);
    expect(await run).toBe(130);
    expect(files(cwd)).toEqual([]);
    expect(term.stderr).toEqual(['  Cancelled, nothing was written.']);
    expect(term.raw().endsWith('\u001b[?25h')).toBe(true);
    expect(term.rawModes.at(-1)).toBe(false);
  });

  it('at the git prompt', async () => {
    const cwd = folder();
    const term = fakeTerminal(cwd, { PATH: process.env.PATH });
    const run = start(term, ['init', '--no-install', '--pm', 'npm']);
    await term.type(KEY.enter, KEY.enter, KEY.enter, KEY.ctrlC);
    expect(await run).toBe(130);
    expect(files(cwd)).toEqual([]);
  });

  const existing: [string, string[]][] = [
    ['mode', []],
    ['framework', [KEY.enter]],
    ['CSS entry', [KEY.enter, KEY.enter]],
    ['aliases', [KEY.enter, KEY.enter, KEY.enter]],
    ['theme', [KEY.enter, KEY.enter, KEY.enter, 'y']],
    ['components', [KEY.enter, KEY.enter, KEY.enter, 'y', KEY.enter, KEY.space]],
  ];
  it.each(existing)('in an existing app at the %s prompt', async (_name, keys) => {
    const cwd = folder(VITE_APP);
    const before = read(cwd, 'package.json');
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init']);
    await term.type(...keys, KEY.ctrlC);
    expect(await run).toBe(130);
    expect(existsSync(join(cwd, 'rectio.json'))).toBe(false);
    expect(read(cwd, 'package.json')).toBe(before);
    expect(files(cwd)).toEqual(['package.json', 'src', 'tsconfig.app.json', 'tsconfig.json']);
  });

  it('with Esc', async () => {
    const cwd = folder();
    const term = fakeTerminal(cwd, MANAGERS_ONLY());
    const run = start(term, ['init']);
    await term.type(KEY.enter, KEY.esc);
    expect(await run).toBe(130);
    expect(term.screen()).toContain('✗ Project folder');
    expect(files(cwd)).toEqual([]);
  });
});

describe('folder rules', () => {
  it('wants an empty or new folder with a valid package name', () => {
    const cwd = folder({ 'full/a.txt': 'a\n', 'file.txt': 'x\n' });
    mkdirSync(join(cwd, 'empty'));
    expect(folderProblem(cwd, 'new-app')).toBeUndefined();
    expect(folderProblem(cwd, 'empty')).toBeUndefined();
    expect(folderProblem(cwd, 'apps/web')).toBeUndefined();
    expect(folderProblem(cwd, '')).toBe('enter a folder name');
    expect(folderProblem(cwd, 'full')).toBe('full is not empty, pick another name');
    expect(folderProblem(cwd, 'full', true)).toBeUndefined();
    expect(folderProblem(cwd, 'file.txt')).toBe('file.txt is a file');
    expect(folderProblem(cwd, 'My App')).toContain('not a valid package name');
    expect(folderProblem(cwd, '.hidden')).toContain('not a valid package name');
    expect(folderProblem(cwd, 'node_modules')).toContain('not a valid package name');
    expect(freeFolder(cwd, 'full')).toBe('full-2');
    expect(freeFolder(cwd, 'empty')).toBe('empty');
  });

  it('shortens a template description to its first clause', () => {
    expect(shortDescription('A finance back office with a sidebar: overview, invoices.')).toBe(
      'A finance back office with a sidebar',
    );
  });
});
