import { createHash } from 'node:crypto';

import type { RegistryItem } from './schema.ts';

/** CRLF and lone CR to LF, so a file hashes the same on Windows and macOS. */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** JSON with object keys sorted at every level: the same value always gives the same bytes. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.fromEntries(entries.map(([k, v]) => [k, sortKeys(v)]));
  }
  return value;
}

type Hashable = Omit<RegistryItem, 'integrity' | '$schema'> & {
  integrity?: string;
  $schema?: string | undefined;
};

/** `sha256-<base64>` over the canonical item JSON, leaving out `$schema` and `integrity`. */
export function itemIntegrity(item: Hashable): string {
  const rest: Record<string, unknown> = { ...item };
  delete rest.integrity;
  delete rest.$schema;
  const digest = createHash('sha256').update(canonicalJson(rest), 'utf8').digest('base64');
  return `sha256-${digest}`;
}

export interface IntegrityProblem {
  file?: string;
  message: string;
}

/** Checks the item integrity and every file hash. An empty list means the item is intact. */
export function verifyItem(item: RegistryItem): IntegrityProblem[] {
  const problems: IntegrityProblem[] = [];
  for (const file of item.files) {
    if (sha256Hex(file.content) !== file.sha256) {
      problems.push({ file: file.path, message: 'file content does not match its sha256' });
    }
  }
  if (itemIntegrity(item) !== item.integrity) {
    problems.push({ message: 'item integrity does not match its content' });
  }
  return problems;
}
