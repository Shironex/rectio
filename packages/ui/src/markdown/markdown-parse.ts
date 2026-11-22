/**
 * The pure half of Markdown: a small parser for the Markdown that chat models and docs write
 * (CommonMark blocks and inlines plus GFM tables, strikethrough and bare links) into a tree of
 * plain objects. There is no HTML anywhere on this path: raw tags stay text, so nothing a model
 * or a user writes can inject markup. Links keep only safe protocols. With `streaming`, text that
 * is still arriving reads well: an open fence is a code block, and an open `**` or backtick at the
 * end is closed in place instead of flashing its markers.
 */

export type MarkdownAlign = 'left' | 'center' | 'right' | null;

export type MarkdownInline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: MarkdownInline[] }
  | { type: 'em'; children: MarkdownInline[] }
  | { type: 'del'; children: MarkdownInline[] }
  | { type: 'code'; value: string }
  | { type: 'break' }
  | {
      type: 'link';
      /** Null when the address was unsafe or incomplete: the text shows without a link. */
      href: string | null;
      title?: string | undefined;
      children: MarkdownInline[];
    }
  | { type: 'image'; src: string | null; alt: string; title?: string | undefined };

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MarkdownInline[] }
  | { type: 'paragraph'; children: MarkdownInline[] }
  | {
      type: 'code';
      lang?: string | undefined;
      meta?: string | undefined;
      value: string;
      /** False while a streamed fence has not been closed yet. */
      closed: boolean;
    }
  | { type: 'list'; ordered: boolean; start: number; tight: boolean; items: MarkdownBlock[][] }
  | { type: 'blockquote'; children: MarkdownBlock[] }
  | {
      type: 'table';
      align: MarkdownAlign[];
      head: MarkdownInline[][];
      rows: MarkdownInline[][][];
    }
  | { type: 'hr' };

export interface MarkdownParseOptions {
  /** Text still arriving: close open inline markers at the end instead of showing them. */
  streaming?: boolean | undefined;
  /** Protocols a link or image may use. Relative addresses and `#anchors` are always allowed. */
  allowedProtocols?: readonly string[] | undefined;
}

export const DEFAULT_PROTOCOLS: readonly string[] = ['http', 'https', 'mailto', 'tel'];

/**
 * Every character a browser drops or ignores in an address: C0 and C1 controls, every Unicode
 * space (no-break, ideographic, line and paragraph separators) and invisible format characters
 * such as the byte order mark and zero-width joiners.
 */
// eslint-disable-next-line no-control-regex -- control characters are exactly what is removed
const URL_INVISIBLE = /[\u0000-\u0020\u007F-\u00A0\p{White_Space}\p{Cf}]/gu;

/**
 * The address if it is safe to put in an `href`, else null. Entities are decoded and every
 * invisible character removed first, and the scheme is read from exactly the string returned, so
 * `java\tscript:`, `&#106;avascript:` and a no-break space before `javascript:` cannot slip
 * through. An address with a scheme outside `allowedProtocols` is refused.
 */
export function safeUrl(
  url: string,
  allowedProtocols: readonly string[] = DEFAULT_PROTOCOLS,
): string | null {
  const cleaned = decodeEntities(url).replace(URL_INVISIBLE, '');
  if (cleaned === '') return null;
  // A scheme is whatever comes before the first colon that precedes any path, query or fragment.
  const scheme = /^([^/?#\\]*?):/.exec(cleaned);
  if (scheme === null) return cleaned;
  const protocol = (scheme[1] ?? '').toLowerCase();
  if (!/^[a-z][a-z\d+.-]*$/.test(protocol)) return null;
  return allowedProtocols.includes(protocol) ? cleaned : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  // The ones that spell out a URL's punctuation, so an address written with them reads as it would.
  colon: ':',
  sol: '/',
  tab: '\t',
  newline: '\n',
  num: '#',
  quest: '?',
};

/** Turns the few entities models write (`&amp;`, `&#39;`, `&#x2014;`) into their characters. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]{1,6}|#\d{1,7}|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith('#')) {
      const code =
        body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

// ----------------------------------------------------------------------------------------------
// Inlines

const PUNCTUATION = /[!-/:-@[-`{-~]/;
const WHITESPACE = /\s/;
const BARE_URL = /^(?:https?:\/\/|www\.)[^\s<]*[^\s<?!.,:;*_~'")\]]/i;

interface InlineContext {
  protocols: readonly string[];
  /** Close open markers at the end of the text. */
  autoClose: boolean;
  /** How deep in emphasis and links this text sits. */
  depth?: number | undefined;
}

/** Emphasis and links nest this deep at most; deeper markers stay as text. */
const MAX_INLINE_DEPTH = 24;
/** Quotes and lists nest this deep at most; deeper lines stay as a paragraph of text. */
const MAX_BLOCK_DEPTH = 16;

/**
 * Every `[` that is closed, mapped to its `]`, skipping escapes and nested brackets, found in one
 * pass so a long run of open brackets stays linear.
 */
function bracketPairs(text: string): Map<number, number> {
  const pairs = new Map<number, number>();
  const open: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '\\') {
      i += 1;
    } else if (char === '[') {
      open.push(i);
    } else if (char === ']') {
      const start = open.pop();
      if (start !== undefined) pairs.set(start, i);
    }
  }
  return pairs;
}

/** Reads `(url "title")` after a link's text. Returns null when it is not a destination. */
function readDestination(
  text: string,
  open: number,
): { url: string; title?: string; end: number } | { partial: true } | null {
  if (text[open] !== '(') return null;
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const char = text[i];
    if (char === '\\') {
      i += 1;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        const inner = text.slice(open + 1, i).trim();
        const titled = /^(\S*)\s+(?:"([^"]*)"|'([^']*)')$/.exec(inner);
        const url = (titled?.[1] ?? inner).replace(/^<(.*)>$/, '$1');
        const title = titled?.[2] ?? titled?.[3];
        return title === undefined ? { url, end: i + 1 } : { url, title, end: i + 1 };
      }
    }
  }
  return { partial: true };
}

/** Whether a run of delimiters may open (or close) emphasis, by the characters around it. */
function flanking(text: string, start: number, end: number) {
  const before = start === 0 ? ' ' : (text[start - 1] ?? ' ');
  const after = end >= text.length ? ' ' : (text[end] ?? ' ');
  const left =
    !WHITESPACE.test(after) &&
    (!PUNCTUATION.test(after) || WHITESPACE.test(before) || PUNCTUATION.test(before));
  const right =
    !WHITESPACE.test(before) &&
    (!PUNCTUATION.test(before) || WHITESPACE.test(after) || PUNCTUATION.test(after));
  return { left, right, before, after };
}

/** Finds the closing run for an opener of `marker`, skipping code spans and escapes. */
function findCloser(
  text: string,
  from: number,
  marker: string,
  failed: Map<string, number>,
): number {
  // A scan that found no closer from an earlier point finds none from a later one either: this
  // keeps a long run of unclosed openers linear instead of quadratic.
  const known = failed.get(marker);
  if (known !== undefined && from >= known) return -1;
  const found = scanCloser(text, from, marker, failed);
  if (found === -1) failed.set(marker, Math.min(known ?? from, from));
  return found;
}

function scanCloser(
  text: string,
  from: number,
  marker: string,
  failed: Map<string, number>,
): number {
  const char = marker[0] ?? '';
  for (let i = from; i < text.length; i += 1) {
    const c = text[i];
    if (c === '\\') {
      i += 1;
      continue;
    }
    if (c === '`') {
      const run = /^`+/.exec(text.slice(i))?.[0] ?? '`';
      const close = text.indexOf(run, i + run.length);
      if (close !== -1) i = close + run.length - 1;
      continue;
    }
    if (!text.startsWith(marker, i)) continue;
    let end = i;
    while (text[end] === char) end += 1;
    const length = end - i;
    // A double run inside `*...*` is its own strong span, not two closers.
    if (marker.length === 1 && length === 2) {
      const inner = findCloser(text, end, char + char, failed);
      if (inner !== -1) {
        i = inner + 1;
        continue;
      }
    }
    // The closer takes the end of a longer run, so `***both***` closes strong outside em.
    const at = end - marker.length;
    const { right, after } = flanking(text, at, end);
    if (!right || at <= from || (char === '_' && /[\p{L}\p{N}]/u.test(after))) {
      i = end - 1;
      continue;
    }
    return at;
  }
  return -1;
}

export function parseInline(text: string, context: InlineContext): MarkdownInline[] {
  const out: MarkdownInline[] = [];
  const depth = context.depth ?? 0;
  const nested = { ...context, depth: depth + 1 };
  // Past the depth cap, links and emphasis are read as plain text.
  const deep = depth >= MAX_INLINE_DEPTH;
  const failed = new Map<string, number>();
  let pairs: Map<number, number> | null = null;
  const closingBracket = (open: number) => {
    pairs ??= bracketPairs(text);
    return pairs.get(open) ?? -1;
  };
  let buffer = '';
  const flush = () => {
    if (buffer !== '') out.push({ type: 'text', value: decodeEntities(buffer) });
    buffer = '';
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i] ?? '';
    const rest = text.slice(i);

    // Escapes: a backslash before punctuation keeps the punctuation; before a newline it breaks.
    if (char === '\\') {
      const next = text[i + 1];
      if (next === '\n') {
        flush();
        out.push({ type: 'break' });
        i += 2;
        continue;
      }
      if (next !== undefined && PUNCTUATION.test(next)) {
        buffer += next;
        i += 2;
        continue;
      }
    }

    // Hard break: two or more spaces before a newline.
    if (char === '\n') {
      // Count the trailing spaces from the end: a regex over a long run of spaces backtracks.
      let kept = buffer.length;
      while (kept > 0 && buffer.charCodeAt(kept - 1) === 32) kept -= 1;
      const hard = buffer.length - kept >= 2;
      buffer = buffer.slice(0, kept);
      flush();
      out.push(hard ? { type: 'break' } : { type: 'text', value: '\n' });
      i += 1;
      continue;
    }

    if (char === '`') {
      const run = /^`+/.exec(rest)?.[0] ?? '`';
      const close = text.indexOf(run, i + run.length);
      if (close !== -1 || context.autoClose) {
        const end = close === -1 ? text.length : close;
        let value = text.slice(i + run.length, end).replace(/\n/g, ' ');
        if (/^ .*[^ ].* $/.test(value)) value = value.slice(1, -1);
        flush();
        out.push({ type: 'code', value });
        i = close === -1 ? text.length : close + run.length;
        continue;
      }
      buffer += run;
      i += run.length;
      continue;
    }

    if (char === '!' && text[i + 1] === '[') {
      const close = closingBracket(i + 1);
      const destination = close === -1 ? null : readDestination(text, close + 1);
      if (destination !== null && !('partial' in destination)) {
        flush();
        out.push({
          type: 'image',
          src: safeUrl(destination.url, context.protocols),
          alt: decodeEntities(text.slice(i + 2, close)),
          title: destination.title,
        });
        i = destination.end;
        continue;
      }
      if (destination !== null && context.autoClose) {
        // An image still arriving shows nothing until its address is complete.
        flush();
        i = text.length;
        continue;
      }
    }

    if (char === '[' && !deep) {
      const close = closingBracket(i);
      const destination = close === -1 ? null : readDestination(text, close + 1);
      if (destination !== null) {
        const label = text.slice(i + 1, close);
        flush();
        if ('partial' in destination) {
          if (context.autoClose) {
            // The address is still arriving: show the words, link them once it is complete.
            out.push({ type: 'link', href: null, children: parseInline(label, nested) });
            i = text.length;
            continue;
          }
        } else {
          out.push({
            type: 'link',
            href: safeUrl(destination.url, context.protocols),
            title: destination.title,
            children: parseInline(label, { ...nested, autoClose: false }),
          });
          i = destination.end;
          continue;
        }
      }
    }

    // Autolinks: <https://example.com>, and bare addresses where a word starts.
    if (char === '<') {
      const auto = /^<((?:https?|mailto):[^\s<>]+)>/i.exec(rest);
      if (auto?.[1] !== undefined) {
        flush();
        out.push({
          type: 'link',
          href: safeUrl(auto[1], context.protocols),
          children: [{ type: 'text', value: auto[1] }],
        });
        i += auto[0].length;
        continue;
      }
    }
    if (
      (char === 'h' || char === 'w' || char === 'H' || char === 'W') &&
      !/[\p{L}\p{N}]/u.test(text[i - 1] ?? ' ')
    ) {
      const bare = BARE_URL.exec(rest);
      if (bare !== null) {
        let url = bare[0];
        // A closing parenthesis the address never opened belongs to the sentence.
        while (
          url.endsWith(')') &&
          (url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)
        ) {
          url = url.slice(0, -1);
        }
        flush();
        const href = /^www\./i.test(url) ? `https://${url}` : url;
        out.push({
          type: 'link',
          href: safeUrl(href, context.protocols),
          children: [{ type: 'text', value: url }],
        });
        i += url.length;
        continue;
      }
    }

    if (char === '*' || char === '_' || char === '~') {
      const run = new RegExp(`^\\${char}+`).exec(rest)?.[0] ?? char;
      const { left, before } = flanking(text, i, i + run.length);
      const intraword = char === '_' && /[\p{L}\p{N}]/u.test(before);
      const marker =
        char === '~' ? (run.length === 2 ? '~~' : null) : run.length >= 2 ? char + char : char;
      if (marker !== null && left && !intraword && !deep) {
        const close = findCloser(text, i + marker.length, marker, failed);
        if (close !== -1 || (context.autoClose && i + marker.length < text.length)) {
          const end = close === -1 ? text.length : close;
          const children = parseInline(text.slice(i + marker.length, end), {
            ...nested,
            autoClose: close === -1,
          });
          flush();
          out.push({
            type: marker === '~~' ? 'del' : marker.length === 2 ? 'strong' : 'em',
            children,
          });
          i = close === -1 ? text.length : close + marker.length;
          continue;
        }
        if (context.autoClose && i + run.length >= text.length) {
          // A marker that is the very last thing streamed: hide it until its words arrive.
          i += run.length;
          continue;
        }
      }
      buffer += marker ?? run;
      i += (marker ?? run).length;
      continue;
    }

    buffer += char;
    i += 1;
  }
  flush();
  return out;
}

// ----------------------------------------------------------------------------------------------
// Blocks

const FENCE = /^( {0,3})(`{3,}|~{3,})\s*([^`\s]*)\s*(.*)$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const LIST_ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])([ \t]+|$)/;
const TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

const isBlank = (line: string) => line.trim() === '';

function splitRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  const cells: string[] = [];
  let cell = '';
  for (let i = 0; i < row.length; i += 1) {
    const char = row[i] ?? '';
    if (char === '\\' && row[i + 1] === '|') {
      cell += '|';
      i += 1;
    } else if (char === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isTableStart(lines: readonly string[], index: number): boolean {
  const head = lines[index] ?? '';
  const delimiter = lines[index + 1] ?? '';
  if (!head.includes('|') || !TABLE_DELIMITER.test(delimiter) || !delimiter.includes('-'))
    return false;
  return splitRow(head).length === splitRow(delimiter).length;
}

/** Whether a line starts a block that ends a paragraph without a blank line. */
function interruptsParagraph(lines: readonly string[], index: number): boolean {
  const line = lines[index] ?? '';
  if (FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) return true;
  const item = LIST_ITEM.exec(line);
  // An ordered list interrupts only from 1, so "2019. was a good year" stays a sentence.
  if (item !== null && !isBlank(line.slice(item[0].length))) {
    return /^[-*+]$/.test(item[2] ?? '') || /^1[.)]$/.test(item[2] ?? '');
  }
  return isTableStart(lines, index);
}

interface BlockContext {
  inline: InlineContext;
  /** How deep in quotes and lists these lines sit. */
  depth: number;
}

function inlineOf(text: string, context: BlockContext, last: boolean): MarkdownInline[] {
  return parseInline(text.trim(), {
    ...context.inline,
    autoClose: context.inline.autoClose && last,
  });
}

function parseBlocks(lines: readonly string[], context: BlockContext): MarkdownBlock[] {
  if (context.depth > MAX_BLOCK_DEPTH) {
    // Nested past any real reply: the rest reads as one paragraph, so the parse stays shallow.
    const text = lines.join('\n').trim();
    return text === '' ? [] : [{ type: 'paragraph', children: inlineOf(text, context, true) }];
  }
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  const lastContentLine = (() => {
    let last = lines.length - 1;
    while (last >= 0 && isBlank(lines[last] ?? '')) last -= 1;
    return last;
  })();

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (isBlank(line)) {
      i += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence !== null && !(fence[2]?.startsWith('`') === true && (fence[4] ?? '').includes('`'))) {
      const indent = fence[1]?.length ?? 0;
      const marker = fence[2] ?? '```';
      const body: string[] = [];
      let closed = false;
      i += 1;
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const closing = new RegExp(
          `^ {0,3}${marker.startsWith('`') ? '`' : '~'}{${String(marker.length)},}\\s*$`,
        );
        if (closing.test(current)) {
          closed = true;
          i += 1;
          break;
        }
        body.push(current.replace(new RegExp(`^ {0,${String(indent)}}`), ''));
        i += 1;
      }
      const lang = fence[3] === '' ? undefined : fence[3];
      const meta = (fence[4] ?? '').trim() === '' ? undefined : (fence[4] ?? '').trim();
      blocks.push({ type: 'code', lang, meta, value: body.join('\n'), closed });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading !== null) {
      const level = (heading[1]?.length ?? 1) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        type: 'heading',
        level,
        children: inlineOf(heading[2] ?? '', context, i === lastContentLine),
      });
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? '';
        if (QUOTE.test(current)) {
          inner.push(current.replace(QUOTE, ''));
        } else if (
          !isBlank(current) &&
          inner.length > 0 &&
          !isBlank(inner.at(-1) ?? '') &&
          !interruptsParagraph(lines, i)
        ) {
          // A lazy continuation line: part of the quoted paragraph without its own marker.
          inner.push(current);
        } else {
          break;
        }
        i += 1;
      }
      blocks.push({
        type: 'blockquote',
        children: parseBlocks(inner, { ...context, depth: context.depth + 1 }),
      });
      continue;
    }

    const first = LIST_ITEM.exec(line);
    if (first !== null) {
      const ordered = /\d/.test(first[2] ?? '');
      const delimiter = ordered ? (first[2] ?? '').slice(-1) : (first[2] ?? '-');
      const start = ordered ? Number.parseInt(first[2] ?? '1', 10) : 1;
      const items: string[][] = [];
      let tight = true;
      let sawBlank = false;
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const item = LIST_ITEM.exec(current);
        const sameKind =
          item !== null &&
          (ordered
            ? (item[2] ?? '').endsWith(delimiter) && /\d/.test(item[2] ?? '')
            : item[2] === delimiter);
        if (item !== null && sameKind) {
          if (sawBlank && items.length > 0) tight = false;
          sawBlank = false;
          const contentIndent =
            item[0].length === current.length
              ? (item[1]?.length ?? 0) + (item[2]?.length ?? 0) + 1
              : item[0].length;
          const body = [current.slice(item[0].length)];
          i += 1;
          while (i < lines.length) {
            const next = lines[i] ?? '';
            if (isBlank(next)) {
              // A blank line continues the item only when indented content follows it.
              let ahead = i + 1;
              while (ahead < lines.length && isBlank(lines[ahead] ?? '')) ahead += 1;
              const following = lines[ahead] ?? '';
              if (
                ahead < lines.length &&
                following.length - following.trimStart().length >= contentIndent
              ) {
                body.push('');
                i += 1;
                sawBlank = true;
                continue;
              }
              break;
            }
            const indent = next.length - next.trimStart().length;
            if (indent >= contentIndent) {
              body.push(next.slice(contentIndent));
              if (sawBlank) tight = false;
              i += 1;
              continue;
            }
            if (
              LIST_ITEM.test(next) ||
              interruptsParagraph(lines, i) ||
              sawBlank ||
              isBlank(body.at(-1) ?? '')
            )
              break;
            // A lazy continuation of the item's paragraph.
            body.push(next.trim());
            i += 1;
          }
          items.push(body);
          continue;
        }
        if (isBlank(current)) {
          sawBlank = true;
          i += 1;
          continue;
        }
        break;
      }
      if (sawBlank) {
        // Step back over trailing blank lines so they do not count as part of the list.
        while (i > 0 && isBlank(lines[i - 1] ?? '')) i -= 1;
      }
      const lastItem = items.length - 1;
      blocks.push({
        type: 'list',
        ordered,
        start,
        tight,
        items: items.map((body, index) =>
          parseBlocks(body, {
            depth: context.depth + 1,
            inline: {
              ...context.inline,
              autoClose: context.inline.autoClose && index === lastItem && i > lastContentLine,
            },
          }),
        ),
      });
      continue;
    }

    if (isTableStart(lines, i)) {
      const align = splitRow(lines[i + 1] ?? '').map((cell): MarkdownAlign => {
        const leftColon = cell.startsWith(':');
        const rightColon = cell.endsWith(':');
        return leftColon && rightColon
          ? 'center'
          : rightColon
            ? 'right'
            : leftColon
              ? 'left'
              : null;
      });
      const width = align.length;
      const cellsOf = (row: string) => {
        const cells = splitRow(row).slice(0, width);
        while (cells.length < width) cells.push('');
        return cells.map((cell) => parseInline(cell, { ...context.inline, autoClose: false }));
      };
      const head = cellsOf(lines[i] ?? '');
      i += 2;
      const rows: MarkdownInline[][][] = [];
      while (i < lines.length && !isBlank(lines[i] ?? '') && (lines[i] ?? '').includes('|')) {
        rows.push(cellsOf(lines[i] ?? ''));
        i += 1;
      }
      blocks.push({ type: 'table', align, head, rows });
      continue;
    }

    // A paragraph, or a setext heading when a row of = or - follows it.
    const text: string[] = [line];
    i += 1;
    let setext: 1 | 2 | null = null;
    while (i < lines.length) {
      const next = lines[i] ?? '';
      if (isBlank(next)) break;
      if (/^ {0,3}=+\s*$/.test(next)) {
        setext = 1;
        i += 1;
        break;
      }
      if (/^ {0,3}-+\s*$/.test(next)) {
        setext = 2;
        i += 1;
        break;
      }
      if (interruptsParagraph(lines, i)) break;
      text.push(next);
      i += 1;
    }
    const children = inlineOf(text.join('\n'), context, i > lastContentLine);
    blocks.push(
      setext === null
        ? { type: 'paragraph', children }
        : { type: 'heading', level: setext, children },
    );
  }
  return blocks;
}

/**
 * Where a streaming text splits into blocks that are finished and the part still arriving: the
 * start of the last line that begins a new top-level block after a blank line, outside any code
 * fence, and that cannot belong to a list, quote or indented block before it. Everything before it
 * parses the same whether or not more text follows, so a renderer can parse it once and re-parse
 * only the rest as words arrive. 0 when there is no such line.
 */
export function stableBoundary(source: string): number {
  let boundary = 0;
  let fence: string | null = null;
  let previousBlank = false;
  let offset = 0;
  for (const line of source.split('\n')) {
    const start = offset;
    offset += line.length + 1;
    const opener = FENCE.exec(line);
    if (fence !== null) {
      if (opener !== null && opener[2]?.startsWith(fence) === true && opener[3] === '')
        fence = null;
      previousBlank = false;
      continue;
    }
    const blank = line.trim() === '';
    if (
      !blank &&
      previousBlank &&
      start > 0 &&
      !/^\s/.test(line) &&
      !LIST_ITEM.test(line) &&
      !QUOTE.test(line)
    ) {
      boundary = start;
    }
    if (opener !== null) fence = opener[2] ?? null;
    previousBlank = blank;
  }
  return boundary;
}

/** Parses Markdown into blocks. Tabs count as four spaces; Windows line ends are normalised. */
export function parseMarkdown(source: string, options: MarkdownParseOptions = {}): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  return parseBlocks(lines, {
    depth: 0,
    inline: {
      protocols: options.allowedProtocols ?? DEFAULT_PROTOCOLS,
      autoClose: options.streaming === true,
    },
  });
}

function inlineText(nodes: readonly MarkdownInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
        case 'code':
          return node.value;
        case 'break':
          return '\n';
        case 'image':
          return node.alt;
        default:
          return inlineText(node.children);
      }
    })
    .join('');
}

function blockText(block: MarkdownBlock): string {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return inlineText(block.children);
    case 'code':
      return block.value;
    case 'list':
      return block.items.map((item) => item.map(blockText).join('\n')).join('\n');
    case 'blockquote':
      return block.children.map(blockText).join('\n');
    case 'table':
      return [block.head, ...block.rows].map((row) => row.map(inlineText).join(', ')).join('\n');
    case 'hr':
      return '';
  }
}

/**
 * The words of a Markdown text without its markers, for a screen reader announcement, a copy as
 * plain text or a preview line.
 */
export function markdownToText(source: string): string {
  return parseMarkdown(source)
    .map(blockText)
    .filter((text) => text !== '')
    .join('\n\n');
}
