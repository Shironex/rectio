/**
 * The search index: one document per page with its plain text and its headings, written at build
 * time by app/search-index.json/route.ts. The search dialog downloads it on the first keystroke.
 */
import type { DocsNavItem, DocsNavSection, DocsSearchDocument } from '@rectio/blocks/docs';

import type { Page } from './content';
import { slugify, uniqueSlugs } from './slugs';

/** Markdown and MDX reduced to the words a reader would search for. */
export function plainText(body: string): string {
  return body
    .replace(/^```[\s\S]*?^```/gm, ' ')
    .replace(/^(import|export) .*$/gm, ' ')
    .replace(/<\/?[A-Z][^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#|~]/g, ' ')
    .replace(/^[-:\s|]+$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The h2 and h3 headings of a page and its API entries, with the ids the page gives them. */
export function headingsOf(body: string): { id: string; title: string }[] {
  const withoutCode = body.replace(/^```[\s\S]*?^```/gm, '');
  const entries = [
    ...withoutCode.matchAll(/<(?:SignatureCard[^>]*?\sname|Endpoint[^>]*?\stitle)="([^"]+)"/g),
  ].map((match) => ({ id: slugify(match[1] ?? ''), title: match[1] ?? '' }));
  const all = [...withoutCode.matchAll(/^(#{2,4})\s+(.+?)\s*#*$/gm)].map((match) => ({
    level: match[1]?.length ?? 2,
    title: (match[2] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/[`*_]/g, '')
      .trim()
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'),
  }));
  const ids = uniqueSlugs(all.map((heading) => heading.title));
  return all
    .map((heading, index) => ({ ...heading, id: ids[index] ?? '' }))
    .filter((heading) => heading.level <= 3)
    .map(({ id, title }) => ({ id, title }))
    .concat(entries);
}

function contains(items: readonly DocsNavItem[], href: string): boolean {
  return items.some((item) => item.href === href || contains(item.items ?? [], href));
}

export function searchDocuments(pages: Page[], nav: DocsNavSection[]): DocsSearchDocument[] {
  return pages.map((page) => ({
    id: page.file,
    title: page.frontmatter.title,
    href: page.href,
    group: nav.find((section) => contains(section.items, page.href))?.title ?? 'Docs',
    ...(page.frontmatter.description === undefined
      ? {}
      : { description: page.frontmatter.description }),
    headings: headingsOf(page.body),
    content: plainText(page.body),
  }));
}
