import { FileCodeIcon, TerminalWindowIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useMemo, type ReactNode } from 'react';

import { CopyButton } from '../lib/copy-button';
import {
  copyableText,
  languageLabel,
  parseCodeMeta,
  parseLineRanges,
  splitDiff,
  tokensFromText,
  type CodeLine,
  type LineMark,
} from './code-block.logic';

export interface CodeBlockProps {
  /** The code as text. Needed for copying unless `tokens` are given. */
  code?: string | undefined;
  /**
   * The code as highlighted tokens, one array per line, from a highlighter such as shiki. Without
   * them the code shows in the foreground colour.
   */
  tokens?: readonly CodeLine[] | undefined;
  /** The fence's language, for the label and the accessible name: `ts`, `sh`, `diff`. */
  lang?: string | undefined;
  /** A file name or a short caption, shown in a bar above the code. */
  title?: ReactNode;
  /** Lines to highlight: `[2, 4, 5]` or `"2,4-5"`. */
  highlight?: readonly number[] | string | undefined;
  lineNumbers?: boolean | undefined;
  /** The first line number. Default 1. */
  startLine?: number | undefined;
  /**
   * Reads `+` and `-` at the start of lines as added and removed. On by default for `diff`; set it
   * for a diff of another language so the tokens keep their colours.
   */
  diff?: boolean | undefined;
  /**
   * A Markdown fence's meta string, such as `title="queue.ts" {2,5} showLineNumbers`. Explicit
   * props win over it.
   */
  meta?: string | undefined;
  /** Show the copy button. Default true. */
  copy?: boolean | undefined;
  copyLabel?: string | undefined;
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean | undefined;
  /**
   * Draw the block's own frame. Pass false inside something that already frames it, such as code
   * tabs.
   */
  framed?: boolean | undefined;
  className?: string | undefined;
}

const SHELL = new Set(['sh', 'bash', 'shell', 'zsh', 'console', 'powershell']);

/**
 * Code with a file name, language, highlighted lines, line numbers, diff marks and a copy button.
 * Highlighting is the highlighter's job: pass tokens whose colours are the theme's code variables
 * and the block follows light, dark and every theme. The code scrolls sideways inside the block,
 * never the page, and the scroll area is reachable with the keyboard.
 */
export function CodeBlock({
  code,
  tokens,
  lang,
  title,
  highlight,
  lineNumbers,
  startLine,
  diff,
  meta,
  copy = true,
  copyLabel = 'Copy code',
  wrap = false,
  framed = true,
  className,
}: CodeBlockProps) {
  const parsed = parseCodeMeta(meta);
  const heading = title ?? parsed.title;
  const isDiff = diff ?? (parsed.diff || lang === 'diff');
  const showNumbers = lineNumbers ?? parsed.lineNumbers;
  const first = startLine ?? parsed.startLine;
  const highlighted = new Set(
    highlight === undefined
      ? parsed.highlight
      : typeof highlight === 'string'
        ? parseLineRanges(highlight)
        : highlight,
  );
  const { lines, marks } = useMemo(() => {
    const source = tokens ?? tokensFromText(code ?? '');
    return isDiff
      ? splitDiff(source)
      : { lines: [...source], marks: source.map((): LineMark => null) };
  }, [tokens, code, isDiff]);
  const label = languageLabel(lang);
  const Icon = lang !== undefined && SHELL.has(lang) ? TerminalWindowIcon : FileCodeIcon;
  const copyButton = copy ? (
    <CopyButton value={() => copyableText(lines, marks)} label={copyLabel} />
  ) : null;

  return (
    <figure
      data-slot="code-block"
      className={cn(
        'group/code relative m-0 min-w-0 bg-code-background text-code-foreground',
        framed && 'overflow-hidden rounded-panel border border-line',
        className,
      )}
    >
      {heading !== undefined && (
        <figcaption className="flex h-10 items-center gap-2 border-b border-line ps-4 pe-1.5 text-sm text-fg-muted">
          <Icon aria-hidden weight="bold" className="size-4 shrink-0 text-fg-subtle" />
          <span className="min-w-0 flex-1 truncate font-mono text-fg">{heading}</span>
          {label !== null && <span className="text-xs text-fg-muted max-sm:hidden">{label}</span>}
          {copyButton}
        </figcaption>
      )}
      <pre
        // A scroll area must be reachable with the keyboard to scroll it without a pointer.
        tabIndex={0}
        aria-label={typeof heading === 'string' ? heading : `${label ?? 'Code'} example`}
        className={cn(
          'm-0 overflow-x-auto py-3.5 font-mono text-sm',
          'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
          heading === undefined && copy && 'pe-10',
        )}
      >
        <code
          className={cn(
            'grid',
            // Phones wrap long lines: a sideways scroll in a narrow column hides most of the line.
            wrap
              ? 'whitespace-pre-wrap'
              : 'w-max min-w-full max-sm:w-auto max-sm:whitespace-pre-wrap',
          )}
        >
          {lines.map((line, index) => {
            const number = index + first;
            const mark = marks[index] ?? null;
            return (
              <span
                // Lines are positional: the same code always yields the same list.
                key={index}
                data-line=""
                data-highlighted={highlighted.has(index + 1) || undefined}
                data-mark={mark ?? undefined}
                className={cn(
                  'flex px-4',
                  'data-highlighted:bg-code-highlight',
                  'data-[mark=inserted]:bg-code-inserted data-[mark=deleted]:bg-code-deleted',
                )}
              >
                {showNumbers && (
                  <span
                    aria-hidden
                    className="me-4 inline-block w-6 shrink-0 text-end text-code-line-number select-none"
                  >
                    {number}
                  </span>
                )}
                {isDiff && (
                  <span
                    aria-hidden
                    className={cn(
                      'me-2 inline-block w-3 shrink-0 select-none',
                      mark === 'inserted' && 'text-code-inserted-mark',
                      mark === 'deleted' && 'text-code-deleted-mark',
                    )}
                  >
                    {mark === 'inserted' ? '+' : mark === 'deleted' ? '-' : ' '}
                  </span>
                )}
                {mark !== null && (
                  <span className="sr-only">{mark === 'inserted' ? 'Added: ' : 'Removed: '}</span>
                )}
                <span className="min-w-0">
                  {line.length === 0
                    ? ' '
                    : line.map((token, tokenIndex) => (
                        <span
                          // Tokens are positional within their line.
                          key={tokenIndex}
                          style={
                            token.color === undefined && token.fontStyle === undefined
                              ? undefined
                              : {
                                  color: token.color,
                                  fontStyle: token.fontStyle === 'italic' ? 'italic' : undefined,
                                  fontWeight:
                                    token.fontStyle === 'bold'
                                      ? 'var(--rx-font-weight-strong)'
                                      : undefined,
                                }
                          }
                        >
                          {token.content}
                        </span>
                      ))}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
      {heading === undefined && copyButton !== null && (
        <div className="absolute end-1.5 top-1.5">{copyButton}</div>
      )}
    </figure>
  );
}
