import { wrap } from '../ui/layout.ts';
import type { Glyphs, Styles } from '../ui/style.ts';
import { pad, visibleWidth } from '../ui/style.ts';
import { runPrompt, type Frame, type Key, type KeyResult, type PromptIO } from './session.ts';

export interface Choice<V> {
  value: V;
  label: string;
  /** Dim text beside the label. */
  hint?: string;
  /** Dim lines under the list while this choice is active. */
  description?: string;
  /** Shown dim and skipped by the cursor, with this reason beside it. */
  disabled?: string;
}

export interface SelectOptions<V> {
  message: string;
  choices: readonly Choice<V>[];
  initial?: V;
  /** Dim lines under the question, such as a link. */
  note?: readonly string[];
  /** Typing narrows the list by label, hint and description. */
  filter?: boolean;
}

export interface MultiSelectOptions<V> {
  message: string;
  choices: readonly Choice<V>[];
  initial?: readonly V[];
  note?: readonly string[];
}

export interface TextOptions {
  message: string;
  /** Used when the answer is left empty; shown dim as a placeholder. */
  initial?: string;
  note?: readonly string[];
  /** An error message, or undefined when the value is fine. */
  validate?: (value: string) => string | undefined;
}

export interface ConfirmOptions {
  message: string;
  initial: boolean;
  note?: readonly string[];
}

const isPrintable = (text: string | undefined, key: Key): text is string =>
  text?.length === 1 && key.ctrl !== true && key.meta !== true && text >= ' ' && text !== '\u007f';

/** Width the answered questions are padded to, so the answers line up. */
const ANSWER_COLUMN = 19;

const isUp = (key: Key) => key.name === 'up' || (key.ctrl === true && key.name === 'p');
const isDown = (key: Key) => key.name === 'down' || (key.ctrl === true && key.name === 'n');
const isEnter = (key: Key) => key.name === 'return' || key.name === 'enter';

/**
 * The four prompts the CLI asks with, drawn in the same language as the steps: a cyan `?` while
 * asking, a green check and the cyan answer once answered, dim hints. Every state is also in the
 * text (`›` marks the cursor, `[x]` a chosen item), so nothing depends on color alone.
 */
export class Prompter {
  constructor(
    private readonly io: PromptIO,
    private readonly s: Styles,
    private readonly g: Glyphs,
    private readonly utf8: boolean,
    private readonly indent: string,
  ) {}

  private get pointer(): string {
    return this.utf8 ? '›' : '>';
  }

  private get dot(): string {
    return this.utf8 ? ' · ' : ' | ';
  }

  /** `? Message`, and a value beside it (text, confirm) in the same column as the answers. */
  private question(message: string, tail?: string): string {
    const mark = `${this.indent}${this.s.bold(this.s.cyan('?'))} `;
    if (tail === undefined) return `${mark}${this.s.bold(message)}`;
    return `${mark}${this.s.bold(pad(message, ANSWER_COLUMN))}  ${tail}`;
  }

  private help(parts: readonly string[]): string {
    return `${this.indent}  ${this.s.dim(parts.join(this.dot))}`;
  }

  private notes(note: readonly string[] | undefined): string[] {
    return (note ?? []).map((line) => `${this.indent}  ${this.s.dim(line)}`);
  }

  private answeredLine(message: string, answer: string): string[] {
    // Short questions line their answers up, like the step titles below them.
    return [
      `${this.indent}${this.s.green(this.g.ok)} ${pad(message, ANSWER_COLUMN)}  ${this.s.cyan(answer)}`,
    ];
  }

  private cancelledLine(message: string): string[] {
    return [`${this.indent}${this.s.dim(`${this.g.fail} ${message}`)}`];
  }

  private get arrows(): string {
    return this.utf8 ? '↑↓' : 'up/down';
  }

  /** Choice rows with the labels lined up and the hints dim beside them. */
  private rows<V>(
    choices: readonly Choice<V>[],
    active: number,
    mark: (choice: Choice<V>, index: number) => string,
  ): string[] {
    const width = Math.max(0, ...choices.map((c) => visibleWidth(c.label)));
    return choices.map((choice, i) => {
      const cursor = i === active ? this.s.cyan(this.pointer) : ' ';
      const label = pad(choice.label, width);
      const hint = choice.disabled ?? choice.hint ?? '';
      const text = `${mark(choice, i)}${i === active ? this.s.cyan(label) : label}`;
      const line = `${this.indent}  ${cursor} ${choice.disabled === undefined ? text : this.s.dim(text)}`;
      return hint === '' ? line.trimEnd() : `${line}  ${this.s.dim(hint)}`;
    });
  }

  private description(choice: Choice<unknown> | undefined): string[] {
    if (choice?.description === undefined) return [];
    const width = Math.max(30, Math.min(72, this.io.columns - 8));
    // Set apart from the list by a blank line, so it does not read as one more choice.
    return [
      '',
      ...wrap(choice.description.split(' '), width, ' ').map(
        (line) => `${this.indent}    ${this.s.dim(line)}`,
      ),
    ];
  }

  select<V>(options: SelectOptions<V>): Promise<V> {
    const { message, choices } = options;
    let query = '';
    const visible = () => {
      const q = query.toLowerCase();
      return q === ''
        ? choices
        : choices.filter((c) =>
            [c.label, c.hint ?? '', c.description ?? '', String(c.value)].some((t) =>
              t.toLowerCase().includes(q),
            ),
          );
    };
    const firstEnabled = (list: readonly Choice<V>[], from = 0) => {
      const i = list.findIndex((c, n) => n >= from && c.disabled === undefined);
      return i < 0 ? list.findIndex((c) => c.disabled === undefined) : i;
    };
    const initial = choices.findIndex(
      (c) => c.value === options.initial && c.disabled === undefined,
    );
    let active = initial < 0 ? firstEnabled(choices) : initial;

    const move = (step: number) => {
      const list = visible();
      if (list.length === 0) return;
      for (let n = 1; n <= list.length; n++) {
        const i = (active + step * n + list.length * n) % list.length;
        if (list[i]?.disabled === undefined) {
          active = i;
          return;
        }
      }
    };

    const render = (): Frame => {
      const list = visible();
      const lines = [this.question(message), ...this.notes(options.note)];
      if (options.filter === true && query !== '') {
        lines.push(`${this.indent}  ${this.s.dim('filter')} ${query}`);
      }
      if (list.length === 0) lines.push(`${this.indent}    ${this.s.dim('No match.')}`);
      lines.push(...this.rows(list, active, () => ''));
      lines.push(...this.description(list[active]));
      const keys = [
        `${this.arrows} move`,
        'enter choose',
        ...(options.filter === true ? ['type to filter'] : []),
        'esc cancel',
      ];
      lines.push(this.help(keys));
      return { lines };
    };

    const key = (text: string | undefined, k: Key): KeyResult<V> => {
      // j and k move while the filter is empty; once you type, they are letters of the filter.
      const typing = options.filter === true && query !== '';
      if (isUp(k) || (!typing && text === 'k')) move(-1);
      else if (isDown(k) || (!typing && text === 'j')) move(1);
      else if (isEnter(k)) {
        const choice = visible()[active];
        if (choice !== undefined && choice.disabled === undefined) return { submit: choice.value };
      } else if (options.filter === true && k.name === 'backspace') {
        query = query.slice(0, -1);
        active = firstEnabled(visible());
      } else if (options.filter === true && isPrintable(text, k)) {
        query += text;
        active = firstEnabled(visible());
      }
      return undefined;
    };

    return runPrompt(this.io, {
      render,
      key,
      answered: (value) =>
        this.answeredLine(message, choices.find((c) => c.value === value)?.label ?? String(value)),
      cancelled: () => this.cancelledLine(message),
    });
  }

  multiselect<V>(options: MultiSelectOptions<V>): Promise<V[]> {
    const { message, choices } = options;
    const chosen = new Set<V>(options.initial ?? []);
    let active = 0;
    const box = (choice: Choice<V>) => (chosen.has(choice.value) ? '[x] ' : '[ ] ');

    const render = (): Frame => ({
      lines: [
        this.question(message),
        ...this.notes(options.note),
        ...this.rows(choices, active, (choice) =>
          chosen.has(choice.value) ? this.s.green(box(choice)) : this.s.dim(box(choice)),
        ),
        this.help([`${this.arrows} move`, 'space toggle', 'a all', 'enter confirm', 'esc cancel']),
      ],
    });

    const key = (text: string | undefined, k: Key): KeyResult<V[]> => {
      if (isUp(k) || text === 'k') active = (active - 1 + choices.length) % choices.length;
      else if (isDown(k) || text === 'j') active = (active + 1) % choices.length;
      else if (k.name === 'space' || text === ' ') {
        const value = choices[active]?.value;
        if (value !== undefined) {
          if (chosen.has(value)) chosen.delete(value);
          else chosen.add(value);
        }
      } else if (text === 'a') {
        const all = choices.every((c) => chosen.has(c.value));
        for (const c of choices) {
          if (all) chosen.delete(c.value);
          else chosen.add(c.value);
        }
      } else if (isEnter(k)) {
        return { submit: choices.filter((c) => chosen.has(c.value)).map((c) => c.value) };
      }
      return undefined;
    };

    return runPrompt(this.io, {
      render,
      key,
      answered: (values) =>
        this.answeredLine(
          message,
          values.length === 0
            ? 'none'
            : choices
                .filter((c) => values.includes(c.value))
                .map((c) => c.label)
                .join(', '),
        ),
      cancelled: () => this.cancelledLine(message),
    });
  }

  text(options: TextOptions): Promise<string> {
    const { message } = options;
    const fallback = options.initial ?? '';
    let value = '';
    let cursor = 0;
    let error: string | undefined;

    const render = (): Frame => {
      const head = this.question(message, '');
      const shown = value === '' ? this.s.dim(fallback) : value;
      const lines = [`${head}${shown}`, ...this.notes(options.note)];
      if (error !== undefined) {
        lines.push(`${this.indent}  ${this.s.yellow(`${this.g.warn} ${error}`)}`);
      }
      lines.push(this.help([fallback === '' ? 'enter confirm' : 'enter accept', 'esc cancel']));
      return { lines, cursor: { row: 0, col: visibleWidth(head) + cursor } };
    };

    const key = (text: string | undefined, k: Key): KeyResult<string> => {
      if (isEnter(k)) {
        const answer = value.trim() === '' ? fallback : value.trim();
        error = options.validate?.(answer);
        return error === undefined ? { submit: answer } : undefined;
      }
      error = undefined;
      if (k.name === 'backspace') {
        if (cursor > 0) {
          value = value.slice(0, cursor - 1) + value.slice(cursor);
          cursor -= 1;
        }
      } else if (k.name === 'delete') value = value.slice(0, cursor) + value.slice(cursor + 1);
      else if (k.name === 'left') cursor = Math.max(0, cursor - 1);
      else if (k.name === 'right') cursor = Math.min(value.length, cursor + 1);
      else if (k.name === 'home' || (k.ctrl === true && k.name === 'a')) cursor = 0;
      else if (k.name === 'end' || (k.ctrl === true && k.name === 'e')) cursor = value.length;
      else if (k.ctrl === true && k.name === 'u') {
        value = '';
        cursor = 0;
      } else if (isPrintable(text, k)) {
        value = value.slice(0, cursor) + text + value.slice(cursor);
        cursor += 1;
      }
      return undefined;
    };

    return runPrompt(this.io, {
      render,
      key,
      answered: (answer) => this.answeredLine(message, answer),
      cancelled: () => this.cancelledLine(message),
    });
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    const { message } = options;
    const render = (): Frame => ({
      lines: [
        this.question(message, this.s.dim(options.initial ? '(Y/n)' : '(y/N)')),
        ...this.notes(options.note),
        this.help(['y yes', 'n no', `enter ${options.initial ? 'yes' : 'no'}`, 'esc cancel']),
      ],
    });
    const key = (text: string | undefined, k: Key): KeyResult<boolean> => {
      const letter = text?.toLowerCase();
      if (letter === 'y') return { submit: true };
      if (letter === 'n') return { submit: false };
      if (isEnter(k)) return { submit: options.initial };
      return undefined;
    };
    return runPrompt(this.io, {
      render,
      key,
      answered: (yes) => this.answeredLine(message, yes ? 'yes' : 'no'),
      cancelled: () => this.cancelledLine(message),
    });
  }
}
