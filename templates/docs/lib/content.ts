/**
 * Reads the pages in content/docs at build time. Every `.mdx` file is a page and its path is its
 * URL: `guides/retries.mdx` is `/docs/guides/retries`, and an `index.mdx` is its folder's page.
 * A folder in parentheses, such as `(get-started)`, is a sidebar section and adds nothing to the
 * URL. An optional `meta.json` in any folder sets its title, its badge and the order of its pages.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import type { DocsNavItem, DocsNavSection } from '@rectio/blocks/docs';
import { parse as parseYaml } from 'yaml';

export const CONTENT_DIR = join(process.cwd(), 'content', 'docs');

export interface Frontmatter {
  title: string;
  description?: string;
  /** A small word in the sidebar and beside the title, such as "New" or "Beta". */
  badge?: string;
  /** The date of the last meaningful edit, as YYYY-MM-DD. */
  updated?: string;
  /** Leave the page out of the sidebar; it still builds and can be linked. */
  hidden?: boolean;
  /** Set to false to drop the "On this page" column. */
  toc?: boolean;
  /** The sidebar title when it should be shorter than the page title. */
  navTitle?: string;
}

export interface Page {
  /** URL segments under /docs: [] for the docs index. */
  slug: string[];
  href: string;
  /** The file, relative to content/docs, for "Edit this page". */
  file: string;
  frontmatter: Frontmatter;
  /** The MDX body without its frontmatter. */
  body: string;
}

interface Meta {
  title?: string;
  badge?: string;
  /** File and folder names without extensions, in sidebar order. Unlisted ones follow by name. */
  pages?: string[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(source: string): { data: Record<string, unknown>; body: string } {
  const match = FRONTMATTER.exec(source);
  if (match === null) return { data: {}, body: source };
  const data: unknown = parseYaml(match[1] ?? '');
  return {
    data: typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {},
    body: source.slice(match[0].length),
  };
}

function readFrontmatter(data: Record<string, unknown>, file: string): Frontmatter {
  const text = (key: string) => (typeof data[key] === 'string' ? data[key] : undefined);
  const title = text('title');
  if (title === undefined) throw new Error(`content/docs/${file} needs a title in its frontmatter`);
  const updated =
    data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : text('updated');
  return {
    title,
    ...(text('description') === undefined ? {} : { description: text('description') }),
    ...(text('badge') === undefined ? {} : { badge: text('badge') }),
    ...(text('navTitle') === undefined ? {} : { navTitle: text('navTitle') }),
    ...(updated === undefined ? {} : { updated }),
    ...(data.hidden === true ? { hidden: true } : {}),
    ...(data.toc === false ? { toc: false } : {}),
  } as Frontmatter;
}

const isGroup = (name: string) => /^\(.+\)$/.test(name);

function readMeta(dir: string): Meta {
  const file = join(dir, 'meta.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Meta) : {};
}

/** "deploy-targets" becomes "Deploy targets". */
function titleFromName(name: string): string {
  const words = name.replace(/^\(|\)$/g, '').replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The folder's entries in the order its meta.json gives, the rest after them by name. */
function ordered(dir: string, meta: Meta): string[] {
  const names = readdirSync(dir)
    .filter((name) => !name.startsWith('.') && name !== 'meta.json')
    .filter((name) => name.endsWith('.mdx') || statSync(join(dir, name)).isDirectory())
    .map((name) => name.replace(/\.mdx$/, ''))
    .sort((a, b) => (a === 'index' ? -1 : b === 'index' ? 1 : a.localeCompare(b)));
  const listed = (meta.pages ?? []).filter((name) => names.includes(name));
  return [...listed, ...names.filter((name) => !listed.includes(name))];
}

function walk(dir: string, segments: string[], pages: Page[]) {
  for (const name of ordered(dir, readMeta(dir))) {
    const path = join(dir, name);
    if (existsSync(`${path}.mdx`)) {
      const file = relative(CONTENT_DIR, `${path}.mdx`).split(sep).join('/');
      const { data, body } = splitFrontmatter(readFileSync(`${path}.mdx`, 'utf8'));
      const slug = name === 'index' ? segments : [...segments, name];
      pages.push({
        slug,
        href: slug.length === 0 ? '/docs' : `/docs/${slug.join('/')}`,
        file,
        frontmatter: readFrontmatter(data, file),
        body,
      });
    } else {
      walk(path, isGroup(name) ? segments : [...segments, name], pages);
    }
  }
}

let cache: Page[] | undefined;

/** Every page, in sidebar order. Read once per build. */
export function getPages(): Page[] {
  if (cache !== undefined && process.env.NODE_ENV === 'production') return cache;
  const pages: Page[] = [];
  walk(CONTENT_DIR, [], pages);
  const seen = new Map<string, string>();
  for (const page of pages) {
    const clash = seen.get(page.href);
    if (clash !== undefined) throw new Error(`${clash} and ${page.file} are both ${page.href}`);
    seen.set(page.href, page.file);
  }
  cache = pages;
  return pages;
}

export function getPage(slug: readonly string[]): Page | undefined {
  return getPages().find((page) => page.slug.join('/') === slug.join('/'));
}

const fileOf = (path: string) => relative(CONTENT_DIR, path).split(sep).join('/');

/** One sidebar entry: a page, or a folder as a group led by its index page. */
function navItem(
  dir: string,
  name: string,
  segments: string[],
  byFile: Map<string, Page>,
): DocsNavItem | null {
  const path = join(dir, name);
  if (existsSync(`${path}.mdx`)) {
    const page = byFile.get(fileOf(`${path}.mdx`));
    if (page === undefined || page.frontmatter.hidden === true) return null;
    return {
      title: page.frontmatter.navTitle ?? page.frontmatter.title,
      href: page.href,
      ...(page.frontmatter.badge === undefined ? {} : { badge: page.frontmatter.badge }),
    };
  }
  const meta = readMeta(path);
  const index = byFile.get(fileOf(join(path, 'index.mdx')));
  return {
    title:
      meta.title ?? index?.frontmatter.navTitle ?? index?.frontmatter.title ?? titleFromName(name),
    ...(index === undefined ? {} : { href: index.href }),
    ...((meta.badge ?? index?.frontmatter.badge) === undefined
      ? {}
      : { badge: meta.badge ?? index?.frontmatter.badge }),
    items: navItems(path, isGroup(name) ? segments : [...segments, name], byFile),
  };
}

function navItems(dir: string, segments: string[], byFile: Map<string, Page>): DocsNavItem[] {
  return ordered(dir, readMeta(dir))
    .filter((name) => name !== 'index')
    .map((name) => navItem(dir, name, segments, byFile))
    .filter((item): item is DocsNavItem => item !== null);
}

/**
 * The sidebar: each `(section)` folder at the top of content/docs is a titled section, led by its
 * index page when it has one. Pages and plain folders outside a section form an untitled section
 * first. Folders inside become groups that open and close.
 */
export function getNav(): DocsNavSection[] {
  const byFile = new Map(getPages().map((page) => [page.file, page]));
  const loose: DocsNavItem[] = [];
  const sections: DocsNavSection[] = [];
  const pageItem = (page: Page | undefined): DocsNavItem[] =>
    page === undefined || page.frontmatter.hidden === true
      ? []
      : [{ title: page.frontmatter.navTitle ?? page.frontmatter.title, href: page.href }];
  for (const name of ordered(CONTENT_DIR, readMeta(CONTENT_DIR))) {
    if (name === 'index') {
      loose.push(...pageItem(byFile.get('index.mdx')));
    } else if (isGroup(name)) {
      const path = join(CONTENT_DIR, name);
      sections.push({
        title: readMeta(path).title ?? titleFromName(name),
        items: [...pageItem(byFile.get(`${name}/index.mdx`)), ...navItems(path, [], byFile)],
      });
    } else {
      const item = navItem(CONTENT_DIR, name, [], byFile);
      if (item !== null) loose.push(item);
    }
  }
  return loose.length > 0 ? [{ items: loose }, ...sections] : sections;
}
