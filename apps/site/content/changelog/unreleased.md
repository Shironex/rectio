---
title: Coming next
summary: Work that is merging into main now and ships with the next release.
---

## Kit

- `LinkProvider` sends every link the components and blocks draw through your router, so they
  change pages on the client and follow its base path. `Anchor` is the same link for your own code.
- Every component imports from a React Server Component: client modules say `'use client'`, and the
  plain helpers and class strings run on the server.
- The sign in, sign up and two-factor links reach 44px on touch screens.
- A sessions block: where the account is signed in, this device marked, sign out one session or all
  the others.
- The DataTable searches and filters: a search box, column filters with counts, a row count while
  filtered and an empty state that clears the filters.
- Sheet takes a `full` size for whole-screen panels.
- The KPI row writes counts, durations and currency as well as money and percentages.
- The FAQ block draws its questions with the kit Accordion.
- `SegmentedControl`: the toggle group driven by a list of options and one value, with counts on
  options and two even columns on a phone. The motion indicator now glides on both axes. Block
  filters use it in place of their own control.
- `AlertDialog` for destructive confirms: it opens on the safe answer, and its action waits for a
  promise before closing.
- `Drawer`: a side panel on wide screens and a bottom sheet with snap points on phones. The sheet
  backdrop thins as a bottom sheet is dragged down.
- `CopyButton` with a spoken copied state and a fallback where the clipboard API is blocked, and
  `copyToClipboard` for menus.
- `Rating` on radios with optional half stars, and `RatingDisplay` for a score that is only read.
- `Tree` with the full tree keyboard pattern, single or multiple selection, branches that load
  when opened, and `useTreeChildren` to reload them.
- Resizable panels with keyboard handles, size limits and a layout kept per browser.
- `ScrollArea` takes `focusableViewport={false}` when its content holds the focus itself.
- Focus rings show again on the scroll area viewport, tab panels and scrollable code blocks, and
  a lint rule catches a class list whose ring would draw nothing.

## Templates

- Every template sends its links through the link provider, so the live previews under
  `/preview/<name>/` follow their base path with no prefix in the data.
- The SaaS admin template has a page for an address that does not exist.

## Themes

- Graphite becomes the new default dark mode.
- The ledger theme retires and lives on as a theme generator preset.
- `theme-ledger` leaves the registry after one release marked deprecated. Projects that installed
  it keep their file; for a new project, make the look from the ledger preset in the theme
  generator.

## CLI

- `rectio init` asks its questions interactively.
- `rectio add '<theme link>'` installs a theme made in the theme generator. The link holds the whole
  theme, so nothing is fetched from it; `rectio diff` and `rectio update` rebuild the theme from it.
- `rectio init` takes a theme link at its theme question or in `--theme`.

## Docs and site

- A theme generator page in the docs: a brand colour, neutral temperature, dark depth, radius,
  density and fonts, every colour derived in OKLCH and corrected until each pair the kit draws
  passes WCAG 2.2 AA, with per-token overrides, five presets, a live preview, the CSS and a share
  link.
- Docs pages for the alert dialog, drawer, copy button, rating, tree and resizable panels, and the
  segmented control on the toggle page.
