import type { Runner } from './runner.ts';

/** Everything a command touches outside its arguments, so tests can run it in-process. */
export interface CliContext {
  /** The project root the command works in. */
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  /** One line of output on stdout: progress and results. */
  log: (line: string) => void;
  /** One line on stderr: errors, warnings and the update notice. */
  warn: (line: string) => void;
  /** Raw text on stdout, for the spinner. Unset means no spinner. */
  write?: (text: string) => void;
  /** Whether stdout is a terminal. Unset (in tests and embedders) counts as not a terminal. */
  stdoutIsTTY?: boolean;
  /** Width of the terminal; 80 when unset. */
  columns?: number;
  /** Clock for step durations, in milliseconds. Defaults to performance.now. */
  now?: () => number;
  /** How the CLI was started, for the commands it prints. Detected from the script path when unset. */
  runner?: Runner;
}

/** An expected failure: printed as one message (plus a hint) without a stack trace. */
export class CliError extends Error {
  readonly hint: string | undefined;
  /** Already printed, with the step it failed in: main only sets the exit code. */
  reported = false;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'CliError';
    this.hint = hint;
  }
}

export function processContext(cwd: string): CliContext {
  return {
    cwd,
    env: process.env,
    stdoutIsTTY: process.stdout.isTTY,
    columns: process.stdout.columns,
    log: (line) => {
      process.stdout.write(`${line}\n`);
    },
    warn: (line) => {
      process.stderr.write(`${line}\n`);
    },
    write: (text) => {
      process.stdout.write(text);
    },
  };
}
