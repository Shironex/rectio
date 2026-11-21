import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { Fragment, useMemo, type ComponentProps, type ReactNode } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../data-table/table';
import { cn } from '../lib/cn';
import {
  parseMarkdown,
  type MarkdownAlign,
  type MarkdownBlock,
  type MarkdownInline,
} from './markdown-parse';

export interface MarkdownCodeProps {
  /** The code as text, without the fence. */
  code: string;
  /** The fence's language, such as `ts` or `sh`. */
  lang?: string | undefined;
  /** The rest of the fence line, such as `title="queue.ts" {2}`. */
  meta?: string | undefined;
  /** False while a streamed fence is still open. */
  closed: boolean;
}

export interface MarkdownLinkProps {
  href: string;
  title?: string | undefined;
  /** True for an absolute address on another site: it opens in a new tab by default. */
  external: boolean;
  children: ReactNode;
}

export interface MarkdownImageProps {
  src: string;
  alt: string;
  title?: string | undefined;
}

/**
 * Replace how a part is drawn. `code` is the usual one: pass the docs code block to get file
 * names, highlighting and copy. `link` takes a router link. Images are off unless `image` is
 * given, so a reply cannot load a tracking pixel or a picture from anywhere.
 */
export interface MarkdownComponents {
  code?: (props: MarkdownCodeProps) => ReactNode;
  link?: (props: MarkdownLinkProps) => ReactNode;
  image?: (props: MarkdownImageProps) => ReactNode;
}

export type MarkdownSize = 'sm' | 'base';

export interface MarkdownProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The Markdown text. Raw HTML in it shows as text, never as markup. */
  children: string;
  /** Text still arriving from a stream: open markers at the end close in place. */
  streaming?: boolean | undefined;
  /** Show a caret after the last words while `streaming`. Default true. */
  caret?: boolean | undefined;
  /** `sm` for a narrow panel or a dense thread. */
  size?: MarkdownSize | undefined;
  components?: MarkdownComponents | undefined;
  /** Protocols a link may use. Default http, https, mailto and tel; relative links always work. */
  allowedProtocols?: readonly string[] | undefined;
  /** Where links to other sites open. Default `new-tab`, so a conversation is never lost. */
  externalLinks?: 'new-tab' | 'same-tab' | undefined;
  /** Said after a link that opens a new tab. Default "(opens in a new tab)". */
  newTabLabel?: string | undefined;
}

const HEADING: Record<MarkdownSize, Record<1 | 2 | 3 | 4 | 5 | 6, string>> = {
  base: {
    1: 'text-xl font-heading tracking-tight',
    2: 'text-lg font-heading',
    3: 'text-base font-strong',
    4: 'text-base font-strong',
    5: 'text-sm font-strong',
    6: 'text-sm font-strong text-fg-muted',
  },
  sm: {
    1: 'text-lg font-heading tracking-tight',
    2: 'text-base font-heading',
    3: 'text-sm font-strong',
    4: 'text-sm font-strong',
    5: 'text-sm font-strong',
    6: 'text-sm font-strong text-fg-muted',
  },
};

const ALIGN: Record<Exclude<MarkdownAlign, null>, 'start' | 'center' | 'end'> = {
  left: 'start',
  center: 'center',
  right: 'end',
};

/**
 * The caret at the end of text that is still arriving, as classes for an `::after`: a short accent
 * bar that breathes. Breathing is a fade, so it stays under reduced motion.
 */
export const streamingCaret = cn(
  'after:ms-0.5 after:inline-block after:h-3.5 after:w-1.5 after:translate-y-0.5',
  'after:rounded-badge after:bg-accent after:animate-breathe',
);

/** The same caret on the last paragraph or list item of a streaming Markdown text. */
const markdownCaret = cn(
  '[&>p:last-child]:after:ms-0.5 [&>p:last-child]:after:inline-block [&>p:last-child]:after:h-3.5 [&>p:last-child]:after:w-1.5 [&>p:last-child]:after:translate-y-0.5',
  '[&>p:last-child]:after:rounded-badge [&>p:last-child]:after:bg-accent [&>p:last-child]:after:animate-breathe',
  '[&>[role=list]:last-child>li:last-child>:last-child]:after:ms-0.5 [&>[role=list]:last-child>li:last-child>:last-child]:after:inline-block [&>[role=list]:last-child>li:last-child>:last-child]:after:h-3.5 [&>[role=list]:last-child>li:last-child>:last-child]:after:w-1.5 [&>[role=list]:last-child>li:last-child>:last-child]:after:translate-y-0.5',
  '[&>[role=list]:last-child>li:last-child>:last-child]:after:rounded-badge [&>[role=list]:last-child>li:last-child>:last-child]:after:bg-accent [&>[role=list]:last-child>li:last-child>:last-child]:after:animate-breathe',
);

const isExternal = (href: string) => /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(href);

interface RenderContext {
  size: MarkdownSize;
  components: MarkdownComponents;
  newTab: boolean;
  newTabLabel: string;
  /** Inside a tight list item: paragraphs drop their margins. */
  tight: boolean;
}

/** The code block drawn when no `components.code` is given: the code, its language, no chrome. */
export function MarkdownCode({ code, lang }: MarkdownCodeProps) {
  return (
    <figure
      data-slot="markdown-code"
      className="m-0 min-w-0 overflow-hidden rounded-panel border border-line bg-code-background text-code-foreground"
    >
      {lang !== undefined && (
        <figcaption className="border-b border-line px-3 py-1.5 font-mono text-xs text-fg-muted">
          {lang}
        </figcaption>
      )}
      <pre
        // A scroll area must be reachable with the keyboard to scroll it without a pointer.
        tabIndex={0}
        aria-label={lang === undefined ? 'Code' : `${lang} code`}
        className={cn(
          'm-0 overflow-x-auto px-3 py-2.5 font-mono text-sm',
          'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        )}
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}

function MarkdownLink({
  href,
  title,
  external,
  children,
  newTab,
  newTabLabel,
}: MarkdownLinkProps & { newTab: boolean; newTabLabel: string }) {
  const opensTab = external && newTab;
  return (
    <a
      href={href}
      title={title}
      {...(opensTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'rounded-control font-medium text-accent-strong underline decoration-accent-strong/40 underline-offset-4',
        'hover:decoration-accent-strong',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
      )}
    >
      {children}
      {opensTab && (
        <>
          <ArrowSquareOutIcon
            aria-hidden
            weight="bold"
            className="ms-0.5 inline size-3 align-baseline"
          />
          <span className="sr-only"> {newTabLabel}</span>
        </>
      )}
    </a>
  );
}

function renderInline(nodes: readonly MarkdownInline[], context: RenderContext): ReactNode[] {
  return nodes.map((node, index) => {
    // Inline nodes are positional: the same text always yields the same list.
    const key = index;
    switch (node.type) {
      case 'text':
        return node.value;
      case 'break':
        return <br key={key} />;
      case 'strong':
        return (
          <strong key={key} className="font-strong text-fg">
            {renderInline(node.children, context)}
          </strong>
        );
      case 'em':
        return <em key={key}>{renderInline(node.children, context)}</em>;
      case 'del':
        return (
          <del key={key} className="text-fg-muted">
            {renderInline(node.children, context)}
          </del>
        );
      case 'code':
        return (
          <code
            key={key}
            data-slot="markdown-inline-code"
            className="rounded-badge border border-line bg-code-background px-1 py-px font-mono text-fg"
          >
            {node.value}
          </code>
        );
      case 'link': {
        const children = renderInline(node.children, context);
        if (node.href === null) return <span key={key}>{children}</span>;
        const props: MarkdownLinkProps = {
          href: node.href,
          title: node.title,
          external: isExternal(node.href),
          children,
        };
        return (
          <Fragment key={key}>
            {context.components.link?.(props) ?? (
              <MarkdownLink {...props} newTab={context.newTab} newTabLabel={context.newTabLabel} />
            )}
          </Fragment>
        );
      }
      case 'image': {
        if (node.src !== null && context.components.image !== undefined) {
          return (
            <Fragment key={key}>
              {context.components.image({ src: node.src, alt: node.alt, title: node.title })}
            </Fragment>
          );
        }
        // Without an image renderer the picture stays a link to itself, named by its alt text.
        if (node.src === null || node.alt === '') return node.alt;
        return (
          <MarkdownLink
            key={key}
            href={node.src}
            title={node.title}
            external={isExternal(node.src)}
            newTab={context.newTab}
            newTabLabel={context.newTabLabel}
          >
            {node.alt}
          </MarkdownLink>
        );
      }
    }
  });
}

function renderBlocks(blocks: readonly MarkdownBlock[], context: RenderContext): ReactNode[] {
  return blocks.map((block, index) => {
    const key = index;
    switch (block.type) {
      case 'heading': {
        // Headings in a reply sit under the page's own: they start at h3 so the outline holds.
        const Tag = (['h3', 'h4', 'h5', 'h6', 'h6', 'h6'] as const)[block.level - 1] ?? 'h6';
        return (
          <Tag key={key} className={cn('text-balance text-fg', HEADING[context.size][block.level])}>
            {renderInline(block.children, context)}
          </Tag>
        );
      }
      case 'paragraph':
        return context.tight ? (
          <span key={key} className="block">
            {renderInline(block.children, context)}
          </span>
        ) : (
          <p key={key} className="text-pretty">
            {renderInline(block.children, context)}
          </p>
        );
      case 'code':
        return (
          <div key={key} data-slot="markdown-code-block" className="min-w-0">
            {context.components.code?.({
              code: block.value,
              lang: block.lang,
              meta: block.meta,
              closed: block.closed,
            }) ?? (
              <MarkdownCode
                code={block.value}
                lang={block.lang}
                meta={block.meta}
                closed={block.closed}
              />
            )}
          </div>
        );
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag
            key={key}
            // An explicit role: some screen readers drop list semantics once list-style is removed.
            role="list"
            start={block.ordered && block.start !== 1 ? block.start : undefined}
            className={cn(
              'flex flex-col ps-6',
              block.ordered ? 'list-decimal' : 'list-disc',
              block.tight ? 'gap-1' : 'gap-3',
            )}
          >
            {block.items.map((item, itemIndex) => (
              <li
                // Items are positional within their list.
                key={itemIndex}
                className="ps-1 marker:text-fg-subtle [&>*+*]:mt-2"
              >
                {renderBlocks(item, { ...context, tight: block.tight })}
              </li>
            ))}
          </Tag>
        );
      }
      case 'blockquote':
        return (
          <blockquote
            key={key}
            className="flex flex-col gap-3 border-s border-line-strong ps-4 text-fg-muted"
          >
            {renderBlocks(block.children, { ...context, tight: false })}
          </blockquote>
        );
      case 'table':
        return (
          <div
            key={key}
            data-slot="markdown-table"
            // Wide tables scroll inside their frame, never the page; the frame takes focus to scroll.
            tabIndex={0}
            role="region"
            aria-label="Table"
            className={cn(
              'min-w-0 overflow-x-auto rounded-panel border border-line',
              'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            )}
          >
            <Table className="text-sm [&_tbody_tr:last-child_td]:border-b-0">
              <TableHeader>
                <TableRow>
                  {block.head.map((cell, cellIndex) => {
                    const align = block.align[cellIndex] ?? null;
                    return (
                      <TableHead
                        // Columns are positional.
                        key={cellIndex}
                        align={align === null ? 'start' : ALIGN[align]}
                      >
                        {renderInline(cell, context)}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {block.rows.map((row, rowIndex) => (
                  <TableRow
                    // Rows are positional.
                    key={rowIndex}
                  >
                    {row.map((cell, cellIndex) => {
                      const align = block.align[cellIndex] ?? null;
                      return (
                        <TableCell
                          // Columns are positional.
                          key={cellIndex}
                          align={align === null ? 'start' : ALIGN[align]}
                          className="h-auto"
                        >
                          {renderInline(cell, context)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      case 'hr':
        return <hr key={key} className="border-line" />;
    }
  });
}

/**
 * Markdown as themed React elements: headings, paragraphs, emphasis, inline code, code blocks,
 * lists, quotes, tables and links. It never renders HTML from the text, so raw tags show as
 * words, and links keep only safe protocols; links to other sites open in a new tab and say so.
 * Pass `streaming` while a reply arrives so an open `**` or fence never flashes its markers, and
 * `components.code` to draw code blocks with the docs code block.
 */
export function Markdown({
  children,
  streaming = false,
  caret = true,
  size = 'base',
  components,
  allowedProtocols,
  externalLinks = 'new-tab',
  newTabLabel = '(opens in a new tab)',
  className,
  ...props
}: MarkdownProps) {
  const blocks = useMemo(
    () => parseMarkdown(children, { streaming, allowedProtocols }),
    [children, streaming, allowedProtocols],
  );
  return (
    <div
      data-slot="markdown"
      data-size={size}
      data-streaming={streaming || undefined}
      className={cn(
        'flex min-w-0 flex-col text-fg wrap-anywhere',
        size === 'sm' ? 'gap-3 text-sm' : 'gap-4 text-base',
        streaming && caret && markdownCaret,
        className,
      )}
      {...props}
    >
      {renderBlocks(blocks, {
        size,
        components: components ?? {},
        newTab: externalLinks === 'new-tab',
        newTabLabel,
        tight: false,
      })}
    </div>
  );
}

export {
  DEFAULT_PROTOCOLS,
  markdownToText,
  parseMarkdown,
  safeUrl,
  type MarkdownAlign,
  type MarkdownBlock,
  type MarkdownInline,
  type MarkdownParseOptions,
} from './markdown-parse';
