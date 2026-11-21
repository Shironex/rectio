# @rectio/cli

## 0.2.0

### Minor Changes

- 7e4dde6: `rectio add` and `rectio init` print a warning for every installed item the registry marks as deprecated, with what to use instead; the MCP item details say so too.
- 5b228b1: `rectio init` is now interactive in a terminal, like a framework's create-app flow, and every flag form works as before.

  - Run `pnpm dlx @rectio/cli init` and pick **Add rectio to this project** (offered when there is a `package.json`, with the framework and Tailwind version it detected) or **Start a new app from a template**.
  - For a new app it asks for the template (type to filter, with a link to the live previews), the folder (checked to be new or empty and a valid package name), the theme, the package manager (the detected one first), whether to install now, and whether to create a git repo with a first commit.
  - For an existing app it confirms the framework, the CSS entry and the import aliases (each alias can be edited), asks for the theme, and offers a starter set of components (button, field, select, dialog, card, badge, tabs, data-table, money).
  - A one-line recap follows, then the usual steps and summary. Arrow keys or `j` and `k` move, Enter answers, and Ctrl+C or Esc stops with exit code 130 and nothing written.
  - A flag answers its question, so it is not asked. `--yes` (`-y`) asks nothing and takes the defaults. There are no questions at all when stdin or stdout is not a terminal, in CI, with `TERM=dumb`, with `--quiet`, with `--css` or `--framework`, or with `--template`.
  - New flags: `--pm <pnpm|npm|yarn|bun>` picks the package manager, and `--git` / `--no-git` create (or skip) a git repo with a first commit for `init --template`. A default `.gitignore` is written when the template has none, so `node_modules` stays out of the commit.
  - Every command the CLI suggests (the Next block, hints, the outdated line and error hints) now follows how you started it: `pnpm dlx @rectio/cli add <item>`, `npx @rectio/cli ...`, `bunx @rectio/cli ...`, `yarn dlx @rectio/cli ...`, or `rectio ...` for a global or local install.
  - The update notice retries a failed check after an hour instead of a day, so a version published after a failed check shows up the same day. Started through `pnpm dlx`, it also explains that pnpm caches dlx packages for a day and that `@latest` gets the new version now.

- 1264dd4: `rectio add` takes a theme link from the theme generator on the docs site (`/docs/theming/generator`).

  - The link carries the whole theme as a versioned code (`?theme=1.<code>`). The CLI decodes it locally, derives and corrects the colours with the same code the page runs, and writes `styles/rectio/themes/<name>.css` in the shape of the shipped default theme, so the file matches the CSS the page shows. Nothing is fetched from the link.
  - The theme installs as `theme-<name>` (default `theme-custom`) with the font packages it imports, and `rectio.lock.json` keeps its code.
  - `rectio diff theme-<name>` compares your file with a rebuild of the theme over the current default theme, and `rectio update` lists a generated theme whose rebuild has changed, with the `rectio add <code> --overwrite` that regenerates it.
  - A bare theme code works in place of the link.
  - `rectio init` takes a theme link at its theme question or in `--theme`: it sets up the default theme, then adds the linked theme on top.

## 0.1.1

### Patch Changes

- eebb397: The CLI now reads like an installer: numbered steps, a spinner while it works, and a short summary at the end.

  - `init`, `init --template` and `add` show each step with its time and a note, then close with a box that counts what was added (components, blocks, motion twins, themes, libs) and lists the commands to run next. A failed step names itself, gives the reason and the hint, and says whether anything was written.
  - `add` sums up the files by folder and counts the dependencies it pulled in, instead of listing every file. `--verbose` brings back the full listing, and `--quiet` prints only the result line and errors.
  - `list` groups items by type under section rules, and `search`, `diff`, `update`, `--help`, the outdated hint and the update notice use the same look.
  - The package manager is now detected from how you started the CLI when the project has no lockfile, so `pnpm dlx`, `npx`, `bunx` and `yarn dlx` install with pnpm, npm, bun and yarn. A lockfile or `packageManager` field in the project still wins.
  - Piped output and CI get plain text with no spinner and no box borders. `NO_COLOR` and `FORCE_COLOR` are honored, and a terminal without UTF-8 gets ASCII marks.
