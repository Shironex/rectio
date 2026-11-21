---
'@rectio/cli': minor
---

Skins: token overrides that restyle type, corners, rhythm and control sizes on top of any theme, in light and dark.

- `rectio add skin-dense` or `rectio add skin-editorial` writes `styles/rectio/skins/<id>.css` and imports it after your themes and before the base styles, so a skin wins over a theme and compact density still applies on top. Set `data-skin="<id>"` on `<html>`, or `skin="<id>"` on a ThemeScope.
- `rectio init --skin <id>` adds a skin beside the theme. A new app from a template takes no skin; add it once the app exists.
- `rectio list --type skin` lists the skins, and the MCP server describes them.
- The CLI now skips registry items of a type it does not know instead of rejecting the whole index, so a registry that gains a new kind of item keeps working with an older CLI. CLI 0.2.0 and earlier reject an index that lists skins: update the CLI.
