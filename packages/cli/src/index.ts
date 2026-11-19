// Library API: the same commands the bin runs, for the MCP server and other tools.
export { main } from './main.ts';
export { runAdd, type AddOptions } from './commands/add.ts';
export { runDiff, type DiffOptions, type DiffResult, type FileDiff } from './commands/diff.ts';
export { baseItems, runInit, type InitOptions } from './commands/init.ts';
export { rankMatches, runList, runSearch, type ListOptions } from './commands/list.ts';
export { runUpdate, type Outdated } from './commands/update.ts';
export { CliError, processContext, type CliContext } from './core/context.ts';
export {
  CONFIG_FILE,
  DEFAULT_REGISTRY,
  configSchema,
  readConfig,
  type RectioConfig,
} from './core/config.ts';
export { LOCK_FILE, readLock, type Lockfile } from './core/lockfile.ts';
export { LICENSE_ENV, authFile, findLicenseKey } from './core/license.ts';
export { createRegistryClient, type RegistryClient } from './core/registry-client.ts';
export { installItems, type InstallOptions, type InstallReport } from './core/installer.ts';
