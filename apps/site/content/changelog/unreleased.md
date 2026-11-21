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
