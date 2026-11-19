# rectio

A React design library for finance and back-office interfaces: tokens, themes and accessible
components on [Base UI](https://base-ui.com), styled only through design tokens.

Private and unlicensed. Nothing here is published.

## Packages

| Package                | What it is                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@rectio/tokens`       | DTCG token sources, built with Style Dictionary into CSS variables, a Tailwind v4 theme, font faces and resolved JSON                             |
| `@rectio/ui`           | Button, Field and Input, AmountInput, Select, Dialog, Money, ThemeScope, Badge, Checkbox, DataTable, Calendar, DatePicker, DateRangePicker, Toast |
| `@rectio/playground`   | Vite app: every component in every state, both themes, both modes, plus an expense report composition                                             |
| `@rectio/design-rules` | The check that keeps hardcoded design values out of `packages/ui/src` (in `tooling/`)                                                             |
| `@rectio/registry`     | Registry item schema, the build that turns ui and tokens into static registry JSON, a local dev server                                            |
| `@rectio/cli`          | The `rectio` command: `init`, `add`, `diff`, `list`, `search`, `update` (report only for now)                                                     |

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

## The token rule

Components never hardcode colour, radius, font, shadow, duration or easing. In `packages/ui/src`
these fail the lint (`rectio/no-hardcoded-design-values`) and the repo check (`harness lint-meta`):

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

rectio ships as source: users own the code they add. `packages/registry` turns `packages/ui` and
`packages/tokens` into a static registry, served as files today and behind a license server later.

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

**Items.** Types are `component`, `block`, `theme`, `lib`, `hook` and `style`. An item has a
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

## CLI

`packages/cli` builds the `rectio` bin (Node 22.12+, ESM; runtime dependencies are `@rectio/registry`, zod and
`diff`).

```sh
rectio init [--theme ledger] [--css src/index.css] [--registry <url|folder>]
rectio add button dialog money [--overwrite] [--dry-run] [--no-install]
rectio diff dialog
rectio list [--type theme] [--tier pro]
rectio search money
rectio update
```

- **init** detects TanStack Start, Next.js or Vite (in that order), requires Tailwind v4 (it stops
  on v3 with the upgrade command), finds the CSS file that imports Tailwind and the import alias
  in `tsconfig.json` (following references and relative `extends`). It writes `rectio.json` and
  installs `tokens`, the chosen theme and `cn`. Without an alias it stops and says what to add.
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
