import { CliError, type CliContext } from '../core/context.ts';
import { box, duration, keyValues, rule } from './layout.ts';
import {
  detectTerminal,
  ESC,
  glyphs,
  pad,
  styles,
  type Glyphs,
  type Styles,
  type Terminal,
} from './style.ts';

export interface OutputOptions {
  /** Only the result line and errors. */
  quiet?: boolean;
  /** Every item and file, not the summary by folder. */
  verbose?: boolean;
}

/** Where a failure happened, for the error block. */
export interface StepPlace {
  title: string;
  n: number;
  total: number;
  /** Whether anything was written before it failed. */
  changed: boolean;
}

const TITLE_WIDTH = 20;
const TIME_WIDTH = 5;
const FRAME_MS = 100;

/** The output of one command: styles, layout helpers and numbered steps, all in one language. */
export class Ui {
  readonly term: Terminal;
  readonly s: Styles;
  readonly g: Glyphs;
  readonly quiet: boolean;
  readonly verbose: boolean;
  /** Two spaces in the fancy layout, none when plain. */
  readonly indent: string;

  constructor(
    readonly ctx: CliContext,
    options: OutputOptions = {},
  ) {
    this.term = detectTerminal({
      env: ctx.env,
      isTTY: ctx.stdoutIsTTY === true,
      ...(ctx.columns === undefined ? {} : { columns: ctx.columns }),
    });
    this.s = styles(this.term.color);
    this.g = glyphs(this.term.utf8);
    this.quiet = options.quiet === true;
    this.verbose = options.verbose === true && !this.quiet;
    this.indent = this.term.fancy ? '  ' : '';
  }

  /** One indented line on stdout; nothing in quiet mode. */
  line(text = ''): void {
    if (!this.quiet) this.ctx.log(text === '' ? '' : `${this.indent}${text}`);
  }

  lines(texts: readonly string[]): void {
    for (const text of texts) this.line(text);
  }

  /** `rectio add  0.1.1`: the bold command, dim context beside it, an optional dim line below. */
  header(command: string, context = '', second?: string): void {
    if (this.quiet) return;
    const title = `${this.s.bold(`rectio ${command}`)}${context === '' ? '' : `  ${this.s.dim(context)}`}`;
    if (this.term.fancy) this.ctx.log('');
    this.line(title);
    if (second !== undefined) this.line(this.s.dim(second));
    if (this.term.fancy) this.ctx.log('');
  }

  /** Aligned `key  value` rows with dim keys, then a blank line. */
  rows(rows: readonly (readonly [string, string])[]): void {
    if (rows.length === 0) return;
    this.lines(keyValues(rows, this.s));
    this.line();
  }

  rule(title: string): void {
    if (!this.quiet) this.ctx.log(rule(title, this.term, this.s, this.indent));
  }

  /** The closing box. In quiet mode only its first line, the result, is printed. */
  summary(lines: readonly string[]): void {
    if (this.quiet) {
      if (lines[0] !== undefined) this.ctx.log(lines[0]);
      return;
    }
    for (const text of box(lines, this.term, this.s)) this.ctx.log(text);
    if (this.term.fancy) this.ctx.log('');
  }

  /** The blank line that closes a fancy command's output. */
  end(): void {
    if (this.term.fancy && !this.quiet) this.ctx.log('');
  }

  /** A dim tip line, such as the outdated hint. */
  tip(text: string): void {
    this.line(this.s.dim(text));
  }

  /** A warning on stderr. Shown in quiet mode too. */
  warning(text: string): void {
    this.ctx.warn(`${this.indent}${this.s.yellow(this.g.warn)} ${text}`);
  }

  steps(total: number): Steps {
    return new Steps(this, total);
  }

  /** The error block on stderr: reason, the step it failed in, the hint, what was written. */
  error(message: string, hint?: string, place?: StepPlace): void {
    const { s, indent } = this;
    const out: string[] = [];
    const [first = '', ...more] = message.split('\n');
    if (this.term.fancy) {
      out.push('', `  ${s.red('Error')}  ${first}`, ...more.map((m) => `         ${m.trim()}`));
      if (place !== undefined) {
        out.push(
          `  ${s.red('Step')}   ${place.title} (${String(place.n)} of ${String(place.total)})`,
        );
      }
      if (hint !== undefined) out.push(`  ${s.dim('Hint')}   ${hint}`);
    } else {
      out.push(`error: ${first}`, ...more);
      if (place !== undefined) {
        out.push(`step: ${place.title} (${String(place.n)} of ${String(place.total)})`);
      }
      if (hint !== undefined) out.push(hint);
    }
    if (place !== undefined) {
      out.push(
        `${indent}${place.changed ? 'Some files were written before this step failed.' : 'Nothing was written.'}`,
      );
    }
    if (this.term.fancy) out.push('');
    for (const text of out) this.ctx.warn(text);
  }

  now(): number {
    return (this.ctx.now ?? (() => performance.now()))();
  }
}

/** What a running step can report: a dim note beside its line, and warnings below it. */
export interface StepHandle {
  note: string;
  warnings: string[];
}

/** Numbered steps: `✓ [2/4] Resolving items   0.3s  91 items`, with a spinner while one runs. */
export class Steps {
  private n = 0;
  /** Set once a step writes to disk, for the "nothing was written" line on failure. */
  changed = false;

  constructor(
    private readonly ui: Ui,
    private readonly total: number,
  ) {}

  async run<T>(title: string, work: (step: StepHandle) => Promise<T> | T): Promise<T> {
    this.n += 1;
    const handle: StepHandle = { note: '', warnings: [] };
    const started = this.ui.now();
    const stop = this.spin(title);
    let result: T;
    try {
      result = await work(handle);
    } catch (error) {
      stop();
      this.finish('fail', title, this.ui.now() - started, '');
      if (error instanceof CliError) {
        this.ui.error(error.message, error.hint, {
          title,
          n: this.n,
          total: this.total,
          changed: this.changed,
        });
        error.reported = true;
      }
      throw error;
    }
    stop();
    this.finish('ok', title, this.ui.now() - started, handle.note);
    for (const warning of handle.warnings) this.ui.warning(warning);
    return result;
  }

  skip(title: string, reason: string): void {
    this.n += 1;
    this.finish('skip', title, 0, reason);
  }

  private label(): string {
    return `[${String(this.n)}/${String(this.total)}]`;
  }

  private finish(kind: 'ok' | 'skip' | 'fail', title: string, ms: number, note: string): void {
    const { ui } = this;
    const { s, g } = ui;
    if (!ui.term.fancy) {
      if (ui.quiet) return;
      const word = { ok: `ok (${duration(ms)})`, skip: `skipped (${note})`, fail: 'FAILED' }[kind];
      const tail = kind === 'ok' && note !== '' ? ` ${note}` : '';
      ui.ctx.log(`${this.label()} ${title} ... ${word}${tail}`);
      return;
    }
    if (ui.quiet && kind !== 'fail') return;
    const time = pad(kind === 'skip' ? '' : duration(ms), TIME_WIDTH);
    if (kind === 'skip') {
      ui.ctx.log(
        `  ${s.dim(`${g.skip} ${this.label()} ${pad(title, TITLE_WIDTH)} ${time} ${note}`)}`,
      );
      return;
    }
    const mark = kind === 'ok' ? s.green(g.ok) : s.red(g.fail);
    const text = `  ${mark} ${s.dim(this.label())} ${pad(title, TITLE_WIDTH)} ${time}`;
    ui.ctx.log(note === '' ? text.trimEnd() : `${text} ${s.dim(note)}`);
  }

  /** Starts the spinner when the terminal is fancy; returns the function that clears it. */
  private spin(title: string): () => void {
    const { ui } = this;
    const write = ui.ctx.write;
    if (!ui.term.fancy || ui.quiet || write === undefined) return () => undefined;
    const frames = ui.g.frames;
    let frame = 0;
    const draw = () => {
      const glyph = frames[frame % frames.length] ?? '';
      frame += 1;
      write(`${ESC.clearLine}  ${ui.s.bold(ui.s.cyan(glyph))} ${ui.s.dim(this.label())} ${title}`);
    };
    // Ctrl+C while spinning: put the cursor back before the process ends.
    const interrupt = () => {
      write(`${ESC.clearLine}${ESC.showCursor}`);
      process.exit(130);
    };
    const restore = () => {
      write(ESC.showCursor);
    };
    write(ESC.hideCursor);
    draw();
    const timer = setInterval(draw, FRAME_MS);
    timer.unref();
    process.once('SIGINT', interrupt);
    process.once('exit', restore);
    return () => {
      clearInterval(timer);
      process.off('SIGINT', interrupt);
      process.off('exit', restore);
      write(`${ESC.clearLine}${ESC.showCursor}`);
    };
  }
}

/** Prints an error that happened outside any step (bad flags, a failing list or search). */
export function printError(ctx: CliContext, error: CliError): void {
  if (error.reported) return;
  new Ui(ctx).error(error.message, error.hint);
}
