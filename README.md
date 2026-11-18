# rectio

A React design library for finance and back-office interfaces: tokens, themes and accessible
components on [Base UI](https://base-ui.com), styled only through design tokens.

Private and unlicensed. Nothing here is published.

## Packages

| Package                | What it is                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@rectio/tokens`       | DTCG token sources, built with Style Dictionary into CSS variables, a Tailwind v4 theme, font faces and resolved JSON |
| `@rectio/ui`           | Button, Field and Input, AmountInput, Select, Dialog, Money, ThemeScope                                               |
| `@rectio/playground`   | Vite app: every component in every state, both themes, both modes, plus an expense report composition                 |
| `@rectio/design-rules` | The check that keeps hardcoded design values out of `packages/ui/src` (in `tooling/`)                                 |

## Tokens

Three tiers, all in `packages/tokens/src`:

1. **Primitives**: OKLCH colour ramps, sizes, font families, durations, easings. Never emitted.
2. **Semantic**: surface, text, border, accent, status, focus, radius, type, density, shadow and
   motion. Defined per theme and mode; every theme must define the same set (the build fails otherwise).
3. **Component**: button, field, popover, dialog and money values, mostly aliases of semantic tokens.

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
