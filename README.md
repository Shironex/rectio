# rectio

A React design library for finance and back-office interfaces: tokens, themes and accessible
components on [Base UI](https://base-ui.com), styled only through design tokens.

Private and unlicensed. Nothing here is published.

## Packages

| Package                | What it is                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@rectio/tokens`       | DTCG token sources, built with Style Dictionary into CSS variables, a Tailwind v4 theme, font faces and resolved JSON                                                                                                                                                                                                                    |
| `@rectio/ui`           | Button, Field and Input, AmountInput, Select, Dialog, Money, ThemeScope, Badge, Checkbox, DataTable, Calendar, DatePicker, DateRangePicker, Toast, and the form set: Switch, RadioGroup, Toggle, Slider, Textarea, InputGroup, SearchInput, NumberField, OtpInput, Combobox, MultiSelect, TagInput, FileUpload, Fieldset and FormSection |
| `@rectio/motion`       | The motion add-on: motioned Button, AmountInput, Money, Dialog, Select popup, DataTable rows, Toast, Switch, ToggleGroup, NumberField, Combobox, MultiSelect and FileUpload, same props as the plain                                                                                                                                     |
| `@rectio/blocks`       | Pro finance blocks built on ui and motion: KPI row, cash flow chart, invoice list and detail, general journal, expense approval, receivables aging, budget vs actual. Plain from `@rectio/blocks`, motioned from `@rectio/blocks/motion`                                                                                                 |
| `@rectio/playground`   | Vite app: every component in every state, both themes, both modes, plus an expense report composition                                                                                                                                                                                                                                    |
| `@rectio/design-rules` | The check that keeps hardcoded design values out of `packages/ui/src`, `packages/motion/src` and `packages/blocks/src` (in `tooling/`)                                                                                                                                                                                                   |
| `@rectio/registry`     | Registry item schema, the build that turns ui and tokens into static registry JSON, a local dev server                                                                                                                                                                                                                                   |
| `@rectio/cli`          | The `rectio` command: `init`, `add`, `diff`, `list`, `search`, `update` (report only for now), `mcp` (read-only MCP server)                                                                                                                                                                                                              |

## Tokens

Three tiers, all in `packages/tokens/src`:

1. **Primitives**: OKLCH colour ramps, sizes, font families, durations, easings. Never emitted.
2. **Semantic**: surface, text, border, accent, status, focus, radius, type, density, shadow and
   motion. Defined per theme and mode; every theme must define the same set (the build fails otherwise).
3. **Component**: button, field, popover, dialog, money, table, calendar, badge and toast values,
   mostly aliases of semantic tokens.

Themes apply with attributes: `data-theme="default" | "ledger"`, `data-mode="light" | "dark"`
(no `data-mode` follows the system), `data-density="compact"`. Reduced motion drops movement and
keeps fades. `ThemeScope` sets these on a subtree and makes popups render inside it.

Tests check the token contract and WCAG contrast of every semantic pair in every theme and mode.

### Themes and fonts

| Theme     | Character                                                  | Fonts (all SIL OFL 1.1)                                                    |
| --------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `default` | Warm stone neutrals, cobalt accent, 4px controls           | IBM Plex Sans, IBM Plex Mono                                               |
| `ledger`  | Green-black ink, citron accent, 2px corners, slower motion | Source Serif 4 (headings), Schibsted Grotesk (UI), IBM Plex Sans (figures) |

Figures are always tabular and lining (`numeric` utility, `Money`). Money uses the true minus sign.

## Motion add-on

`@rectio/motion` exports the same names and props as `@rectio/ui` for the parts that move. An app
picks motion per component by import path, and plain and motioned parts mix in one screen:

```tsx
import { Field, Select, SelectTrigger } from '@rectio/ui';
import { Button, Money, SelectContent } from '@rectio/motion';
```

- **Reduced motion** collapses every motioned component to its plain twin: the system setting,
  `<MotionPreferenceProvider value="off">` for an in-app preference, or a browser without the Web
  Animations API.
- **Tokens only.** Durations, easings, distances and springs (`--rx-motion-spring-*`, damping ratio
  at or near 1, so nothing bounces) are read from the theme at the moment an animation starts.
- **Bundle cost.** Built on `motion/mini` (Web Animations), Motion's spring generator and
  `AnimatePresence` for row exits: about 13.1 kB gzip over the plain components, measured by
  `packages/motion/tests/bundle.test.ts`. An app that imports only `@rectio/ui` pulls in no Motion
  code; the same test checks that.

## Blocks

`@rectio/blocks` holds the pro finance blocks. Each is data-agnostic (typed props in, callbacks
out, no fetching), composed only from `@rectio/ui` and tokens, and has a motioned twin with the
same name and props in `@rectio/blocks/motion`. The money logic of each block (totals, VAT per
rate, running balances, aging buckets, variance, approval moves) is exported beside it, runs in
minor units and is tested in `packages/blocks/tests`. Blocks lay out by their own width with
container queries, so one block works in a full-width row and in half a dashboard. Charts use
Recharts 3, themed through the `chart` token group (series, sequence, grid, axis, tooltip), which
`packages/tokens/tests` checks for contrast and for separation under protan, deutan and tritan
vision; every chart has a table of the same figures and keyboard-reachable tooltips.

The playground's `/?view=blocks` shows a finance dashboard (`&motion=on` for the motioned blocks,
`&block=<name>` for one block, `&locale=pl-PL`, `&density=compact`);
`pnpm --filter @rectio/playground shoot:blocks 3` writes every theme, mode, locale, phone, compact,
reduced motion and keyboard shot to `.rounds/round-3/blocks/`.

The playground's `/?view=motion` puts each plain component beside its motioned one;
`pnpm --filter @rectio/playground shoot:motion 3` writes frame sheets and a video of every
interaction to `.rounds/round-3/motion/`.

The playground's `/?view=forms` shows a workspace settings form built from the form components
(`&motion=on`, `&invalid=1` for the error states, `&density=compact`);
`pnpm --filter @rectio/playground shoot:forms 3` writes desktop and phone shots in every theme and
mode, open popups and the invalid state to `.rounds/round-3/forms/`.

## Templates

`templates/*` holds complete starter apps, the showcase of the kit: each is a standalone Next.js
16 app (`@rectio/template-<name>`, App Router, static export) that imports the workspace packages
while in the repo and becomes the buyer's own project with `rectio init --template <name>`.

| Template         | Category  | What it is                                                                                      |
| ---------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `finance-app`    | app       | A finance back office: overview, invoices, expenses and approvals, journal, reports, settings   |
| `saas-landing`   | marketing | A multi-page marketing site: home, features, pricing, customers, blog, about, contact, legal    |
| `product-launch` | marketing | A single long launch page with a live product board, feature bento, waitlist and FAQ            |
| `docs`           | marketing | A static documentation site from MDX: folder navigation, local search, API reference, changelog |

Each has a `template.json` (name, title, description, category, tier, pages, `uses`, screenshots)
that the registry build, the docs pages and the landing gallery all read, so a new folder appears
everywhere without other changes. Its code lives in `app/`, `components/` and `data/`; kit imports
are named imports from package roots; repo-only lines end in `rectio:workspace`. `pnpm --filter
@rectio/template-<name> shoot` writes the gallery screenshots, `shoot <n>` a design round.

**Live previews.** The site serves every template as its real static build under
`/preview/<name>/`, and `/templates/<name>` frames it in a viewer (page picker, desktop, tablet and
phone widths, both themes and modes). The site's `previews` task (`apps/site/scripts/previews.ts`,
cached by Turborepo on the templates and the kit) builds each template in a scratch copy with
`PREVIEW_BASE_PATH=/preview/<name>`, which the one `basePath` line in its `next.config` reads
(marked `rectio:workspace`, so a buyer's copy has no trace of it); the site build copies the result
into `out/preview/`, marks every page noindex and keeps root-relative `<a>` links inside the
preview. A new template folder gets its preview with no site change, provided it keeps that
`basePath` line, routes through `next/link` or the router (never `location.pathname` into the
router), and keeps its look on `<html>` as `data-theme` and `data-mode` (the viewer sets those).
`pnpm --filter @rectio/site walk-previews` opens every page of every preview and every viewer
headless after a build (`WALK_URL=http://localhost:4350` walks a running dev server instead).

In development, `pnpm --filter @rectio/site dev` builds any preview that is missing (a first run takes
a few minutes, later starts are instant), serves `.previews/` beside next dev and proxies
`/preview/*` to it, so the viewer works as it does on the built site. A running dev server keeps
serving the builds it found: after editing a template or the kit, rebuild them with `pnpm --filter
@rectio/site previews` (or the cached `pnpm turbo run previews --filter=@rectio/site`) and reload.

## The token rule

Components never hardcode colour, radius, font, shadow, duration or easing. In `packages/ui/src`
(and `packages/motion/src`, `packages/blocks/src`) these fail the lint (`rectio/no-hardcoded-design-values`) and the repo check (`harness lint-meta`):

- hex colours and colour functions (`#fff`, `rgb(`, `oklch(`)
- arbitrary Tailwind values (`rounded-[6px]`, `duration-[200ms]`, `[color:red]`)
- Tailwind's own palette, radii, shadows, durations and easings (`bg-slate-900`, `rounded-md`, `duration-200`)
- raw font names, `font-serif`, and `dark:` (dark mode lives in the tokens)
- CSS variables outside `--rx-` (Base UI's geometry variables are allowed)

Use the token utilities instead: `bg-surface`, `text-fg-muted`, `border-line`, `rounded-control`,
`shadow-overlay`, `duration-base`, `ease-enter`, `font-display`, or a component token such as
`h-(--rx-button-height-md)`.

## Running it

Requires Node 22.18 or later and pnpm 10.

```sh
pnpm install
pnpm dev          # builds tokens, starts the playground
pnpm gate         # format, lint, typecheck, test, build, repo rules (noctcore harness)
```

Playground views: `/` is the component matrix, `/?view=app&theme=ledger&mode=dark` is the expense
report in one theme and mode.

Headless screenshots for a design round, written to `.rounds/round-<n>/` (gitignored):

```sh
pnpm --filter @rectio/playground shoot 3
```

## Registry

rectio ships as source: users own the code they add. `packages/registry` turns `packages/ui`,
`packages/tokens` and the motion add-on (`packages/motion`) into a static registry, served as files
today and behind a license server later.

```sh
pnpm --filter @rectio/registry build    # writes packages/registry/dist/registry
pnpm --filter @rectio/registry serve    # http://127.0.0.1:4873, pro items gated by key
```

Layout of `dist/registry`:

| Path                                 | What it holds                                                        |
| ------------------------------------ | -------------------------------------------------------------------- |
| `index.json`                         | Every item: name, type, tier, versions, title, registry dependencies |
| `items/<name>.json`                  | Latest free item, with file contents and hashes                      |
| `items/<name>@<version>.json`        | Immutable copy of one version (the base of a future three-way merge) |
| `pro/items/<name>.json` (and `@ver`) | Pro items: served only with a valid license key                      |
| `schema/{item,index,config}.json`    | JSON Schemas of the item, the index and `rectio.json`                |

**Items.** Types are `component`, `block`, `theme`, `lib`, `hook`, `style` and `template`. An item has a
`tier` (`free` or `pro`), a semver `version`, npm `dependencies`, `registryDependencies`,
`requires` (React range, Tailwind range, token contract), optional `cssVars` token additions, and
`files`, each with `path`, `type`, a `target` through an alias placeholder (`@ui/button.tsx`), the
`content` and its `sha256`. The item `integrity` is `sha256-<base64>` over its canonical JSON. The
schema is zod (`src/schema.ts`); the JSON Schema is generated from it with `z.toJSONSchema`. Field
names match shadcn's registry item where they overlap.

**The build** (`registry.config.ts` lists every item with its tier, version and description):

1. Reads each item's source files and finds every import with the TypeScript scanner.
2. Relative imports become registry imports (`../lib/cn` -> `@registry/lib/cn`) and registry
   dependencies; package imports become npm dependencies with the range from the source
   `package.json`. React is declared in `requires`, not as a dependency.
3. Fails on an import no `package.json` declares, a relative import outside every item, a source
   folder no item lists, a free item that depends on a pro one, or a test file in an item.
4. Adds `'use client'` to `.tsx` files that use a hook, `createContext` or a UI package, for Next.
5. Splits the built token CSS: `tokens` (a `style` item: the Tailwind theme mapping, density,
   reduced motion) and one `theme-<id>` item per theme (its light, dark and system-dark rules plus
   the font imports and font packages it uses). `tokens` depends on `theme-default`, which owns
   `:root`.
6. Normalises line endings to LF, hashes every file and the item, validates against the schema,
   writes the index, the latest and the versioned copies and the JSON Schemas.

Adding a component to `packages/ui/src` fails the registry build until it is listed in
`registry.config.ts`. Bump an item's version whenever its content changes.

**Templates** are a third source, `templates/*` (see [Templates](#templates)). Each folder with a
`template.json` becomes a `template` item: its text files with `@project/<path>` targets, under
`pro/` like every pro item. Imports of `@rectio/ui`, `@rectio/motion`, `@rectio/blocks` (and their
documented subpaths) become registry imports and registry dependencies, as for an add-on; the item
also depends on `tokens` and every theme. Lines ending in `// rectio:workspace` or
`/* rectio:workspace */` are dropped, workspace packages leave `package.json` with the repo-only
`shoot` and `lint` scripts, and `screenshots/`, `scripts/`, `turbo.json` and `template.json` stay
in the repo. The build fails on a file where kit items install (`components/ui/`,
`components/blocks/`, `lib/`, `hooks/`, `styles/rectio/`), an npm import the template's
`package.json` does not declare, a shipped file that still names a workspace package, a missing
screenshot, or a `uses` list in `template.json` that differs from what the template imports.

**The motion add-on** is an add-on tree in the same config: every `packages/motion/src` folder is
a pro item named `motion-<name>` (`motion-core` holds the shared token reader and animator), and
its files install under their own folder (`@ui/motion/dialog.tsx`, `@lib/motion/animate.ts`) so
they sit beside the plain components. An import of `@rectio/ui` is split by the names it takes,
through the package's `index.ts`, into one registry import and one registry dependency per plain
item (`motion-dialog` depends on `dialog` and `cn`); `motion` and other npm packages come from the
imports as for any item. `rectio add motion-dialog` without a key names the pro items and writes
nothing.

**The finance blocks** are a second add-on tree, `packages/blocks/src`, installed under
`finance` (`@blocks/finance/invoice-list.tsx`, `@lib/finance/finance.ts`). Each block is a pro
`block` item with its logic file (`invoice-list`), resting on the shared `blocks-core` lib, and a
`motion-<block>` twin resting on `motion-blocks-core`. Imports of `@rectio/ui` and
`@rectio/motion` become registry dependencies on their items, so `rectio add invoice-list` with a
key also installs the free DataTable, Badge and Money it renders.

## CLI

`packages/cli` builds the `rectio` bin (Node 22.12+, ESM; runtime dependencies are `@rectio/registry`, zod and
`diff`).

```sh
rectio init [--theme ledger] [--css src/index.css] [--framework vite|next|tanstack-start]
            [--force] [--dry-run] [--no-install] [--registry <url|folder>]
rectio init --template finance-app [folder] [--theme ledger] [--force] [--dry-run] [--no-install]
rectio add button dialog money [--overwrite] [--dry-run] [--no-install]
rectio diff dialog
rectio list [--type theme] [--tier pro] [--templates]
rectio search money
rectio update
rectio mcp [--registry <url|folder>]
```

- **init** detects TanStack Start, Next.js or Vite (in that order), requires Tailwind v4 (it stops
  on v3 with the upgrade command), finds the CSS file that imports Tailwind and the import alias
  in `tsconfig.json` (following references and relative `extends`). It writes `rectio.json` and
  installs `tokens`, the chosen theme and `cn`. Without an alias it stops and says what to add.
  `--framework` names the framework when detection fails, `--force` rewrites an existing
  `rectio.json`, `--dry-run` prints the plan and writes nothing, and `--no-install` leaves the
  package manager alone. A non-default theme prints one note: set `data-theme` on `<html>`.
- **init --template** creates a new Next.js project from a template in `[folder]` (default: the
  template name; it must be empty unless `--force`). It resolves the template and every kit item
  it uses, checks the license key (templates are pro) and fetches and verifies everything before
  the first write, then writes the template, a `rectio.json` with `@/` aliases and installs the kit
  items through the same path as `add` (lockfile, CSS entry block, package.json, install). The
  template's own files are the buyer's and are not in the lockfile. `add` refuses a template.
- **add** resolves the dependency graph from the index (cycles and unknown items are named),
  fetches every item, checks its schema and integrity, plans every write, and only then writes.
  A file the user edited since rectio wrote it stops the whole add (nothing written) unless
  `--overwrite`. Imports are rewritten to the project's aliases; theme and style CSS is imported
  from the CSS entry in a managed block (default theme, other themes, then styles). Missing
  packages are added to `package.json` (ranges already there win) and installed with the package
  manager of the nearest lockfile (pnpm, npm, yarn or bun).
- **rectio.lock.json** records each item's version, tier, integrity and the sha256 of every file
  as written. CRLF checkouts compare equal, so Windows and macOS agree on what is edited.
- **diff** prints a unified patch from the local file to the latest registry version and marks
  files edited since install.
- **Registry URL:** `--registry`, then `RECTIO_REGISTRY_URL`, then `rectio.json`, then
  `https://rectio.dev/r` (a placeholder until the hosted registry exists). A plain folder or a
  `file://` URL works for development, as does the dev server.
- **Pro items** need a key from `RECTIO_LICENSE_KEY` or `{"licenseKey": "..."}` in `auth.json` in
  the user config folder (`$XDG_CONFIG_HOME/rectio` or `~/.config/rectio`, `%APPDATA%\rectio` on
  Windows). Without one, `add` names the pro items and writes nothing. The key is sent as
  `Authorization: Bearer` to `pro/` paths only and never stored in the project. A local folder
  registry does not check keys.

Tests: unit tests for the schema, the build, graph resolution, detection and the CSS entry;
command tests against a built registry; an HTTP test against the dev server; and an end-to-end
test (`tests/vite-app.e2e.test.ts`) that creates a Vite + React + Tailwind v4 app in a temp
folder, runs `init` and `add button dialog money` with the built CLI, then the app's `tsc` and
`vite build`. It installs real packages with pnpm, so it needs the network on a cold store.

### MCP server

`rectio mcp` runs a read-only [MCP](https://modelcontextprotocol.io) server on stdio, so a coding
agent can look up rectio items, tokens and source instead of guessing. It lives in the CLI package
(`src/mcp`, built on `@modelcontextprotocol/sdk` 1.x) and reuses the registry client, the
`rectio.json` and `--registry` lookup and the license key lookup (`RECTIO_LICENSE_KEY`, then
`auth.json`). One install covers both. It never writes files: `get_add_command` returns the command.

| Tool              | Use it to                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `list_items`      | See what exists, filtered by `type` and `tier`                                               |
| `search_items`    | Find items by words in name, title, categories and description                               |
| `get_item`        | Read one item: description, versions, what installs with it, npm packages, files             |
| `get_item_source` | Read the source of an item (or one file); imports use your aliases when `rectio.json` exists |
| `get_tokens`      | Get token names and values of a theme and mode, with the Tailwind utility for each           |
| `get_docs`        | Get an item's usage notes and exports, or the general rules without an item                  |
| `get_add_command` | Get the exact `rectio add ...` command, with what else it installs and the key it needs      |

Pro items: `get_item` shows metadata only, and `get_item_source`, `get_docs` and `get_tokens` for a
pro item return a message that says how to get a key and no source, until a key is configured. The
key is never printed. Give the server its key in the `env` of its config (below) or in `auth.json`.

Add it to a project (use `cmd /c rectio mcp` as the command on native Windows if the editor cannot
start `.cmd` shims):

```sh
# Claude Code: writes .mcp.json for the project (drop --scope project for just you)
claude mcp add rectio --scope project -- rectio mcp
claude mcp add rectio --scope project -e RECTIO_LICENSE_KEY=<key> -- rectio mcp   # with a pro key
```

```jsonc
// Claude Code: .mcp.json   Cursor: .cursor/mcp.json
{
  "mcpServers": {
    "rectio": {
      "command": "rectio",
      "args": ["mcp"],
      "env": { "RECTIO_LICENSE_KEY": "<key>" }, // optional, pro items only
    },
  },
}
```

```jsonc
// VS Code: .vscode/mcp.json (the key is asked once and kept out of the file)
{
  "inputs": [
    {
      "id": "rectio-key",
      "type": "promptString",
      "description": "rectio license key",
      "password": true,
    },
  ],
  "servers": {
    "rectio": {
      "type": "stdio",
      "command": "rectio",
      "args": ["mcp"],
      "env": { "RECTIO_LICENSE_KEY": "${input:rectio-key}" },
    },
  },
}
```

Do not commit a real key: keep the `env` block out of shared config, or use `auth.json`. The server
runs in the project folder the editor opens, which is where it finds `rectio.json`. Point it at a
local registry with `"args": ["mcp", "--registry", "../rectio/packages/registry/dist/registry"]`.

### Windows checklist

The CLI is written for Windows (path separators, `%APPDATA%`, `.cmd` shims, CRLF checkouts) but
its tests run on macOS and Linux. Before a release, on a Windows machine with Node 22.18+ and
pnpm 10, in PowerShell:

```powershell
git config --global core.autocrlf true      # the setting most Windows checkouts use
pnpm install
pnpm --filter @rectio/registry build
pnpm --filter @rectio/cli build
pnpm --filter @rectio/cli test              # unit, command, HTTP and MCP tests
pnpm --filter @rectio/cli exec vitest run tests/vite-app.e2e.test.ts
```

Then by hand, in a fresh Vite app (`pnpm create vite@latest demo -- --template react-ts`, add
Tailwind v4 and an `@/*` path alias), with the built bin
(`node <repo>\packages\cli\dist\bin.js`):

1. `init` writes `rectio.json` with forward slashes, and the CSS entry block uses `./` imports.
2. `add button dialog money` runs `pnpm install` through the `.cmd` shim, then `pnpm exec tsc -b`
   and `pnpm exec vite build` pass.
3. Run `git add -A; git commit -m x`, let autocrlf turn the files into CRLF, then
   `rectio add button`: it says the item is up to date (no false "edited" stop), and `rectio diff
button` prints no patch.
4. After `add`, `src\index.css` and `package.json` keep their CRLF endings (`git diff` shows only
   the added lines).
5. `$env:RECTIO_LICENSE_KEY = $null; rectio add motion-dialog` names the pro items and writes
   nothing; with `%APPDATA%\rectio\auth.json` holding `{"licenseKey": "..."}` it installs.
6. `rectio mcp` starts over stdio from an editor's MCP config (`"command": "rectio"`).

### update: the plan

`rectio update` reports items with a newer version and stops. The merge it will do:

1. For each outdated item, fetch the exact locked version (`items/<name>@<version>.json`, the
   base), the latest (theirs), and read the local file (ours), all rewritten to the project's
   aliases.
2. Files the user never edited (local sha256 equals the locked one) are replaced outright.
3. Edited files get a three-way merge with `diff3` semantics (a small dependency such as
   `node-diff3`, or `git merge-file` when git is present). Clean merges are written; conflicts get
   standard markers and are listed, and the command exits non-zero.
4. Before writing, the previous files go to `.rectio/backup/<timestamp>/` so `rectio update
--abort` restores them. Files new in the latest version are created; files it dropped are
   reported, not deleted.
5. The lock moves to the new version only for items that merged cleanly; a per-version
   `changelog` field (to add to the schema) is printed for breaking changes.

Until then: `rectio diff <item>`, then `rectio add <item> --overwrite`.

### Choices made where the design left options

- **zod 4** over valibot: one schema gives the runtime check and, through `z.toJSONSchema`, the
  published JSON Schema.
- **`node:util` parseArgs** over citty or commander, and no prompt library: zero dependencies;
  every choice is a flag, so the CLI is scriptable and the MCP can call the same functions
  (`@rectio/cli` exports them).
- **Imports parsed with `ts.preProcessFile`** (the TypeScript scanner), not a full AST or oxc.
- **Relative imports in source** stay as they are (`packages/ui` is not changed); the build maps
  them to the canonical `@registry/<alias>/<name>` form that the CLI rewrites.
- **Flat targets:** `button/button.tsx` installs as `@ui/button.tsx`; the build fails on a clash.
- **Theme items reuse the token build output** (split per `data-theme` selector) instead of
  re-deriving CSS, so registry themes always match what the playground shows.
- **Dependencies are written to `package.json`, then `<manager> install` runs with no
  arguments**: no version ranges pass through a shell, which keeps Windows `.cmd` shims safe.
- **Pro bodies live under `pro/`** in the same tree, so a static host can serve the free tier and
  the license Worker only has to guard one prefix.
- **`--key` flag left out:** keys in shell history leak; env and `auth.json` only.
- **No `--yes`/interactive mode yet**, no `login` command (it needs the license server).
- **CLI license key file** is `auth.json` with `licenseKey`; seats and instance ids wait for the
  license server.
