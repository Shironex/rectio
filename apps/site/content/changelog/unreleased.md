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
- Charts on their own entry, `@rectio/ui/charts`, so an app that draws none never ships the chart
  library: `LineChart` and `AreaChart` on a time axis with locale dates, ticks that fit the width,
  hatched gaps for missing data and weekly means on a narrow plot; `BarChart` vertical, horizontal,
  grouped or stacked; and `DonutChart` with the total in the middle and every part listed. Each has a
  spoken summary, keyboard reading, a table twin, loading and empty states and the three colour
  vision safe series colours.
- `Sparkline`, `TrendChip` and `ChartCard` in the main entry, with no chart library.
- Motion twins in `@rectio/motion/charts`: lines draw along time with a dot on the drawing edge, bars
  grow from zero, the ring settles in, and new figures glide in.
- A time series chart block: a chart card whose headline is each series' latest figure and change.
- `TimeField`: a segmented time of day with a 12 or 24 hour clock from the locale, minute steps,
  bounds that arrows and Home and End stop at, and one name for the whole field.
- `RangeCalendar`: two months inline with presets, a range previewed from the pointer and the keys,
  and a spoken summary of the days picked. `DateRangePicker` opens it in its popup.
- `EventCard`: an event in six tones, with tentative and cancelled said in words and an icon, full
  and compact layouts, and all-day ends read as exclusive local dates.
- A week agenda block for a day or a week: overlaps side by side, an all-day row, an "N more" button
  for a crowded hour, the current time, slot presses and a list on phones and touch screens. Hours
  follow the wall clock across a clock change.
- Agenda hour height and gutter width tokens, in tokens 0.5.0.
- `localDate('2026-03-16')` from the main entry builds a local calendar date for charts, events and
  the agenda.
- The SaaS blocks read the clock again every minute when no `now` is passed, so relative times and
  the agenda time line keep up (saas-core 0.2.0).

- An AI and chat pack, provider agnostic: `ChatMessage`, `ChatThread` (follows a streaming reply,
  Jump to latest, day separators and a live announcer that never reads each chunk),
  `MessageActions`, `PromptInput` (attachments, Enter to send, Send that turns into Stop),
  `ChatSource`, `ToolCall`, `Reasoning`, `ChatLoader` and a safe `Markdown` renderer for chat and
  docs, with no raw HTML and checked links.
- `@rectio/motion/chat`: messages that rise into place, typing dots that fade up and streamed text
  revealed at an even pace on whole words, in a separate entry of 1.4 kB.
- The AI chat thread block in `@rectio/blocks/ai`, with an empty state and suggestions, and its
  motion twin.
- The docs code block keeps room for its copy button at the end of the longest line.
- Every small control is a 44px target on touch screens through one shared hit area,
  `touchHitArea`, now exported for your own controls: toggles with a short label, segments, the
  end buttons and overflow count of a multi select, step circles on a phone, the banner action,
  docs heading links and the compact language switcher. A half-star `Rating` takes a tap on the
  whole star, and a second tap on the same star sets its half. In the SaaS blocks, `touchTarget`
  is now an alias of `touchHitArea`, deprecated and kept for one release.
- `gap-touch-gap` spaces small controls on touch screens by the touch height less the small
  control height, so neighbouring hit areas stay apart at compact density and in the dense skin,
  where a fixed gap fell short. Pagination, message actions, toasts, file items, the table pager,
  the week agenda and the SaaS blocks use it.
- Dark mode hairlines sit further off the raised surfaces, so cards, the sign in panel and inputs
  keep their edge, and skeletons read as shapes on cards. The raised shadow in dark lights the top
  edge from inside instead of drawing a second ring, so a secondary button or card no longer shows
  a doubled border.
- `--rx-warning-mark`, an amber for marks drawn on a surface that holds 3:1 there. Rating stars
  use it, so they are gold in light mode rather than brown. A theme made in the generator before
  this release lacks it and falls back to the stronger amber; make the theme again from its link,
  or add the token to it, for the gold.
- A tentative event draws its dashed edge twice as wide in the tone's mark colour, at 3:1 on the
  surface, not in the faint tint of a confirmed event.
- A streaming `Markdown` reply renders the same as the finished text at every moment: a code fence
  indented inside a list item no longer hides the blocks after the list, a table row that looks
  like a fence stays a row, and an open `*` in a quote the reply has moved past stays as written.
- On touch screens, sortable table headers, the chat reasoning, tool call and sources rows, the
  row under a reply and the docs code block header take the touch height, and the tab indicator no
  longer takes a press meant for the tab under it.

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

- Pages for the chat components and the AI chat thread block, with demos fed by a fake stream.

- A theme generator page in the docs: a brand colour, neutral temperature, dark depth, radius,
  density and fonts, every colour derived in OKLCH and corrected until each pair the kit draws
  passes WCAG 2.2 AA, with per-token overrides, five presets, a live preview, the CSS and a share
  link.
- Docs pages for the alert dialog, drawer, copy button, rating, tree and resizable panels, and the
  segmented control on the toggle page.
- A Charts section in the components docs, and a page for the time series chart block.
