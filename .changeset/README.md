# Changesets

Run `pnpm changeset` to record a change to `@rectio/cli`, the only package published to npm. Every
other workspace package and template is private and ignored here.

On a push to main, the release workflow opens a "Version Packages" pull request that bumps the
version and writes the changelog. Merging it publishes the new version to npm.
