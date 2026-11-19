'use client';

import {
  DocsBreadcrumb,
  DocsPager,
  pagerFor,
  sectionOf,
  trailTo,
  type DocsNavSection,
} from '@rectio/blocks/docs';

/** The previous and next page in sidebar order. */
export function PagePager({ sections, href }: { sections: DocsNavSection[]; href: string }) {
  const { prev, next } = pagerFor(sections, href);
  return <DocsPager prev={prev} next={next} />;
}

/** Section, parent groups and the page, from the sidebar's own tree. */
export function PageBreadcrumb({ sections, href }: { sections: DocsNavSection[]; href: string }) {
  const section = sectionOf(sections, href);
  const trail = trailTo(sections, href);
  const items = [
    ...(section === null ? [] : [{ label: section }]),
    ...trail.map((item, index) =>
      index < trail.length - 1 && item.href !== undefined
        ? { label: item.title, href: item.href }
        : { label: item.title },
    ),
  ];
  if (items.length < 2) return null;
  return <DocsBreadcrumb items={items} />;
}
