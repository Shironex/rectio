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
- Three more AI blocks, each with a motion twin: `ChatWorkspace`, a full chat page with a list of
  chats (search, new chat, pinned, rename in place, delete after a confirm, date groups) beside the
  thread, the list in a sheet on a phone; `AssistantSidebar`, an assistant docked beside the app
  that resizes, folds to a rail, opens with Command or Control J and moves the focus in and back,
  with `AssistantSidebarTrigger` for a header and a sheet on a phone; and `PromptComposer`, a field
  with a model picker, attachments, slash commands from your list and a token or character count
  with a limit.
- `applyStreamEvent` folds a provider's stream into the conversation through one small event
  contract (start, text, reasoning, tool, source, done, stopped, error), with no SDK in the kit.
- The AI chat thread takes `renderComposer` for a field of your own, and its words, logic and the
  new stream helpers import from a React Server Component.
- `PromptInput` takes `textareaProps` (its key handler runs first), a `meta` slot beside Send and
  `submitDisabled` for a limit the app counts.
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

- Cards, popovers, selects, date pickers, dialogs, the command menu, sheets, toasts and the app
  shell header take the glass skin's translucency and blur through `backdrop-surface`, and
  ThemeScope and AppShell its canvas wash through `canvas-wash`. Both do nothing in a theme or any
  other skin (card 0.2.0, popover 0.2.0, select 0.2.0, date-picker 0.4.0, dialog 0.3.0,
  command-menu 0.2.0, sheet 0.3.0, toast 0.3.0, app-shell 0.2.0, theme-scope 0.2.0).
- Outline cards, block panels and the plan cards of the pricing table take `shadow-panel`: nothing
  in a theme, the edge highlight and a wide soft shadow under glass. Cards and block panels take the
  glass translucency through `translucent-surface`, with no backdrop blur; only popups, dialogs,
  sheets, toasts and the sticky app header blur. A surface inside another one stays solid
  (card 0.2.0, blocks-core 0.1.7, pricing-table 0.1.1).
- `cn` knows the skin hooks: a background image class (an image, `bg-linear-*`, `bg-none`)
  replaces `canvas-wash`, and a backdrop filter class (`backdrop-blur-*`, `backdrop-saturate-*`,
  `backdrop-filter-none`) replaces `backdrop-surface`, so yours wins in any theme (cn 0.3.0).
- Update order: these components read utilities that tokens 0.7.0 adds (`shadow-panel`,
  `shadow-indicator`, `border-line-disabled`, `translucent-surface`, `backdrop-surface`,
  `canvas-wash`). The registry has no minimum version per item, so add tokens again first
  (`rectio add tokens --overwrite`; `rectio update` lists what is behind), then the components.
- Switch, slider and segmented control thumbs take `shadow-indicator`, so an offset or ambient
  shadow never spills out of the track (switch 0.1.2, slider 0.1.2, tabs 0.1.5, toggle 0.2.2,
  motion toggle 0.2.1, cn 0.3.0).
- Disabled controls keep a plain edge through `border-line-disabled`, and tinted badges read their
  edge from `--rx-badge-edge`, so under brutalist a disabled control reads apart by its edge and a
  badge takes the ink edge in its tone (badge 0.1.2, button 0.2.3, checkbox 0.2.2, field 0.2.2,
  input-group 0.1.2, file-upload 0.1.4, prompt-input 0.1.1, radio-group 0.1.2, tag-input 0.1.3).

- Four more charts in `@rectio/ui/charts`. `FunnelChart`: stages as rows or columns, what carried on
  and what dropped off between each in words, the drop-off hatched and the biggest drop named.
  `Heatmap`: a calendar of days or a matrix of two categories on the warm sequence steps, with zero
  and missing cells drawn apart, a legend, figures printed in matrix cells and the arrow keys to read
  each cell. `WaterfallChart`: a start, its changes and the totals between, decreases hatched, signed
  labels and rules carrying the running total, turning to rows on a narrow width. `RadialGauge`: one
  figure against its scale with a target, a pace marker and named bands, read as a meter with its band
  in words. Each has a spoken summary, loading and empty states, and a table twin where it has rows
  (funnel-chart, heatmap, waterfall-chart and radial-gauge 0.1.0, chart 0.1.2). Their helpers
  `funnelSteps`, `heatStep`, `heatValue` and `waterfallBars` live in modules without `'use client'`,
  so a server component can call them; a heatmap draws figures below zero as missing and keeps a
  calendar to its latest 106 weeks; gauge bands are sorted and clamped to the scale.
- `devWarn`, a console warning in development builds only, for a misuse a component can recover
  from (dev-warn 0.1.0).
- Their motion twins in `@rectio/motion/charts`: funnel stages grow in turn, the heatmap is
  uncovered along the grid, waterfall steps grow from the running total and the gauge sweeps to its
  value, then each glides to new figures (motion-chart 0.1.1).
- Analytics blocks in `@rectio/blocks/analytics`, each with a motion twin and a `variant`: a metric
  trend (a tile beside a sparkline, or a card over a chart), a breakdown table (shares, changes and
  bars, sortable, the smallest rows gathered into others), a funnel card (the conversion, its change
  in points and the biggest drop) and a goal tracker (a gauge or a bar with the target and today's
  pace, the state in words, the projection and what each day needs).

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

- Two opt-in skins. `glass`: translucent cards, popups and headers over a blurred backdrop, a light
  top edge, a wide soft shadow, rounder corners and a tinted canvas, solid wherever the browser cannot blur or
  transparency is reduced (`skin-glass`). `brutalist`: two pixel ink borders, square corners, hard
  offset shadows and heavier type, with focus rings kept clear of the shadows (`skin-brutalist`).
- Every theme defines the colours those skins turn on, in each mode: an edge highlight
  (`--rx-border-highlight`) and an offset shadow colour (`--rx-shadow-offset-color`), plus the
  switches a skin sets (surface opacity, blur, backdrop and wash, border ink, highlight, ambient
  and offset sizes), all off in the theme (tokens 0.7.0, theme-default 0.5.0). Fields take their
  edge from `--rx-field-border`, which follows the border ink. Field and table touch heights grow
  by any border wider than 1px, and never shrink under a thinner one, so their inner targets stay
  44px (skin-dense 0.1.1, skin-editorial 0.1.1).

- Text tokens over chart sequence steps 2 to 5, `--rx-chart-on-sequence-2` to `-5`, holding 4.5:1
  on their step in every theme, mode and skin, for figures printed in heatmap cells. Step 1 follows
  the brand colour and gets none. The theme generator derives them too (tokens 0.7.1,
  theme-default 0.5.1).

## CLI

- `rectio init` asks its questions interactively.
- `rectio add '<theme link>'` installs a theme made in the theme generator. The link holds the whole
  theme, so nothing is fetched from it; `rectio diff` and `rectio update` rebuild the theme from it.
- `rectio init` takes a theme link at its theme question or in `--theme`.

## Docs and site

- Pages for the funnel chart, heatmap, waterfall chart and radial gauge, and an analytics blocks
  section with a page for each block, all with finance and SaaS demos.
- Pages for the chat components and the AI chat thread block, with demos fed by a fake stream.
- Pages for the chat workspace, assistant sidebar and prompt composer blocks, and a section on
  feeding a stream with `applyStreamEvent`.
- The skins page covers glass and brutalist: the translucent layer and its solid fallback, the
  backdrop the glass contrast tests assume, focus beside offset shadows, and the switches in the
  skin contract. The theme generator previews a theme under both.

- A theme generator page in the docs: a brand colour, neutral temperature, dark depth, radius,
  density and fonts, every colour derived in OKLCH and corrected until each pair the kit draws
  passes WCAG 2.2 AA, with per-token overrides, five presets, a live preview, the CSS and a share
  link.
- Docs pages for the alert dialog, drawer, copy button, rating, tree and resizable panels, and the
  segmented control on the toggle page.
- A Charts section in the components docs, and a page for the time series chart block.
