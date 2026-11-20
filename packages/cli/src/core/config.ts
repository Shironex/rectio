import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  FRAMEWORKS,
  REGISTRY_URL,
  SCHEMA_PATHS,
  configSchema,
  type Framework,
  type RectioConfig,
} from '@rectio/registry';

import { CliError, type CliContext } from './context.ts';
import { readJson, writeJson } from './fs.ts';
import { cliCommand } from './runner.ts';

export const CONFIG_FILE = 'rectio.json';
export const CONFIG_SCHEMA_URL = `${REGISTRY_URL}/${SCHEMA_PATHS.config}`;
/** The hosted registry; override with --registry or RECTIO_REGISTRY_URL. */
export const DEFAULT_REGISTRY = REGISTRY_URL;

export { FRAMEWORKS, configSchema, type Framework, type RectioConfig };

export function readConfig(cwd: string): RectioConfig | undefined {
  const raw = readJson(join(cwd, CONFIG_FILE));
  if (raw === undefined) return undefined;
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new CliError(`${CONFIG_FILE} is invalid: ${issues}`);
  }
  return parsed.data;
}

export function requireConfig(cwd: string): RectioConfig {
  const config = readConfig(cwd);
  if (config === undefined) {
    throw new CliError(`no ${CONFIG_FILE} in ${cwd}`, `Run \`${cliCommand('init')}\` first.`);
  }
  return config;
}

export function writeConfig(cwd: string, config: RectioConfig): void {
  writeJson(join(cwd, CONFIG_FILE), { $schema: CONFIG_SCHEMA_URL, ...config });
}

/** A bare path becomes a file:// URL; URLs pass through without a trailing slash. */
export function normalizeRegistryUrl(cwd: string, value: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value.replace(/\/+$/, '');
  return pathToFileURL(resolve(cwd, value)).href.replace(/\/+$/, '');
}

/** --registry, then RECTIO_REGISTRY_URL, then rectio.json, then the default. */
export function registryUrl(
  ctx: CliContext,
  flag: string | undefined,
  config: RectioConfig | undefined,
): string {
  const value = flag ?? ctx.env.RECTIO_REGISTRY_URL ?? config?.registry ?? DEFAULT_REGISTRY;
  return normalizeRegistryUrl(ctx.cwd, value);
}
