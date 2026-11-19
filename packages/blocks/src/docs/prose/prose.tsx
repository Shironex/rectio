import { LinkSimpleIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import type { ComponentProps, ReactNode } from 'react';

import { slugify, textOf } from '../lib/docs';

/**
 * Long-form docs text in the theme's type: headings, paragraphs, lists, inline code, quotes,
 * tables, rules and links, at a reading measure. Wrap a rendered MDX page in it; the components in
 * `docsMdxComponents` fill in what plain Markdown cannot say.
 */
export function DocsProse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="docs-prose"
      className={cn(
        'min-w-0 text-base text-fg',
        '[&>*+*]:mt-5 [&>h2]:mt-14 [&>h3]:mt-10 [&>h4]:mt-8',
        // Sections after the first start under a hairline, so a long page has landmarks.
        '[&>h2:not(:first-child)]:border-t [&>h2:not(:first-child)]:border-line [&>h2:not(:first-child)]:pt-10',
        '[&_p]:text-pretty [&_p]:text-fg-muted',
        '[&_strong]:font-strong [&_strong]:text-fg',
        '[&_p_a,&_li_a,&_td_a]:font-medium [&_p_a,&_li_a,&_td_a]:text-accent-strong [&_p_a,&_li_a,&_td_a]:underline [&_p_a,&_li_a,&_td_a]:decoration-accent-strong/40 [&_p_a,&_li_a,&_td_a]:underline-offset-4',
        '[&_p_a:hover,&_li_a:hover,&_td_a:hover]:decoration-accent-strong',
        '[&_p_a,&_li_a,&_td_a]:rounded-control [&_a]:outline-offset-2 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-focus',
        '[&>ul]:list-disc [&>ol]:list-decimal [&>ul,&>ol]:space-y-2 [&>ul,&>ol]:ps-6 [&>ul>li,&>ol>li]:ps-1 [&>ul>li,&>ol>li]:text-fg-muted [&_li]:marker:text-fg-subtle',
        '[&_:not(pre)>code]:rounded-badge [&_:not(pre)>code]:border [&_:not(pre)>code]:border-line [&_:not(pre)>code]:bg-code-background [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-px [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-sm [&_:not(pre)>code]:text-fg',
        '[&>blockquote]:border-s [&>blockquote]:border-line-strong [&>blockquote]:ps-5 [&>blockquote]:text-fg',
        '[&>hr]:my-12 [&>hr]:border-line',
        className,
      )}
    >
      {children}
    </div>
  );
}

const HEADING_SIZE = {
  2: 'text-2xl font-heading tracking-tight',
  3: 'text-xl font-heading',
  4: 'text-lg font-strong',
} as const;

export interface DocsHeadingProps extends Omit<ComponentProps<'h2'>, 'children'> {
  level?: 2 | 3 | 4;
  /** Defaults to a slug of the heading's text, so links and the table of contents agree. */
  id?: string | undefined;
  children: ReactNode;
  /** Something after the text that is not part of the link, such as a Beta badge. */
  badge?: ReactNode;
}

/**
 * A section heading with a link to itself: hover or focus shows the link icon, and the heading
 * stops below the sticky header when a link lands on it.
 */
export function DocsHeading({
  level = 2,
  id,
  children,
  badge,
  className,
  ...props
}: DocsHeadingProps) {
  const Tag = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
  const anchor = id ?? slugify(textOf(children));
  return (
    <Tag
      id={anchor}
      data-slot="docs-heading"
      className={cn(
        'group/heading flex scroll-mt-24 flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-balance text-fg',
        HEADING_SIZE[level],
        className,
      )}
      {...props}
    >
      <a
        href={`#${anchor}`}
        className="inline-flex items-center gap-2 rounded-control text-inherit no-underline outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
      >
        {children}
        <LinkSimpleIcon
          aria-hidden
          weight="bold"
          className="size-4 shrink-0 text-fg-subtle opacity-0 transition-opacity duration-fast ease-standard group-hover/heading:opacity-100 group-focus-within/heading:opacity-100 pointer-coarse:hidden"
        />
      </a>
      {badge}
    </Tag>
  );
}

/**
 * A table that scrolls sideways inside its own frame on a narrow screen, never the page. The frame
 * is a named, focusable region so it scrolls with the keyboard too.
 */
export function DocsTable({
  label,
  children,
  className,
}: {
  /** Accessible name of the scroll region. Default "Table". */
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label ?? 'Table'}
      tabIndex={0}
      data-slot="docs-table"
      className={cn(
        'min-w-0 overflow-x-auto rounded-panel border border-line',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        '[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
        '[&_thead]:bg-surface-sunken [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-start [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-fg',
        '[&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-fg-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface FigureProps {
  src: string;
  alt: string;
  caption?: ReactNode;
  width?: number | undefined;
  height?: number | undefined;
  /** Draw a frame around the image, for screenshots on the page's own colour. Default true. */
  framed?: boolean | undefined;
  className?: string | undefined;
}

/**
 * An image with a caption under it. Pass the size so the page does not jump while it loads; it
 * loads lazily and decodes off the main thread.
 */
export function Figure({
  src,
  alt,
  caption,
  width,
  height,
  framed = true,
  className,
}: FigureProps) {
  return (
    <figure data-slot="docs-figure" className={cn('m-0 flex flex-col gap-3', className)}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={cn(
          'h-auto w-full bg-surface-sunken',
          framed && 'rounded-panel border border-line',
        )}
      />
      {caption !== undefined && (
        <figcaption className="text-sm text-pretty text-fg-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
