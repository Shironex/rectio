import { cn } from '@rectio/ui';
import { useId, type ComponentProps, type ReactNode } from 'react';

import { useMarketingParts } from './parts';

export type SectionTone = 'plain' | 'tinted' | 'panel';
export type SectionWidth = 'narrow' | 'default' | 'wide';

const WIDTH: Record<SectionWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

/** The page gutter and measure every marketing block shares, so stacked sections line up. */
export function Container({
  width = 'default',
  className,
  ...props
}: ComponentProps<'div'> & { width?: SectionWidth | undefined }) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTH[width], className)}
      {...props}
    />
  );
}

export interface SectionProps extends Omit<ComponentProps<'section'>, 'title'> {
  /**
   * `plain` sits on the page, `tinted` washes the full width with the accent's softest tint, and
   * `panel` draws a soft tinted panel inside the page gutters.
   */
  tone?: SectionTone | undefined;
  width?: SectionWidth | undefined;
  /** The section's accessible name when it has no visible heading wired through `labelledBy`. */
  label?: string | undefined;
  labelledBy?: string | undefined;
  /** Pass `false` to drop the vertical padding, for a block that sits flush against another. */
  padded?: boolean;
  innerClassName?: string | undefined;
}

/**
 * A landmark for one band of a page: a `section` named by its heading, with the shared measure,
 * gutter and vertical rhythm. Tones give a page rhythm without a theme switch mid-scroll.
 */
export function Section({
  tone = 'plain',
  width = 'default',
  label,
  labelledBy,
  padded = true,
  className,
  innerClassName,
  children,
  ...props
}: SectionProps) {
  const pad = padded && 'py-16 sm:py-24';
  return (
    <section
      aria-label={labelledBy === undefined ? label : undefined}
      aria-labelledby={labelledBy}
      data-slot="marketing-section"
      data-tone={tone}
      className={cn(
        '@container text-fg',
        tone === 'tinted' && 'bg-linear-to-b from-accent-subtle to-surface-canvas',
        tone !== 'panel' && pad,
        className,
      )}
      {...props}
    >
      {tone === 'panel' ? (
        <Container width={width} className={cn(padded && 'py-6 sm:py-10')}>
          <div
            className={cn(
              'rounded-panel border border-line bg-linear-to-b from-accent-subtle to-surface px-5 py-12 sm:px-10 sm:py-16',
              innerClassName,
            )}
          >
            {children}
          </div>
        </Container>
      ) : (
        <Container width={width} className={innerClassName}>
          {children}
        </Container>
      )}
    </section>
  );
}

/**
 * A short rule and a small caps label above a heading. Use it sparingly: one in every few sections
 * reads as a signpost, one on every section reads as a template.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-xs font-medium tracking-caps text-fg-muted uppercase',
        className,
      )}
    >
      <span aria-hidden className="h-px w-6 bg-fg-subtle" />
      {children}
    </p>
  );
}

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode | undefined;
  eyebrow?: ReactNode | undefined;
  align?: 'start' | 'center';
  /** Heading level: 2 for page sections, 1 when the header is the page's own title. */
  level?: 1 | 2 | 3;
  /** Display size: `xl` for a page title, `lg` for a section, `md` inside a narrow column. */
  size?: 'md' | 'lg' | 'xl';
  /** The heading's id, for the section's `aria-labelledby`. */
  id?: string | undefined;
  className?: string | undefined;
  children?: ReactNode;
}

const TITLE_SIZE = {
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
  xl: 'text-4xl sm:text-5xl',
};

/**
 * Eyebrow, heading and one short paragraph, stacked. The heading can mix weights: wrap the words to
 * stress in `<Em>`.
 */
export function SectionHeader({
  title,
  description,
  eyebrow,
  align = 'start',
  level = 2,
  size = 'lg',
  id,
  className,
  children,
}: SectionHeaderProps) {
  const Heading = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  const { Reveal } = useMarketingParts();
  return (
    <Reveal
      className={cn(
        'flex max-w-2xl flex-col gap-4',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow !== undefined && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        id={id}
        className={cn(
          'font-display font-regular tracking-tight text-balance text-fg',
          TITLE_SIZE[size],
        )}
      >
        {title}
      </Heading>
      {description !== undefined && (
        <p className="max-w-prose text-lg text-pretty text-fg-muted">{description}</p>
      )}
      {children}
    </Reveal>
  );
}

/** The stressed words of a mixed-weight heading: the same family, heavier. */
export function Em({ children, className }: { children: ReactNode; className?: string }) {
  return <strong className={cn('font-heading text-fg', className)}>{children}</strong>;
}

/** An id for a section heading, so the section can name itself with `aria-labelledby`. */
export function useHeadingId(id?: string): string {
  const generated = useId();
  return id ?? generated;
}
