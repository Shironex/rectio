/**
 * Plain helpers the docs blocks share: the navigation tree and where a page sits in it, heading
 * ids, dates. No React, no framework: a build script or a server can run them too.
 */

/** A small label after a page's title in the navigation, such as New or Beta. */
export type DocsBadgeTone = 'new' | 'beta' | 'deprecated' | 'pro' | 'neutral';

export interface DocsBadgeData {
  label: string;
  tone?: DocsBadgeTone | undefined;
}

/** One entry in the navigation: a page, a group of pages, or both (a page with children). */
export interface DocsNavItem {
  title: string;
  /** Omit for a group that only holds other pages. */
  href?: string | undefined;
  /** New, Beta and the like. A string is drawn as a neutral badge. */
  badge?: string | DocsBadgeData | undefined;
  /** Opens in a new tab and leaves the docs; never counted as the current page. */
  external?: boolean | undefined;
  items?: readonly DocsNavItem[] | undefined;
}

/** A titled run of the navigation, such as "Get started" or "Reference". */
export interface DocsNavSection {
  /** Omit for the first, untitled run. */
  title?: string | undefined;
  items: readonly DocsNavItem[];
}

/** A page in reading order, with the section it belongs to. */
export interface DocsPageLink {
  title: string;
  href: string;
  section?: string | undefined;
}

/** `/docs/install/` and `/docs/install` are the same page; a hash or query never changes it. */
export function normalizePath(href: string): string {
  const path = href.split(/[?#]/)[0] ?? '';
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function isSamePage(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return false;
  return normalizePath(a) === normalizePath(b);
}

/** Every page in reading order: section by section, parents before their children. */
export function flattenNav(sections: readonly DocsNavSection[]): DocsPageLink[] {
  const pages: DocsPageLink[] = [];
  const walk = (items: readonly DocsNavItem[], section: string | undefined) => {
    for (const item of items) {
      if (item.href !== undefined && item.external !== true) {
        pages.push({ title: item.title, href: item.href, section });
      }
      if (item.items !== undefined) walk(item.items, section);
    }
  };
  for (const section of sections) walk(section.items, section.title);
  return pages;
}

/** The previous and next page around `current`, crossing sections. */
export function pagerFor(
  sections: readonly DocsNavSection[],
  current: string,
): { prev: DocsPageLink | null; next: DocsPageLink | null } {
  const pages = flattenNav(sections);
  const index = pages.findIndex((page) => isSamePage(page.href, current));
  if (index === -1) return { prev: null, next: null };
  return { prev: pages[index - 1] ?? null, next: pages[index + 1] ?? null };
}

/**
 * The items from the top of the tree down to the current page, for a breadcrumb and for which
 * groups start open. Empty when the page is not in the navigation.
 */
export function trailTo(sections: readonly DocsNavSection[], current: string): DocsNavItem[] {
  const search = (items: readonly DocsNavItem[]): DocsNavItem[] | null => {
    for (const item of items) {
      if (isSamePage(item.href, current) && item.external !== true) return [item];
      if (item.items !== undefined) {
        const below = search(item.items);
        if (below !== null) return [item, ...below];
      }
    }
    return null;
  };
  for (const section of sections) {
    const found = search(section.items);
    if (found !== null) return found;
  }
  return [];
}

/** The section title the current page sits in, for the breadcrumb's first level. */
export function sectionOf(sections: readonly DocsNavSection[], current: string): string | null {
  for (const section of sections) {
    if (trailTo([section], current).length > 0) return section.title ?? null;
  }
  return null;
}

/** An id for a heading made from its text: "Retries and backoff" becomes "retries-and-backoff". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ids for a list of heading texts, unique within the page: a second "Options" becomes
 * "options-1", the way most Markdown tools number them.
 */
export function uniqueSlugs(texts: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return texts.map((text) => {
    const base = slugify(text) || 'section';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${String(count)}`;
  });
}

/** A calendar date as people read it, such as 4 March 2026, in the reader's locale. */
export function formatDate(date: Date | string, locale?: string): string {
  const value = typeof date === 'string' ? new Date(`${date.slice(0, 10)}T00:00:00`) : date;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    value,
  );
}

/** A machine-readable date for a `<time dateTime>` attribute. */
export function isoDate(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Text of a React-free children value: strings and numbers joined, anything else skipped. */
export function textOf(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join('');
  if (typeof value === 'object' && value !== null && 'props' in value) {
    const props = (value as { props?: { children?: unknown } }).props;
    return textOf(props?.children);
  }
  return '';
}
