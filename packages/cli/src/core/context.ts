/** Everything a command touches outside its arguments, so tests can run it in-process. */
export interface CliContext {
  /** The project root the command works in. */
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  log: (line: string) => void;
  warn: (line: string) => void;
  /** Whether stdout is a terminal. Unset (in tests and embedders) counts as not a terminal. */
  stdoutIsTTY?: boolean;
}

/** An expected failure: printed as one message (plus a hint) without a stack trace. */
export class CliError extends Error {
  readonly hint: string | undefined;

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
    log: (line) => {
      process.stdout.write(`${line}\n`);
    },
    warn: (line) => {
      process.stderr.write(`${line}\n`);
    },
  };
}
