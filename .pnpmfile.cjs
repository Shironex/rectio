// @ts-check
'use strict';

/**
 * @rectio/cli is the only published package. Its build inlines the private @rectio/registry, so the
 * packed manifest drops devDependencies: otherwise pnpm would turn `workspace:*` into a version of
 * a package that is not on npm.
 */
module.exports = {
  hooks: {
    /** @param {Record<string, unknown>} pkg */
    beforePacking(pkg) {
      if (pkg.name === '@rectio/cli') delete pkg.devDependencies;
      return pkg;
    },
  },
};
