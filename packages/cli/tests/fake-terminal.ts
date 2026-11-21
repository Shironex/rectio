import { PassThrough } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';

import type { CliContext } from '../src/core/context.ts';
import { promptActive, type PromptInput } from '../src/prompt/session.ts';

/** Key sequences as a terminal sends them. */
export const KEY = {
  enter: '\r',
  up: '\u001b[A',
  down: '\u001b[B',
  space: ' ',
  backspace: '\u007f',
  ctrlC: '\u0003',
  esc: '\u001b',
} as const;

/**
 * Replays what the CLI wrote into the lines a terminal would show: `\r`, `\n`, cursor up (`ESC[nA`),
 * clear to the end of the screen (`ESC[J`), clear line (`ESC[K`) and cursor right (`ESC[nC`). Colors
 * are dropped. Enough for the prompts and the steps, not a full emulator.
 */
export function screenOf(raw: string): string[] {
  const lines: string[] = [''];
  let row = 0;
  let col = 0;
  const put = (text: string) => {
    const line = lines[row] ?? '';
    lines[row] = line.slice(0, col).padEnd(col) + text + line.slice(col + text.length);
    col += text.length;
  };
  // eslint-disable-next-line no-control-regex
  const tokens = raw.split(/(\u001b\[[0-9;?]*[A-Za-z]|\r|\n)/);
  for (const token of tokens) {
    if (token === '') continue;
    if (token === '\n') {
      row += 1;
      col = 0;
      lines[row] ??= '';
    } else if (token === '\r') col = 0;
    else if (token.startsWith('\u001b[')) {
      const n = Number(/\d+/.exec(token)?.[0] ?? '1');
      const op = token.at(-1);
      if (op === 'A') row = Math.max(0, row - n);
      else if (op === 'C') col += n;
      else if (op === 'J') {
        lines[row] = (lines[row] ?? '').slice(0, col);
        lines.length = row + 1;
      } else if (op === 'K') lines[row] = (lines[row] ?? '').slice(0, col);
    } else put(stripVTControlCharacters(token));
  }
  while (lines.length > 0 && lines.at(-1)?.trim() === '') lines.pop();
  return lines.map((line) => line.trimEnd());
}

export interface FakeTerminal {
  ctx: CliContext;
  input: PassThrough & PromptInput;
  /** Everything written, log lines included, in order. */
  raw: () => string;
  screen: () => string;
  stderr: string[];
  /** Sends each key once a prompt is listening; resolves when all are sent. */
  type: (...keys: string[]) => Promise<void>;
  rawModes: boolean[];
}

const tick = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 1);
  });

/** A terminal on both ends: stdin and stdout are TTYs, so `rectio init` asks its questions. */
export function fakeTerminal(
  cwd: string,
  env: Record<string, string | undefined> = {},
  options: { stdinTTY?: boolean; stdoutTTY?: boolean } = {},
): FakeTerminal {
  let raw = '';
  const stderr: string[] = [];
  const rawModes: boolean[] = [];
  const input = Object.assign(new PassThrough(), {
    isTTY: options.stdinTTY ?? true,
    setRawMode: (mode: boolean) => {
      rawModes.push(mode);
    },
  });
  const ctx: CliContext = {
    cwd,
    env: { RECTIO_NO_UPDATE_CHECK: '1', LANG: 'en_US.UTF-8', ...env },
    stdin: input,
    stdoutIsTTY: options.stdoutTTY ?? true,
    columns: 100,
    log: (line) => {
      raw += `${line}\n`;
    },
    warn: (line) => {
      stderr.push(line);
    },
    write: (text) => {
      raw += text;
    },
    now: () => 0,
  };
  const type = async (...keys: string[]) => {
    for (const key of keys) {
      // Wait for a prompt to listen: the flow may be reading the registry between questions.
      for (let n = 0; !promptActive(input); n++) {
        if (n > 5000) throw new Error(`no prompt is listening for ${JSON.stringify(key)}`);
        await tick();
      }
      input.write(key);
      await tick();
    }
  };
  return {
    ctx,
    input,
    raw: () => raw,
    screen: () => screenOf(raw).join('\n'),
    stderr,
    type,
    rawModes,
  };
}
