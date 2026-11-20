# @rectio/cli

The command line for [rectio](https://shironex.github.io/rectio/), a React 19 and Tailwind CSS v4
kit of components, blocks, themes and templates for finance and back-office apps. The CLI copies
items into your project as source you own, rewrites their imports to your aliases, and keeps a
lockfile so it can tell your edits from upstream changes.

It needs Node 22.12 or later and a Vite, Next.js or TanStack Start project with Tailwind v4.

## Use

```sh
pnpm dlx @rectio/cli init                                # tokens, a theme and the cn helper
pnpm dlx @rectio/cli add button dialog data-table        # components, with what they depend on
pnpm dlx @rectio/cli add invoice-list                    # blocks work the same way
pnpm dlx @rectio/cli init --template finance-app my-app  # a whole Next.js app in a new folder
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
most once a day, gives up after 1.5 seconds, and stays quiet in CI, when the output is not a
terminal, and in `rectio mcp`. Set `RECTIO_NO_UPDATE_CHECK=1` to turn it off.

## Docs

Everything else, from the flags to the registry format, is in the
[documentation](https://shironex.github.io/rectio/docs). The source and issues live at
[github.com/Shironex/rectio](https://github.com/Shironex/rectio).

MIT licensed.
