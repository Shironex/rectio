import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { main } from '../src/main.ts';
import { KEY, fakeTerminal } from './fake-terminal.ts';
import { VITE_APP, buildTestRegistry, capture, read, tempDir, writeTree } from './helpers.ts';

// Golden files of the rendered output, with color off so they read as plain text. Versions are
// masked, so a kit release only changes them when the counts or the wording change. Refresh them
// with `pnpm vitest run tests/output.test.ts -u` and review the diff like any other change.

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

function folder(files: Record<string, string> = {}) {
  const temp = tempDir('rectio-cli-golden-');
  cleanups.push(temp.cleanup);
  writeTree(temp.dir, files);
  return temp.dir;
}

/** Runs one command and returns its stdout and stderr as one masked text. */
async function render(
  cwd: string,
  args: string[],
  terminal: { tty?: boolean; env?: Record<string, string> } = {},
): Promise<string> {
  const run = capture(cwd, { RECTIO_NO_UPDATE_CHECK: '1', ...terminal.env });
  run.ctx.stdoutIsTTY = terminal.tty === true;
  const code = await main([...args, '--registry', registry.dir], run.ctx);
  const mask = (lines: string[]) =>
    lines
      .join('\n')
      .replaceAll(cwd, '<cwd>')
      .replace(/\b\d+\.\d+\.\d+\b/g, 'x.y.z');
  return `$ rectio ${args.join(' ')}\nexit ${String(code)}\n\n--- stdout\n${mask(run.out)}\n--- stderr\n${mask(run.err)}\n`;
}

const golden = (name: string) => `./golden/${name}.txt`;

async function initialised() {
  const cwd = folder(VITE_APP);
  await render(cwd, ['init', '--no-install']);
  return cwd;
}

describe('rendered output', () => {
  it('init', async () => {
    const cwd = folder(VITE_APP);
    await expect(await render(cwd, ['init', '--no-install'])).toMatchFileSnapshot(golden('init'));
  });

  it('add, then add again', async () => {
    const cwd = await initialised();
    await expect(await render(cwd, ['add', 'dialog', '--no-install'])).toMatchFileSnapshot(
      golden('add'),
    );
    await expect(await render(cwd, ['add', 'dialog', '--no-install'])).toMatchFileSnapshot(
      golden('add-again'),
    );
  });

  it('add --verbose', async () => {
    const cwd = await initialised();
    await expect(
      await render(cwd, ['add', 'ledger-summary', '--no-install', '--verbose']),
    ).toMatchFileSnapshot(golden('add-verbose'));
  });

  it('add --quiet', async () => {
    const cwd = await initialised();
    await expect(
      await render(cwd, ['add', 'ledger-summary', '--no-install', '--quiet']),
    ).toMatchFileSnapshot(golden('add-quiet'));
  });

  it('add in a terminal: indented steps and the box', async () => {
    const cwd = await initialised();
    // FORCE_COLOR=0 keeps the terminal layout but leaves the escape codes out.
    const text = await render(cwd, ['add', 'dialog', '--no-install'], {
      tty: true,
      env: { FORCE_COLOR: '0', LANG: 'en_US.UTF-8' },
    });
    await expect(text).toMatchFileSnapshot(golden('add-terminal'));
  });

  it('init --template, and its dry run', async () => {
    const cwd = folder();
    await expect(
      await render(cwd, ['init', '--template', 'books', 'my-books', '--no-install']),
    ).toMatchFileSnapshot(golden('init-template'));
    await expect(
      await render(cwd, ['init', '--template', 'books', 'shop', '--dry-run']),
    ).toMatchFileSnapshot(golden('init-template-dry-run'));
  });

  it('list, list --templates and search', async () => {
    const cwd = await initialised();
    await expect(await render(cwd, ['list', '--type', 'theme'])).toMatchFileSnapshot(
      golden('list-themes'),
    );
    await expect(await render(cwd, ['list', '--templates'])).toMatchFileSnapshot(
      golden('list-templates'),
    );
    await expect(await render(cwd, ['search', 'ledger'])).toMatchFileSnapshot(golden('search'));
  });

  it('update and the outdated hint', async () => {
    const cwd = await initialised();
    const lock = join(cwd, 'rectio.lock.json');
    const parsed = JSON.parse(read(cwd, 'rectio.lock.json')) as {
      items: Record<string, { version: string }>;
    };
    const cn = parsed.items.cn;
    if (cn !== undefined) cn.version = '0.0.1';
    writeFileSync(lock, JSON.stringify(parsed, null, 2));
    // The masked versions hide which is which; the arrow and the hint are what this pins.
    await expect(await render(cwd, ['update'])).toMatchFileSnapshot(golden('update'));
    await expect(await render(cwd, ['add', 'theme-ledger', '--no-install'])).toMatchFileSnapshot(
      golden('add-outdated'),
    );
  });

  it('errors: an unknown item, no config, an unknown command', async () => {
    const cwd = await initialised();
    await expect(await render(cwd, ['add', 'does-not-exist', '--no-install'])).toMatchFileSnapshot(
      golden('error-unknown-item'),
    );
    await expect(await render(folder(VITE_APP), ['add', 'button'])).toMatchFileSnapshot(
      golden('error-no-config'),
    );
    await expect(await render(cwd, ['launch'])).toMatchFileSnapshot(golden('error-command'));
  });

  it('interactive init: a template, then rectio in an existing app', async () => {
    // The screen a terminal shows at the end, colors dropped: the answered questions, the recap,
    // the steps and the box. Fake package managers keep the choice list the same on every machine.
    const bin = folder({ pnpm: '', npm: '', 'pnpm.cmd': '', 'npm.cmd': '' });
    const env = { PATH: bin, PATHEXT: '.CMD' };
    const screen = async (cwd: string, args: string[], keys: string[][]) => {
      const term = fakeTerminal(cwd, env);
      const run = main([...args, '--registry', registry.dir], term.ctx);
      for (const group of keys) await term.type(...group);
      const code = await run;
      const text = term
        .screen()
        .replaceAll(cwd, '<cwd>')
        .replace(/\b\d+\.\d+\.\d+\b/g, 'x.y.z');
      return `$ rectio ${args.join(' ')}\nexit ${String(code)}\n\n${text}\n`;
    };
    await expect(
      await screen(
        folder(),
        ['init', '--no-install'],
        [['bo', KEY.enter], ['my-books', KEY.enter], [KEY.enter], [KEY.enter]],
      ),
    ).toMatchFileSnapshot(golden('init-interactive-template'));
    await expect(
      await screen(
        folder(VITE_APP),
        ['init', '--no-install'],
        [
          [KEY.enter, KEY.enter, KEY.enter, 'y', KEY.enter],
          [KEY.space, 'j', 'j', 'j', KEY.space, KEY.enter],
        ],
      ),
    ).toMatchFileSnapshot(golden('init-interactive-existing'));
  });

  it('help', async () => {
    const run = capture(folder());
    expect(await main(['--help'], run.ctx)).toBe(0);
    await expect(
      `${run.out.join('\n').replace(/\b\d+\.\d+\.\d+\b/g, 'x.y.z')}\n`,
    ).toMatchFileSnapshot(golden('help'));
  });
});
