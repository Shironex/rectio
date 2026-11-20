import { describe, expect, it } from 'vitest';

import { CliError, type CliContext } from '../src/core/context.ts';
import { box, commandRows, duration, keyValues, rule, wrap } from '../src/ui/layout.ts';
import { Ui } from '../src/ui/output.ts';
import { detectTerminal, styles, supportsUtf8, visibleWidth } from '../src/ui/style.ts';

const UTF8 = { LANG: 'en_US.UTF-8' };

describe('detectTerminal', () => {
  it('colors a terminal and keeps a pipe plain', () => {
    expect(detectTerminal({ env: UTF8, isTTY: true })).toMatchObject({ color: true, fancy: true });
    expect(detectTerminal({ env: UTF8, isTTY: false })).toMatchObject({
      color: false,
      fancy: false,
    });
  });

  it('turns color and the fancy layout off for NO_COLOR and TERM=dumb', () => {
    for (const env of [{ NO_COLOR: '1' }, { TERM: 'dumb' }]) {
      expect(detectTerminal({ env, isTTY: true })).toMatchObject({ color: false, fancy: false });
    }
    // An empty NO_COLOR does not count, per no-color.org.
    expect(detectTerminal({ env: { NO_COLOR: '' }, isTTY: true }).color).toBe(true);
  });

  it('lets FORCE_COLOR color a pipe, and FORCE_COLOR=0 take color off a terminal', () => {
    expect(detectTerminal({ env: { FORCE_COLOR: '1' }, isTTY: false })).toMatchObject({
      color: true,
      fancy: false,
    });
    expect(detectTerminal({ env: { FORCE_COLOR: '0' }, isTTY: true })).toMatchObject({
      color: false,
      fancy: true,
    });
  });

  it('keeps CI plain: no spinner, no box borders', () => {
    expect(detectTerminal({ env: { CI: 'true' }, isTTY: true }).fancy).toBe(false);
    expect(detectTerminal({ env: { CI: 'false' }, isTTY: true }).fancy).toBe(true);
  });

  it('reads UTF-8 from the locale, and assumes it on Windows without one', () => {
    expect(supportsUtf8({ LC_ALL: 'C.UTF-8' }, 'linux')).toBe(true);
    expect(supportsUtf8({ LANG: 'en_US.utf8' }, 'linux')).toBe(true);
    expect(supportsUtf8({ LANG: 'C' }, 'linux')).toBe(false);
    expect(supportsUtf8({}, 'linux')).toBe(false);
    expect(supportsUtf8({}, 'win32')).toBe(true);
  });

  it('falls back to 80 columns', () => {
    expect(detectTerminal({ env: {}, isTTY: true }).columns).toBe(80);
    expect(detectTerminal({ env: {}, isTTY: true, columns: 0 }).columns).toBe(80);
    expect(detectTerminal({ env: {}, isTTY: true, columns: 120 }).columns).toBe(120);
  });
});

describe('styles', () => {
  it('writes ANSI codes only with color on', () => {
    expect(styles(true).red('x')).toBe('\u001b[31mx\u001b[39m');
    expect(styles(false).red('x')).toBe('x');
    expect(styles(false).bold(styles(false).dim('x'))).toBe('x');
  });

  it('measures the visible width without escape codes', () => {
    expect(visibleWidth(styles(true).bold('rectio'))).toBe(6);
    expect(visibleWidth('✓ done')).toBe(6);
  });
});

describe('layout', () => {
  const plain = styles(false);
  const term = { color: false, fancy: true, utf8: true, columns: 80 };

  it('lines up key rows and command rows', () => {
    expect(
      keyValues(
        [
          ['a', '1'],
          ['long key', '2'],
        ],
        plain,
      ),
    ).toEqual(['a         1', 'long key  2']);
    expect(
      commandRows(
        [
          ['cd app', 'go there'],
          ['pnpm dev', 'run it'],
        ],
        plain,
      ),
    ).toEqual(['  cd app    go there', '  pnpm dev  run it']);
  });

  it('draws a rounded box, and drops the borders when it does not fit or the layout is plain', () => {
    expect(box(['Ready', '', 'Files  3'], term, plain)).toEqual([
      '',
      '  ╭──────────╮',
      '  │ Ready    │',
      '  │          │',
      '  │ Files  3 │',
      '  ╰──────────╯',
    ]);
    expect(box(['Ready', 'Files  3'], { ...term, utf8: false }, plain)[1]).toBe('  +----------+');
    expect(box(['Ready', 'x'.repeat(80)], term, plain)).toEqual([
      '',
      '  Ready',
      `  ${'x'.repeat(80)}`,
    ]);
    expect(box(['Ready', 'Files  3'], { ...term, fancy: false }, plain)).toEqual([
      '',
      'Ready',
      'Files  3',
    ]);
  });

  it('draws section rules, wraps word lists and formats durations', () => {
    expect(rule('Themes (2)', { ...term, columns: 30 }, plain)).toBe(
      '── Themes (2) ────────────────',
    );
    expect(wrap(['/a', '/bb', '/ccc'], 8)).toEqual(['/a, /bb,', '/ccc']);
    expect(duration(0)).toBe('0.0s');
    expect(duration(1234)).toBe('1.2s');
    expect(duration(12_600)).toBe('13s');
  });
});

function fakeContext(env: Record<string, string>, isTTY: boolean) {
  const out: string[] = [];
  const err: string[] = [];
  const raw: string[] = [];
  const ctx: CliContext = {
    cwd: '.',
    env,
    stdoutIsTTY: isTTY,
    log: (line) => out.push(line),
    warn: (line) => err.push(line),
    write: (text) => raw.push(text),
    now: () => 0,
  };
  return { ctx, out, err, raw };
}

describe('steps', () => {
  it('prints plain step lines when piped, with no spinner', async () => {
    const run = fakeContext(UTF8, false);
    const steps = new Ui(run.ctx).steps(2);
    await steps.run('Fetching', (step) => {
      step.note = '3 items';
    });
    steps.skip('Installing', 'nothing new');
    expect(run.out).toEqual([
      '[1/2] Fetching ... ok (0.0s) 3 items',
      '[2/2] Installing ... skipped (nothing new)',
    ]);
    expect(run.raw).toEqual([]);
  });

  it('spins in a terminal, then replaces the spinner with the result line', async () => {
    const run = fakeContext({ ...UTF8, FORCE_COLOR: '0' }, true);
    const steps = new Ui(run.ctx).steps(1);
    await steps.run('Resolving items', (step) => {
      step.note = '91 items';
    });
    expect(run.raw[0]).toBe('\u001b[?25l');
    expect(run.raw[1]).toBe('\r\u001b[K  ⠋ [1/1] Resolving items');
    expect(run.raw.at(-1)).toBe('\r\u001b[K\u001b[?25h');
    expect(run.out).toEqual(['  ✓ [1/1] Resolving items      0.0s  91 items']);
  });

  it('uses ASCII marks without a UTF-8 locale', async () => {
    const run = fakeContext({ LANG: 'C', FORCE_COLOR: '0' }, true);
    await new Ui(run.ctx).steps(1).run('Writing files', () => undefined);
    expect(run.raw[1]).toBe('\r\u001b[K  | [1/1] Writing files');
    expect(run.out).toEqual(['  + [1/1] Writing files        0.0s']);
  });

  it('prints the error block with the step and whether anything was written', async () => {
    const run = fakeContext(UTF8, false);
    const steps = new Ui(run.ctx).steps(3);
    const error = new CliError('no rectio.json in .', 'Run `rectio init` first.');
    await expect(
      steps.run('Checking project', () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(error.reported).toBe(true);
    expect(run.out).toEqual(['[1/3] Checking project ... FAILED']);
    expect(run.err).toEqual([
      'error: no rectio.json in .',
      'step: Checking project (1 of 3)',
      'Run `rectio init` first.',
      'Nothing was written.',
    ]);
  });

  it('keeps only the result line and errors in quiet mode', async () => {
    const run = fakeContext(UTF8, true);
    const ui = new Ui(run.ctx, { quiet: true });
    ui.header('add', '0.1.1');
    await ui.steps(1).run('Writing files', () => undefined);
    ui.summary(['Added button', '', 'Files  2']);
    expect(run.out).toEqual(['Added button']);
    expect(run.raw).toEqual([]);
  });
});
