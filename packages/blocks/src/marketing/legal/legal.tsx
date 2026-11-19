import { CaretDownIcon, WarningIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { linkFocus } from '../lib/action';
import { formatDate, isoDate } from '../lib/marketing';
import { Prose } from '../lib/prose';
import { Container } from '../lib/section';
import { LEGAL_TEMPLATE_NOTICE, tableOfContents, type LegalTemplate } from './legal.logic';

export interface LegalSection {
  title: string;
  /** The section's text as plain HTML elements; it is set in the prose styles. */
  content: ReactNode;
}

export interface LegalPageProps {
  title: string;
  /** ISO date the text last changed, such as 2026-03-04. */
  lastUpdated: string;
  /** A short paragraph under the title. */
  intro?: ReactNode;
  sections: readonly LegalSection[];
  /**
   * Marks the page as a template: a notice at the top says to replace the text and that it is not
   * legal advice. Leave it on until your own text is in.
   */
  template?: boolean;
  /** A closing line, such as how to reach you with questions. */
  contact?: ReactNode;
  locale?: string;
  className?: string;
}

/** Turns one of the exported templates into sections for `LegalPage`. */
export function templateSections(template: LegalTemplate): LegalSection[] {
  return template.sections.map((section) => ({
    title: section.title,
    content: (
      <>
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.items !== undefined && (
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </>
    ),
  }));
}

/** The id of the section nearest the top of the viewport, for the table of contents. */
function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first !== undefined) setActive(first);
      },
      // The band just under a sticky header: a section is current once its heading reaches it.
      { rootMargin: '-96px 0px -60% 0px' },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element !== null) observer.observe(element);
    }
    return () => {
      observer.disconnect();
    };
  }, [ids]);
  return active;
}

/**
 * A privacy policy, terms of service or cookie policy page: title, last updated date, a table of
 * contents that follows the reader on wide screens and folds into a disclosure on narrow ones, and
 * the text in prose styles. Pair it with the exported templates to start, and replace every word.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
  template = false,
  contact,
  locale,
  className,
}: LegalPageProps) {
  const titleId = useId();
  const tocId = useId();
  const toc = useMemo(() => tableOfContents(sections.map((section) => section.title)), [sections]);
  const ids = useMemo(() => toc.map((entry) => entry.id), [toc]);
  const active = useActiveSection(ids);

  const links = (onPick?: () => void) => (
    <ol className="flex flex-col border-s border-line">
      {toc.map((entry, index) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            aria-current={active === entry.id ? 'location' : undefined}
            onClick={onPick}
            className={cn(
              '-ms-px flex min-h-8 items-baseline gap-3 border-s border-transparent py-1 ps-4 text-sm text-fg-muted',
              'transition-colors duration-fast ease-standard pointer-fine:hover:text-fg',
              'aria-[current=location]:border-accent aria-[current=location]:font-medium aria-[current=location]:text-fg',
              'pointer-coarse:min-h-(--rx-button-height-touch)',
              linkFocus,
            )}
          >
            <span aria-hidden className="text-fg-subtle tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            {entry.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <article aria-labelledby={titleId} className={cn('py-12 text-fg sm:py-16', className)}>
      <Container width="wide">
        <header className="flex max-w-3xl flex-col gap-4 border-b border-line pb-10">
          <h1
            id={titleId}
            className="font-display text-4xl font-regular tracking-tight text-balance text-fg sm:text-5xl"
          >
            {title}
          </h1>
          <p className="text-base text-fg-muted">
            Last updated{' '}
            <time dateTime={isoDate(lastUpdated)}>{formatDate(lastUpdated, locale)}</time>
          </p>
          {template && (
            <p
              role="note"
              className="flex items-start gap-3 rounded-panel border border-warning bg-warning-subtle px-4 py-3 text-base font-medium text-warning-strong"
            >
              <WarningIcon aria-hidden weight="bold" className="mt-0.5 size-5 shrink-0" />
              {LEGAL_TEMPLATE_NOTICE}
            </p>
          )}
          {intro !== undefined && (
            <p className="max-w-prose text-lg text-pretty text-fg-muted">{intro}</p>
          )}
        </header>
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <nav aria-labelledby={tocId} className="lg:col-span-4 xl:col-span-3">
            <details className="group/toc rounded-panel border border-line bg-surface lg:hidden">
              <summary
                className={cn(
                  'flex min-h-(--rx-button-height-touch) cursor-pointer list-none items-center justify-between px-4 text-base font-medium text-fg',
                  linkFocus,
                )}
              >
                <span id={tocId}>Contents</span>
                <CaretDownIcon
                  aria-hidden
                  weight="bold"
                  className="size-4 transition-transform duration-fast ease-standard group-open/toc:rotate-180"
                />
              </summary>
              <div className="px-4 pb-4">{links()}</div>
            </details>
            <div className="sticky top-24 hidden flex-col gap-3 lg:flex">
              <p aria-hidden className="text-sm font-medium text-fg">
                Contents
              </p>
              {links()}
            </div>
          </nav>
          <div className="min-w-0 lg:col-span-8 xl:col-span-9">
            <Prose>
              {sections.map((section, index) => (
                <section key={toc[index]?.id} aria-labelledby={toc[index]?.id}>
                  <h2 id={toc[index]?.id}>{section.title}</h2>
                  <div className="mt-4 flex flex-col gap-4">{section.content}</div>
                </section>
              ))}
              {contact !== undefined && (
                <>
                  <hr />
                  <div>{contact}</div>
                </>
              )}
            </Prose>
          </div>
        </div>
      </Container>
    </article>
  );
}
