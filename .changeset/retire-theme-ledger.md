---
'@rectio/cli': patch
---

`theme-ledger` is no longer in the registry. It was marked deprecated for one release, with the warning `rectio add` and `rectio init` print. A project that installed it keeps its file and `rectio update` passes over it; `rectio add theme-ledger` now reports an unknown item and `rectio diff theme-ledger` says it is not in the registry. Make the same look from the ledger preset in the theme generator (`/docs/theming/generator`) and install it with `rectio add '<theme link>'`.
