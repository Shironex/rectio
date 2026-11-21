import { emitKeypressEvents } from 'node:readline';

import { ESC, visibleWidth } from '../ui/style.ts';

/** The keyboard side of a terminal: process.stdin, or a fake stream in tests. */
export interface PromptInput extends NodeJS.EventEmitter {
  isTTY?: boolean;
  setRawMode?: (mode: boolean) => unknown;
  resume: () => unknown;
  pause: () => unknown;
}

/** What node:readline reports for one key. */
export interface Key {
  name?: string | undefined;
  ctrl?: boolean | undefined;
  meta?: boolean | undefined;
  shift?: boolean | undefined;
  sequence?: string | undefined;
}

/** Ctrl+C, Esc or a closed input in any prompt. Main turns it into exit code 130. */
export class PromptCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'PromptCancelled';
  }
}

/** One drawing of a prompt. `cursor` places the real cursor (text input); unset hides it. */
export interface Frame {
  lines: string[];
  cursor?: { row: number; col: number };
}

/** What a key does: nothing (redraw), submit a value, or cancel. */
export type KeyResult<T> = undefined | { submit: T } | 'cancel';

export interface PromptSpec<T> {
  render: () => Frame;
  key: (text: string | undefined, key: Key) => KeyResult<T>;
  /** The lines left on screen after an answer: one line, the question and the answer. */
  answered: (value: T) => string[];
  /** The line left on screen after a cancel. */
  cancelled: () => string[];
}

export interface PromptIO {
  input: PromptInput;
  write: (text: string) => void;
  columns: number;
}

const up = (n: number) => (n > 0 ? `\u001b[${String(n)}A` : '');
const right = (n: number) => (n > 0 ? `\u001b[${String(n)}C` : '');
const CLEAR_DOWN = '\u001b[J';

/** Cuts a line to the terminal width so it never wraps: a wrapped line breaks the redraw. */
export function fitLine(line: string, columns: number): string {
  const max = Math.max(10, columns - 1);
  if (visibleWidth(line) <= max) return line;
  // Styles are dropped from a cut line; its text stays readable.
  // eslint-disable-next-line no-control-regex
  const plain = line.replace(/\u001b\[[0-9;]*m/g, '');
  return `${plain.slice(0, max - 1)}…`;
}

type KeyHandler = (text: string | undefined, key: Key | undefined) => void;

interface KeyQueue {
  pending: [string | undefined, Key | undefined][];
  handler: KeyHandler | undefined;
}

const queues = new WeakMap<PromptInput, KeyQueue>();

/**
 * One keypress listener per input for the whole run. Keys that arrive while no prompt listens
 * (typed ahead, or several keys in one chunk such as a paste) wait here for the next prompt instead
 * of being lost.
 */
function keyQueue(input: PromptInput): KeyQueue {
  let queue = queues.get(input);
  if (queue === undefined) {
    const made: KeyQueue = { pending: [], handler: undefined };
    emitKeypressEvents(input as NodeJS.ReadableStream);
    input.on('keypress', (text: string | undefined, key: Key | undefined) => {
      if (made.handler === undefined) made.pending.push([text, key]);
      else made.handler(text, key);
    });
    queues.set(input, made);
    queue = made;
  }
  return queue;
}

/** Whether a prompt is waiting for keys on this input (for tests that type step by step). */
export function promptActive(input: PromptInput): boolean {
  return queues.get(input)?.handler !== undefined;
}

/**
 * Runs one prompt: raw mode on, keys in, frames redrawn in place, raw mode off. Resolves with the
 * value or rejects with PromptCancelled; either way the cursor is shown again and the input paused,
 * so the process can exit and the steps that follow print below the answer.
 */
export function runPrompt<T>(io: PromptIO, spec: PromptSpec<T>): Promise<T> {
  const { input, write } = io;
  let drawnRow = -1;

  const draw = (frame: Frame) => {
    const lines = frame.lines.map((line) => fitLine(line, io.columns));
    let out = drawnRow < 0 ? '' : `${up(drawnRow)}\r${CLEAR_DOWN}`;
    out += lines.join('\n');
    if (frame.cursor === undefined) {
      out += ESC.hideCursor;
      drawnRow = lines.length - 1;
    } else {
      const row = Math.min(frame.cursor.row, lines.length - 1);
      out += `${up(lines.length - 1 - row)}\r${right(frame.cursor.col)}${ESC.showCursor}`;
      drawnRow = row;
    }
    write(out);
  };

  return new Promise<T>((resolve, reject) => {
    const finish = (lines: string[], done: () => void) => {
      queue.handler = undefined;
      input.off('end', onEnd);
      draw({ lines });
      write(`\n${ESC.showCursor}`);
      input.setRawMode?.(false);
      input.pause();
      done();
    };
    const cancel = () => {
      state.done = true;
      finish(spec.cancelled(), () => {
        reject(new PromptCancelled());
      });
    };
    const onEnd = () => {
      cancel();
    };
    const state = { done: false };
    const onKey: KeyHandler = (text, key) => {
      if (state.done) return;
      const k = key ?? { sequence: text };
      if ((k.ctrl === true && k.name === 'c') || k.name === 'escape') {
        cancel();
        return;
      }
      const result = spec.key(text, k);
      if (result === 'cancel') cancel();
      else if (result === undefined) draw(spec.render());
      else {
        state.done = true;
        finish(spec.answered(result.submit), () => {
          resolve(result.submit);
        });
      }
    };
    const queue = keyQueue(input);
    input.setRawMode?.(true);
    input.on('end', onEnd);
    draw(spec.render());
    // Keys typed ahead go first; any that this prompt does not take wait for the next one.
    while (!state.done && queue.pending.length > 0) {
      const [text, key] = queue.pending.shift() ?? [undefined, undefined];
      onKey(text, key);
    }
    if (state.done) return;
    queue.handler = onKey;
    input.resume();
  });
}
