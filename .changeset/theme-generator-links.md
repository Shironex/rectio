---
'@rectio/cli': minor
---

`rectio add` takes a theme link from the theme generator on the docs site (`/docs/theming/generator`).

- The link carries the whole theme as a versioned code (`?theme=1.<code>`). The CLI decodes it locally, derives and corrects the colours with the same code the page runs, and writes `styles/rectio/themes/<name>.css` in the shape of the shipped default theme, so the file matches the CSS the page shows. Nothing is fetched from the link.
- The theme installs as `theme-<name>` (default `theme-custom`) with the font packages it imports, and `rectio.lock.json` keeps its code.
- `rectio diff theme-<name>` compares your file with a rebuild of the theme over the current default theme, and `rectio update` lists a generated theme whose rebuild has changed, with the `rectio add <code> --overwrite` that regenerates it.
- A bare theme code works in place of the link.
