---
title: Coming next
summary: Work that is merging into main now and ships with the next release.
---

## Themes

- Graphite becomes the new default dark mode.
- The ledger theme retires and lives on as a theme generator preset.

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
