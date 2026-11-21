# @rectio/cli

<p>
  <a href="https://www.npmjs.com/package/@rectio/cli"><img src="https://img.shields.io/npm/v/@rectio/cli?style=flat&color=2f5bd3&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@rectio/cli"><img src="https://img.shields.io/npm/dm/@rectio/cli?style=flat&color=2f5bd3&label=downloads" alt="npm downloads per month"></a>
  <a href="https://github.com/Shironex/rectio/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/Shironex/rectio/ci.yml?branch=main&style=flat&label=ci" alt="CI status"></a>
  <img src="https://img.shields.io/node/v/@rectio/cli?style=flat&color=2f5bd3" alt="Node 22.12 or later">
  <a href="https://github.com/Shironex/rectio/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-2f5bd3?style=flat" alt="MIT license"></a>
</p>

The command line for [rectio](https://shironex.github.io/rectio/), a React 19 and Tailwind CSS v4
kit of components, blocks, themes and templates for finance and back-office apps. The CLI copies
items into your project as source you own, rewrites their imports to your aliases, and keeps a
lockfile so it can tell your edits from upstream changes.

It needs Node 22.12 or later and a Vite, Next.js or TanStack Start project with Tailwind v4.

## Use

```sh
pnpm dlx @rectio/cli init
```

In a terminal, `init` asks whether to add rectio to the app you are in (it shows what it detected,
then the aliases, the theme and a few starter components) or to start a new Next.js app from a
template (folder, theme, package manager, install, git). Ctrl+C or Esc stops before anything is
written.

Every answer is also a flag, and scripts and CI never get a question:

```sh
pnpm dlx @rectio/cli init --yes                          # tokens, a theme and the cn helper
pnpm dlx @rectio/cli add button dialog data-table        # components, with what they depend on
pnpm dlx @rectio/cli add invoice-list                    # blocks work the same way
pnpm dlx @rectio/cli init --template finance-app my-app  # a whole Next.js app in a new folder
pnpm dlx @rectio/cli add '<theme generator link>'        # a theme made on the docs site
pnpm dlx @rectio/cli add skin-editorial                  # a skin, then data-skin="editorial"
```

`npx @rectio/cli ...` works too. To type `rectio` on its own, install it globally with
`pnpm add -g @rectio/cli`.

Other commands: `diff <item>` shows how your copy differs from the registry, `list` and
`search <query>` browse the registry, and `update` reports installed items with a newer version.
`rectio --help` lists every flag.

`init` and `add` show numbered steps with a spinner and close with a short summary. `--verbose`
lists every item, file and package; `--quiet` prints only the result line and errors. Piped or in
CI the output is plain text, and `NO_COLOR` is honored. The package manager comes from your
lockfile, or from how you started the CLI (`pnpm dlx`, `npx`, `bunx`, `yarn dlx`) when there is
none.

## For coding agents

`rectio mcp` runs a read-only MCP server on stdio for Claude Code, Cursor or VS Code. It lists and
searches items, returns their source with your aliases, gives token values per theme, and prints
the exact `rectio add` command. It never writes files. With a global install:

```sh
claude mcp add rectio --scope project -- rectio mcp
```

## Update notice

When a newer `@rectio/cli` is on npm, the CLI says so on stderr after a command. It asks npm at
most once a day (an hour after a failed ask), gives up after 1.5 seconds, and stays quiet in CI, when the output is not a
terminal, and in `rectio mcp`. Set `RECTIO_NO_UPDATE_CHECK=1` to turn it off.

## Docs

Everything else, from the flags to the registry format, is in the
[documentation](https://shironex.github.io/rectio/docs). The source and issues live at
[github.com/Shironex/rectio](https://github.com/Shironex/rectio).

MIT licensed.
