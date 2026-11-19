/**
 * Builds the static registry into dist/registry from packages/ui and packages/tokens.
 * Run after `tsc` (the package build does both) and after @rectio/tokens is built.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import config from '../registry.config.ts';
import { buildRegistry, writeRegistry } from '../src/build/index.ts';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'registry');
const result = buildRegistry(config);
for (const warning of result.warnings) console.warn(`registry: warning: ${warning}`);
const written = writeRegistry(outDir, result);
const pro = result.items.filter((item) => item.tier === 'pro').length;
console.log(
  `registry: ${result.items.length} items (${pro} pro), ${written.length} files -> dist/registry`,
);
