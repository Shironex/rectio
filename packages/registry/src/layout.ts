/**
 * Paths of the static registry, relative to its base URL. Every file is public.
 *
 *   index.json                   every item: name, versions, dependencies, no source
 *   items/<name>.json            latest item
 *   items/<name>@<version>.json  immutable copy of one version
 *   schema/item.json, schema/index.json, schema/config.json
 */
export const INDEX_PATH = 'index.json';

export function itemPath(name: string, version?: string): string {
  return version === undefined ? `items/${name}.json` : `items/${name}@${version}.json`;
}

export const SCHEMA_PATHS = {
  item: 'schema/item.json',
  index: 'schema/index.json',
  config: 'schema/config.json',
} as const;
