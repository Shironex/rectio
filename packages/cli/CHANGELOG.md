# @rectio/cli

## 0.1.1

### Patch Changes

- eebb397: The CLI now reads like an installer: numbered steps, a spinner while it works, and a short summary at the end.

  - `init`, `init --template` and `add` show each step with its time and a note, then close with a box that counts what was added (components, blocks, motion twins, themes, libs) and lists the commands to run next. A failed step names itself, gives the reason and the hint, and says whether anything was written.
  - `add` sums up the files by folder and counts the dependencies it pulled in, instead of listing every file. `--verbose` brings back the full listing, and `--quiet` prints only the result line and errors.
  - `list` groups items by type under section rules, and `search`, `diff`, `update`, `--help`, the outdated hint and the update notice use the same look.
  - The package manager is now detected from how you started the CLI when the project has no lockfile, so `pnpm dlx`, `npx`, `bunx` and `yarn dlx` install with pnpm, npm, bun and yarn. A lockfile or `packageManager` field in the project still wins.
  - Piped output and CI get plain text with no spinner and no box borders. `NO_COLOR` and `FORCE_COLOR` are honored, and a terminal without UTF-8 gets ASCII marks.
