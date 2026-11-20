# Docs template

A documentation site built from MDX files: a home page, docs pages with navigation from the folders, local search, code highlighted at build time, API reference pages, a changelog, and a light and dark switch. It is a plain Next.js app with a static export, so it deploys to any static host.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static site in out/
```

## Where things live

| Path                            | What it holds                                                       |
| ------------------------------- | ------------------------------------------------------------------- |
| `content/docs/`                 | The pages, one `.mdx` file each                                     |
| `content/changelog.ts`          | The releases on `/changelog`                                        |
| `data/site.ts`                  | Product name, header links, versions, languages, the edit link      |
| `components/mdx-components.tsx` | The components a page can use without an import                     |
| `lib/`                          | Reading the content, the sidebar, highlighting and the search index |
| `app/`                          | The routes: `/`, `/docs/...`, `/changelog` and `/search-index.json` |

## Add a page

Create a file under `content/docs/`. Its path is its URL:

| File                                          | URL                       |
| --------------------------------------------- | ------------------------- |
| `content/docs/(guides)/retries.mdx`           | `/docs/retries`           |
| `content/docs/(guides)/deploy/index.mdx`      | `/docs/deploy`            |
| `content/docs/(guides)/deploy/containers.mdx` | `/docs/deploy/containers` |

Every page starts with frontmatter:

```mdx
---
title: Retries and backoff
description: One sentence under the title, also used by search engines.
badge: New # optional: a word in the sidebar and beside the title
navTitle: Retries # optional: a shorter title for the sidebar
updated: 2026-11-04 # optional: shown as "Last updated"
toc: false # optional: hide "On this page"
hidden: true # optional: build the page but leave it out of the sidebar
---
```

The page appears in the sidebar, the previous and next links, and search on the next build.

## Organise the sidebar

- A folder in parentheses, such as `(guides)`, is a sidebar section. It adds nothing to the URL.
- Any other folder is a group that opens and closes. Its `index.mdx`, if there is one, is the group's own page.
- A `meta.json` in a folder sets the order of its pages and, for sections and groups, a title and a badge:

```json
{
  "title": "Guides",
  "pages": ["retries", "schedules", "deploy"]
}
```

Pages left out of `pages` follow in alphabetical order, so a new page never disappears.

## Write a page

Markdown works as usual, including tables and task lists. Code fences are highlighted at build time, and their meta line adds a title, highlighted lines, line numbers or a diff:

````mdx
```ts title="src/queue.ts" {2,4-5} showLineNumbers

```

```ts diff
-  retries: 3,
+  retries: 5,
```
````

These components work in any page without an import:

| Component                                                           | Use it for                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `<Callout type="warning" title="...">` (note, tip, warning, danger) | Something the reader must not miss                                      |
| `<Steps>` and `<Step title="...">`                                  | A numbered procedure                                                    |
| `<InstallTabs command="npm install x" />`                           | A command shown for npm, pnpm, yarn and bun, with the choice remembered |
| `<CodeTabs items={[...]} />`                                        | The same example in several languages or files                          |
| `<FileTree entries={[...]} />`                                      | A folder structure                                                      |
| `<PropsTable rows={[...]} />`                                       | Options or props with types and defaults                                |
| `<SignatureCard name signature params returns />`                   | A function or method                                                    |
| `<Endpoint method path responses />`                                | An HTTP endpoint                                                        |
| `<LinkCards items={[...]} />`                                       | Links to the next pages                                                 |
| `<Badge>`, `<Kbd>`, `<KbdShortcut shortcut="mod+k" />`              | Inline labels and keys                                                  |

To add your own, export it from a client module (see `components/blocks.ts`) and add it to `components/mdx-components.tsx`.

## Change the theme

The template ships with the rectio default theme in light and dark. Readers switch the mode with the menu in the header, and their choice is remembered.

- **Your own colours, type and corners:** every colour, size and radius is a design token in `styles/rectio/`. Edit or add a theme there, or override the variables in `app/globals.css`:

```css
[data-theme='default'] {
  --rx-accent: oklch(0.55 0.2 260);
}
```

- **Code colours** come from the `code` token group (`--rx-code-token-keyword`, `--rx-code-token-string` and so on), defined for both modes, so code follows the mode switch with no highlighter in the browser.

## Search

`app/search-index.json/route.ts` writes `out/search-index.json` at build time: every page's title, headings and text. The search box loads it on the first keystroke. To use a hosted search service instead, replace the provider in `components/search.tsx`; the dialog takes any function that returns results for a query.

## Feedback

"Was this page helpful?" only thanks the reader until you set `collectFeedback: true` in `data/site.ts` and point `components/feedback.tsx` at your endpoint.

## Screenshots

`pnpm shoot` captures the gallery images in `screenshots/` from the static build, headless.
