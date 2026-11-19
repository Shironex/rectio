import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { INDEX_PATH, SCHEMA_PATHS, itemPath } from '../layout.ts';
import { jsonSchemas } from '../json-schemas.ts';
import type { BuildResult } from './registry.ts';

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** Writes the static registry: index, latest and versioned item copies, and the JSON Schemas. */
export function writeRegistry(outDir: string, result: BuildResult): string[] {
  rmSync(outDir, { recursive: true, force: true });
  const written: string[] = [];
  const write = (path: string, content: string) => {
    const file = join(outDir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    written.push(path);
  };
  write(INDEX_PATH, json(result.index));
  for (const item of result.items) {
    write(itemPath(item.name, item.tier), json(item));
    write(itemPath(item.name, item.tier, item.version), json(item));
  }
  const schemas = jsonSchemas();
  write(SCHEMA_PATHS.item, json(schemas.item));
  write(SCHEMA_PATHS.index, json(schemas.index));
  write(SCHEMA_PATHS.config, json(schemas.config));
  return written;
}
