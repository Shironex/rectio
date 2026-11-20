import pkg from '../package.json' with { type: 'json' };

/** The CLI's own version, inlined at build time so the bundle never reads package.json. */
export const CLI_VERSION: string = pkg.version;
