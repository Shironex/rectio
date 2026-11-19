/**
 * Code block data: tokens, line ranges, diff marks and the meta string of a Markdown code fence.
 * The block never highlights code itself. A highlighter (shiki at build time, for example) turns
 * code into tokens whose colour is a CSS variable such as `var(--rx-code-token-keyword)`, so the
 * theme, not the highlighter, decides the colours in light and dark.
 */

/** One run of text in one colour. */
export interface CodeToken {
  content: string;
  /** A CSS colour, normally `var(--rx-code-token-*)`. Omit for the code's foreground colour. */
  color?: string | undefined;
  fontStyle?: 'italic' | 'bold' | undefined;
}

/** One line of code as tokens, without its line break. */
export type CodeLine = readonly CodeToken[];

export type LineMark = 'inserted' | 'deleted' | null;

export interface ParsedCodeMeta {
  title?: string | undefined;
  /** 1-based line numbers to highlight. */
  highlight: number[];
  lineNumbers: boolean;
  diff: boolean;
  /** Where the line numbers start, from `showLineNumbers=12`. */
  startLine: number;
}

/** `{1,3-5}` or `1,3-5` to [1, 3, 4, 5]. Out of order and repeated numbers are tidied up. */
export function parseLineRanges(value: string | undefined): number[] {
  if (value === undefined) return [];
  const lines = new Set<number>();
  for (const part of value.replace(/[{}\s]/g, '').split(',')) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (match === null) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    for (let line = Math.min(from, to); line <= Math.max(from, to); line += 1) lines.add(line);
  }
  return [...lines].sort((a, b) => a - b);
}

/**
 * The meta string after a fence's language, as most Markdown tools write it:
 * `title="queue.ts" {2,5-7} showLineNumbers diff`.
 */
export function parseCodeMeta(meta: string | undefined): ParsedCodeMeta {
  const source = meta ?? '';
  const title = /title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(source);
  const ranges = /\{([\d,\s-]+)\}/.exec(source);
  const numbers = /\bshowLineNumbers(?:=(\d+))?/.exec(source);
  return {
    title: title === null ? undefined : (title[1] ?? title[2] ?? title[3]),
    highlight: parseLineRanges(ranges?.[1]),
    lineNumbers: numbers !== null,
    diff: /(^|\s)diff(\s|$)/.test(source),
    startLine: numbers?.[1] === undefined ? 1 : Number(numbers[1]),
  };
}

/** Plain text as lines of one uncoloured token each, for code without a highlighter. */
export function tokensFromText(code: string): CodeLine[] {
  return trimFinalNewline(code)
    .split('\n')
    .map((line) => [{ content: line }]);
}

export function trimFinalNewline(code: string): string {
  return code.replace(/\n$/, '');
}

/** The text of a line of tokens. */
export function lineText(line: CodeLine): string {
  return line.map((token) => token.content).join('');
}

/**
 * Reads the diff mark at the start of each line (`+` added, `-` removed) and strips it from the
 * first token, keeping the rest of the line's colours.
 */
export function splitDiff(lines: readonly CodeLine[]): { lines: CodeLine[]; marks: LineMark[] } {
  const marks: LineMark[] = [];
  const out = lines.map((line) => {
    const text = lineText(line);
    const mark: LineMark = text.startsWith('+')
      ? 'inserted'
      : text.startsWith('-')
        ? 'deleted'
        : null;
    marks.push(mark);
    if (mark === null) {
      // Unchanged lines in a diff carry a leading space for alignment; drop it too.
      return text.startsWith(' ') ? stripFirst(line) : [...line];
    }
    return stripFirst(line);
  });
  return { lines: out, marks };
}

function stripFirst(line: CodeLine): CodeLine {
  const [first, ...rest] = line;
  if (first === undefined) return [];
  const content = first.content.slice(1);
  return content === '' ? rest : [{ ...first, content }, ...rest];
}

/**
 * What the copy button copies: the code as it reads after the change, without diff marks or
 * removed lines.
 */
export function copyableText(lines: readonly CodeLine[], marks: readonly LineMark[]): string {
  return lines
    .filter((_, index) => marks[index] !== 'deleted')
    .map(lineText)
    .join('\n');
}

/** A label for the language badge: `ts` reads TypeScript, `sh` reads Terminal. */
export function languageLabel(lang: string | undefined): string | null {
  if (lang === undefined || lang === '' || lang === 'text' || lang === 'plaintext') return null;
  const known: Record<string, string> = {
    ts: 'TypeScript',
    typescript: 'TypeScript',
    tsx: 'TSX',
    js: 'JavaScript',
    javascript: 'JavaScript',
    jsx: 'JSX',
    json: 'JSON',
    jsonc: 'JSON',
    sh: 'Terminal',
    bash: 'Terminal',
    shell: 'Terminal',
    zsh: 'Terminal',
    css: 'CSS',
    html: 'HTML',
    md: 'Markdown',
    mdx: 'MDX',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    dotenv: 'Env',
    env: 'Env',
    dockerfile: 'Dockerfile',
    diff: 'Diff',
    http: 'HTTP',
    sql: 'SQL',
    py: 'Python',
    python: 'Python',
    go: 'Go',
    rust: 'Rust',
  };
  return known[lang.toLowerCase()] ?? lang.toUpperCase();
}
