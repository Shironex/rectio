import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

/** A landing section: a width, a rhythm, and an id to link to. */
export function Section({
  id,
  className,
  children,
  label,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Names the section for assistive technology when its heading is not enough. */
  label?: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn('mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-8', className)}
    >
      {children}
    </section>
  );
}

/** Headline and one short paragraph, stacked: a section has one message. */
export function SectionIntro({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex max-w-2xl flex-col gap-4', className)}>
      <h2 className="site-reveal font-display text-3xl font-heading tracking-tight text-balance text-fg md:text-4xl">
        {title}
      </h2>
      {children !== undefined && (
        <p className="site-reveal site-step-1 text-lg text-pretty text-fg-muted">{children}</p>
      )}
    </div>
  );
}
