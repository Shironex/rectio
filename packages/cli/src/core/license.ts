import { homedir } from 'node:os';
import { join } from 'node:path';

import type { CliContext } from './context.ts';
import { readJson } from './fs.ts';

export const LICENSE_ENV = 'RECTIO_LICENSE_KEY';

/** `%APPDATA%\rectio` on Windows, `$XDG_CONFIG_HOME/rectio` or `~/.config/rectio` elsewhere. */
export function userConfigDir(env: CliContext['env'], platform = process.platform): string {
  if (platform === 'win32') {
    return join(env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'rectio');
  }
  return join(env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'rectio');
}

export function authFile(env: CliContext['env'], platform = process.platform): string {
  return join(userConfigDir(env, platform), 'auth.json');
}

export interface LicenseKey {
  key: string;
  source: string;
}

/**
 * The license key for pro items: env RECTIO_LICENSE_KEY first, then auth.json in the user config
 * dir. Never read from or written to the project, so it cannot be committed by accident.
 */
export function findLicenseKey(env: CliContext['env']): LicenseKey | undefined {
  const fromEnv = env[LICENSE_ENV]?.trim();
  if (fromEnv !== undefined && fromEnv !== '') return { key: fromEnv, source: LICENSE_ENV };
  const file = authFile(env);
  const fromFile = (readJson(file) as { licenseKey?: unknown } | undefined)?.licenseKey;
  if (typeof fromFile === 'string' && fromFile.trim() !== '') {
    return { key: fromFile.trim(), source: file };
  }
  return undefined;
}

export function missingKeyHint(env: CliContext['env']): string {
  return [
    `Set ${LICENSE_ENV} in your shell, or save {"licenseKey": "<key>"} to ${authFile(env)}.`,
    'Nothing was written.',
  ].join(' ');
}
