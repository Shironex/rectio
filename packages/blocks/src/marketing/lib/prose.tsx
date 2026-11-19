import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

/**
 * Long-form text in the theme's type: headings, paragraphs, lists, quotes, code, tables and links,
 * at a reading measure. For articles and legal pages; pass plain HTML elements as children.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="prose"
      className={cn(
        'max-w-prose text-lg text-fg',
        '[&>*+*]:mt-5 [&_p]:text-pretty [&_p]:text-fg-muted',
        '[&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-heading [&_h2]:tracking-tight [&_h2]:text-fg',
        '[&_h3]:mt-8 [&_h3]:scroll-mt-24 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-heading [&_h3]:text-fg',
        '[&_strong]:font-strong [&_strong]:text-fg',
        '[&_a]:text-accent-strong [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-fg',
        '[&_a]:rounded-control [&_a]:outline-offset-2 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-focus',
        '[&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:space-y-2 [&_ul,&_ol]:ps-6 [&_li]:text-fg-muted [&_li]:marker:text-fg-subtle',
        '[&_blockquote]:border-s-2 [&_blockquote]:border-line-strong [&_blockquote]:ps-5 [&_blockquote]:text-fg',
        '[&_code]:rounded-badge [&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-base',
        '[&_hr]:my-12 [&_hr]:border-line',
        '[&_table]:w-full [&_table]:text-base [&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_th]:text-start [&_th]:font-medium',
        '[&_td]:border-b [&_td]:border-line [&_td]:py-2 [&_td]:align-top [&_td]:text-fg-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}
