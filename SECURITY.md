# Security

This file says what a vulnerability in rectio can be, what is not one, and where to send a report.

## What counts

- **The CLI writes into your project.** `rectio init` and `rectio add` fetch registry items, check
  their schema and sha256 integrity, rewrite imports, write files and run your package manager. A
  crafted item or registry response that writes outside the project, skips the integrity check,
  passes arguments through a shell, or makes the CLI run something other than the package
  manager's install, is a vulnerability.
- **The MCP server** (`rectio mcp`) is read-only by design. A way to make it write files, read
  files outside the registry and the project's `rectio.json`, or leak environment variables is a
  vulnerability.
- **The components, blocks and templates** render data you pass in. A prop that turns text into
  markup (cross-site scripting), a link that runs script, or an input that leaks its value is a
  vulnerability.
- **The published site and registry** at <https://shironex.github.io/rectio/>. A registry file that
  does not match the source in this repository, or a way to change what the site serves, is a
  vulnerability.

## What does not count

- **Bugs without a security impact**, however annoying: a broken layout, a wrong keyboard path, a
  CLI error message. Open a public issue with the bug report form.
- **Advisories in the development toolchain** (the test runner, the docs site build, the lint
  plugins) that never reach a component, the CLI or a template a user installs. Send them as a
  normal issue or a pull request bumping the lockfile.

## Reporting

Use GitHub's private vulnerability reporting for this repository:
<https://github.com/Shironex/rectio/security/advisories/new>. It opens a draft advisory that only
the maintainer can see.

If that page says reporting is not enabled, open a regular issue whose entire body is "security
report, need a private channel", with no details, and I will reply with one. Do not put the
finding in a public issue.

Include the package or item and its version, the input that triggers it, and what it does. There
is no bounty. You will get a reply from me, a fix with a changelog entry that credits you unless
you ask otherwise, and the details published once the fix is out.

## Supported versions

Only the latest version of each package and registry item. Fixes ship forward, never as a
backport.
