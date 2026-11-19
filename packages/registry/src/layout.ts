/**
 * Paths of the static registry, relative to its base URL. Free bodies are public; pro bodies sit
 * under `pro/` and are only served to a request with a valid license key.
 *
 *   index.json                      every item: name, tier, versions, dependencies, no source
 *   items/<name>.json               latest free item
 *   items/<name>@<version>.json     immutable copy of one free version
 *   pro/items/<name>.json           latest pro item (gated)
 *   pro/items/<name>@<version>.json immutable pro version (gated)
 *   schema/item.json, schema/index.json, schema/config.json
 */
import type { Tier } from './schema.ts';

export const INDEX_PATH = 'index.json';

export function itemPath(name: string, tier: Tier, version?: string): string {
  const file = version === undefined ? `${name}.json` : `${name}@${version}.json`;
  return tier === 'pro' ? `pro/items/${file}` : `items/${file}`;
}

export const SCHEMA_PATHS = {
  item: 'schema/item.json',
  index: 'schema/index.json',
} as const;
