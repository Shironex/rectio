# Contributing to rectio

Thanks for wanting to help. rectio is a solo project, and every bug report, request and pull request
makes it better. Pull requests for new components, blocks and templates are welcome straight away:
open an issue first if you want to agree on the shape before you build, or just send the PR.

This file covers the setup, where things live, how to add an item, the rules every change follows
and the design bar. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) goes deeper into the registry, the
CLI and the live previews.

## Setup

You need Node 22.18 or later and pnpm 10 (the exact version is in `packageManager` in
`package.json`; `corepack enable` picks it up). Everything works the same on macOS, Linux and
Windows.

```sh
git clone https://github.com/Shironex/rectio.git
cd rectio
pnpm install
pnpm dev          # builds the tokens, starts the playground
pnpm gate         # format, lint, typecheck, test, build and the repo rules, as CI runs them
```

| Command                                     | What it does                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                                  | The playground (Vite): every component in every state, light and dark        |
| `pnpm --filter @rectio/site dev`            | The docs site with the live template previews (a first run builds them)      |
| `pnpm --filter @rectio/site previews`       | Rebuilds the template previews after you changed a template or the kit       |
| `pnpm --filter @rectio/site build`          | The static site in `apps/site/out`, previews and registry included           |
| `pnpm --filter @rectio/site walk-previews`  | Opens every page of every preview headless after a build and reports errors  |
| `pnpm --filter @rectio/registry build`      | The static registry in `packages/registry/dist/registry`                     |
| `pnpm --filter @rectio/template-<name> dev` | One template as a normal Next.js app                                         |
| `pnpm gate`                                 | The full local gate: run it before you open a PR                             |

While you work, a filtered check is enough:
`pnpm turbo run typecheck test --filter=@rectio/ui` (or the package you touched).

The site builds under a base path when `SITE_BASE_PATH` is set: `SITE_BASE_PATH=/rectio pnpm
--filter @rectio/site build` builds what GitHub Pages serves, and `SITE_BASE_PATH=/rectio pnpm
--filter @rectio/site preview` serves it at `http://127.0.0.1:4321/rectio/`. In PowerShell, set the
variable first: `$env:SITE_BASE_PATH = '/rectio'`.

## Where things live

| Path                   | What it is                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/tokens`      | DTCG token sources, built with Style Dictionary into CSS variables and a Tailwind v4 theme (`--rx-*`)  |
| `packages/ui`          | The components, one folder each (`src/<name>/<name>.tsx` and its test), on Base UI primitives          |
| `packages/motion`      | The motion add-on: motioned twins with the same names and props as the plain components                |
| `packages/blocks`      | The blocks: finance at the top level, then `saas/`, `marketing/` and `docs/`, each with a motion twin  |
| `packages/registry`    | The item schema, `registry.config.ts` (every item) and the build that writes the static registry       |
| `packages/cli`         | The `rectio` CLI (`init`, `add`, `diff`, `list`, `search`, `update`) and the MCP server (`rectio mcp`) |
| `templates/*`          | Whole Next.js apps built from the kit, each with a `template.json`                                     |
| `apps/playground`      | The Vite gallery and the headless screenshot scripts for design rounds                                 |
| `apps/site`            | The docs site and landing (Fumadocs on Next.js, static export), with the live template previews        |
| `tooling/design-rules` | The lint rule that keeps hardcoded design values out of the kit                                        |
| `.noctcore`            | The gate config and the repo rules `pnpm gate` runs                                                    |

## Adding a component

1. **Source.** Create `packages/ui/src/<name>/<name>.tsx` and export it from `packages/ui/src/index.ts`.
   Read two existing components first (`select` and `dialog` are good ones) and match their shape:
   Base UI primitives with the `render` prop (not `asChild`), `cn` for class names, token utilities
   only.
2. **Tests.** `packages/ui/src/<name>/<name>.test.tsx` with Vitest and Testing Library: behaviour,
   keyboard, labels, the states that matter. Look at the neighbours for the style.
3. **Registry.** Add an entry to `packages/registry/registry.config.ts`. The registry build fails until
   every folder in `packages/ui/src` is listed, so you cannot forget it. Bump an item's `version`
   whenever its published content changes: versioned copies are immutable.
4. **Docs.** A page at `apps/site/content/docs/components/<name>.mdx` (copy `switch.mdx` for the
   shape: preview, install, usage, props, accessibility, source), a demo in
   `apps/site/demos/<name>.tsx` registered in `apps/site/demos/index.ts`, and the page added to
   `apps/site/content/docs/components/meta.json`.
5. **Playground.** Add it to the gallery so the shoot scripts capture it.
6. **Motion twin**, where movement helps (opening, reordering, a value that changes): a folder in
   `packages/motion/src` with the same names and props, an entry through `motionItem` in
   `registry.config.ts`, and `apps/site/demos/<name>.motion.tsx` for the docs preview. Keep the add-on
   under its bundle cap (`packages/motion/tests/bundle.test.ts`).

## Adding a block

Blocks live in `packages/blocks/src` (finance) or its `saas/`, `marketing/` and `docs/` families.
Each has a `<name>.logic.ts` with the pure logic and its tests, a plain `<name>.tsx`, a
`<name>.motion.tsx` twin, typed props and callbacks (no fetching), and an empty state. Register it in
`registry.config.ts` with the family's helper (`blockItems`, `saasItems` and the others), add a docs
page under `apps/site/content/docs/blocks` and demos for both variants. `invoice-list` is a good
block to read first.

## Adding a template

A template is a folder in `templates/` with a complete Next.js app, a `template.json` (name, title,
description, category, pages, `uses`, screenshots) and a `shoot` script for its screenshots. Copy an
existing template for the setup. The registry, the docs pages, the templates gallery and the live
preview all read `template.json`, so the new folder shows up everywhere with no site change, as long
as the template:

- keeps the `basePath: process.env.PREVIEW_BASE_PATH ?? ''` line in its `next.config`, marked
  `rectio:workspace` (the copy a user installs drops it);
- imports the kit from package roots and documented subpaths only;
- routes through `next/link` or the router, and keeps its look on `<html>` as `data-theme` and
  `data-mode`;
- lists in `uses` exactly the kit items it imports (the registry build checks it).

Then run `pnpm --filter @rectio/site build` and `pnpm --filter @rectio/site walk-previews`.

## The rules

- **Tokens only.** No hardcoded colours, radii, fonts, shadows, durations or easings in
  `packages/ui`, `packages/motion` or `packages/blocks`: no hex or `oklch()`, no arbitrary Tailwind
  values, no Tailwind palette or radius classes, no `dark:`. Use the token utilities (`bg-surface`,
  `text-fg-muted`, `rounded-control`, `duration-base`, `ease-enter`). If a value is missing, add a
  semantic token in `packages/tokens` for every theme and mode. The lint rule and the repo check
  both enforce it.
- **Accessibility.** Correct roles and labels, a complete keyboard path, a visible focus ring, 44px
  targets on coarse pointers, meaning never carried by colour alone, reduced motion respected.
- **Motion.** UI durations stay under about 300 ms, enters ease out and exits are faster, nothing
  scales from zero, no height animation, and every animation can be interrupted.
- **Commits.** Small conventional commits, `type(scope): lowercase summary`, with a scope from
  `commitlint.config.js`: `repo`, `tokens`, `ui`, `playground`, `motion`, `blocks`, `registry`,
  `cli`, `mcp`, `ci`, `docs`, `site`, `templates`. The commit hook runs lint and prettier on what
  you staged.
- **Writing.** Plain words, short sentences, no em or en dashes in copy, comments, docs or commits.

## The design bar

Every visual change goes through design rounds before it lands: fresh headless screenshots at
desktop (1440) and phone (390) width, light and dark, then a scored critique (out of 40) and an audit (out of 20), fix, and capture again. The bar is 32/40 and 18/20. Put the scores and
the final screenshots in your PR.

The screenshot scripts write to `.rounds/` (gitignored) and never touch your screen:

```sh
pnpm --filter @rectio/playground shoot 1          # the component matrix
pnpm --filter @rectio/playground shoot:blocks 1   # the blocks dashboard, every mode
pnpm --filter @rectio/playground shoot:motion 1   # frame sheets of every motioned interaction
pnpm --filter @rectio/site shoot 1                # the site, after a site build
pnpm --filter @rectio/template-<name> shoot 1     # a template's design round
```

The playground also has `shoot:forms`, `shoot:nav`, `shoot:display`, `shoot:marketing` and
`shoot:docs`. Playwright needs Chromium once: `pnpm --filter @rectio/playground exec playwright
install chromium`.

## Releasing

Only `@rectio/cli` is published to npm; every other package is private. A change to the CLI that
should ship carries a changeset: run `pnpm changeset`, pick the bump and write one line for the
changelog. On main, the release workflow collects changesets into a "Version Packages" pull request,
and merging it publishes the new version to npm with provenance.

## Pull requests

Fill in the PR template: what changed, the checklist, and screenshots in light and dark, both themes,
desktop and phone. `pnpm gate` must pass; CI runs the same gate. I review every PR myself, so it may
take a few days.

Questions go to [Discussions](https://github.com/Shironex/rectio/discussions). Everyone taking part
follows the [Code of Conduct](CODE_OF_CONDUCT.md). Report a vulnerability privately, as
[SECURITY.md](SECURITY.md) describes.
