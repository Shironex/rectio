<!-- Keep this short. CONTRIBUTING.md has the long version. -->

## What

<!-- One or two sentences: what changes and why. Link the issue it closes (Closes #123). -->

## Type

- [ ] New component, block or template
- [ ] Fix
- [ ] Docs or site
- [ ] Tooling, CLI or registry
- [ ] Other

## Checklist

- [ ] `pnpm gate` passes locally (format, lint, typecheck, test, build, repo rules).
- [ ] Tests: behaviour tests for what changed (Vitest and Testing Library).
- [ ] Registry: a new folder is listed in `packages/registry/registry.config.ts`; a changed item has its version bumped.
- [ ] Docs: a page under `apps/site/content/docs` with a live preview for a new item, or the existing page updated.
- [ ] Tokens only: no hardcoded colours, radii, fonts, shadows, durations or easings; a missing value became a semantic token in every mode.
- [ ] Accessibility: roles and labels, keyboard path, visible focus, 44px targets on coarse pointers, reduced motion respected.
- [ ] Screenshots below in light and dark, on desktop and phone width.
- [ ] Visual changes went through design rounds (critique and audit scores, see CONTRIBUTING.md).
- [ ] No em or en dashes in copy, comments, docs or commits; commits follow `type(scope): summary`.

## Screenshots

<!-- Light and dark, desktop and phone. Drop the images here. -->
