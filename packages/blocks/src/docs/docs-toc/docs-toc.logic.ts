import { useEffect, useState } from 'react';

/** A heading on the page, as the table of contents lists it. */
export interface TocHeading {
  /** The heading element's id, the target of its link. */
  id: string;
  title: string;
  /** 2 for a section, 3 for a subsection; deeper levels are left out by most pages. */
  level: 2 | 3 | 4;
}

/**
 * Which heading is current, given each heading's top edge relative to the reading line (the
 * offset below the sticky header). The current heading is the last one whose top has passed the
 * line; before the first heading, the first. At the very bottom of the page, the last heading wins
 * even when it never reaches the line, so short final sections can still be marked.
 */
export function pickActive(
  tops: readonly { id: string; top: number }[],
  line: number,
  atBottom: boolean,
): string | null {
  if (tops.length === 0) return null;
  if (atBottom) return tops.at(-1)?.id ?? null;
  let active = tops[0]?.id ?? null;
  for (const heading of tops) {
    if (heading.top - line <= 1) active = heading.id;
    else break;
  }
  return active;
}

/**
 * The id of the heading the reader is in. Uses an IntersectionObserver to know when to measure,
 * never a scroll listener: the heading tops are read only when one crosses the reading band.
 */
export function useActiveHeading(ids: readonly string[], offset = 96): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('\u0000');
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const measure = () => {
      const scroller = document.scrollingElement ?? document.documentElement;
      const atBottom = scroller.scrollTop + window.innerHeight >= scroller.scrollHeight - 2;
      const tops = elements.map((element) => ({
        id: element.id,
        top: element.getBoundingClientRect().top,
      }));
      setActive(pickActive(tops, offset, atBottom && scroller.scrollTop > 0));
    };
    // Thin bands across the viewport: every heading that crosses one triggers a measurement.
    const thresholds = Array.from({ length: 11 }, (_, i) => i / 10);
    const observer = new IntersectionObserver(measure, {
      rootMargin: `-${String(offset)}px 0px 0px 0px`,
      threshold: thresholds,
    });
    for (const element of elements) observer.observe(element);
    // The last section may be too short to cross anything: watch the end of the page as well.
    const end = document.createElement('div');
    end.setAttribute('aria-hidden', 'true');
    end.dataset.slot = 'docs-toc-sentinel';
    document.body.append(end);
    observer.observe(end);
    measure();
    return () => {
      observer.disconnect();
      end.remove();
    };
    // `key` stands for `ids`: a new array with the same headings must not restart the observer.
  }, [key, offset]);
  return active;
}

/** Scrolls to a heading: smoothly, unless the reader asked for reduced motion. */
export function scrollToHeading(id: string, offset = 96): boolean {
  const target = document.getElementById(id);
  if (target === null) return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = target.getBoundingClientRect().top + window.scrollY - offset + 8;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
  // Moves the reading position for keyboard and screen reader users without a second jump.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}
