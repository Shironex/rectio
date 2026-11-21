---
'@rectio/cli': minor
---

`rectio init` is now interactive in a terminal, like a framework's create-app flow, and every flag form works as before.

- Run `pnpm dlx @rectio/cli init` and pick **Add rectio to this project** (offered when there is a `package.json`, with the framework and Tailwind version it detected) or **Start a new app from a template**.
- For a new app it asks for the template (type to filter, with a link to the live previews), the folder (checked to be new or empty and a valid package name), the theme, the package manager (the detected one first), whether to install now, and whether to create a git repo with a first commit.
- For an existing app it confirms the framework, the CSS entry and the import aliases (each alias can be edited), asks for the theme, and offers a starter set of components (button, field, select, dialog, card, badge, tabs, data-table, money).
- A one-line recap follows, then the usual steps and summary. Arrow keys or `j` and `k` move, Enter answers, and Ctrl+C or Esc stops with exit code 130 and nothing written.
- A flag answers its question, so it is not asked. `--yes` (`-y`) asks nothing and takes the defaults. There are no questions at all when stdin or stdout is not a terminal, in CI, with `TERM=dumb`, with `--quiet`, with `--css` or `--framework`, or with `--template`.
- New flags: `--pm <pnpm|npm|yarn|bun>` picks the package manager, and `--git` / `--no-git` create (or skip) a git repo with a first commit for `init --template`. A default `.gitignore` is written when the template has none, so `node_modules` stays out of the commit.
- Every command the CLI suggests (the Next block, hints, the outdated line and error hints) now follows how you started it: `pnpm dlx @rectio/cli add <item>`, `npx @rectio/cli ...`, `bunx @rectio/cli ...`, `yarn dlx @rectio/cli ...`, or `rectio ...` for a global or local install.
- The update notice retries a failed check after an hour instead of a day, so a version published after a failed check shows up the same day. Started through `pnpm dlx`, it also explains that pnpm caches dlx packages for a day and that `@latest` gets the new version now.
