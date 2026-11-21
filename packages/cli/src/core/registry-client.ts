import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  INDEX_PATH,
  itemPath,
  itemTypeSchema,
  registryIndexSchema,
  registryItemSchema,
  verifyItem,
  type IndexEntry,
  type RegistryIndex,
  type RegistryItem,
} from '@rectio/registry';
import type * as z from 'zod';

import { CliError } from './context.ts';

/** A registry answer that takes longer than this is treated as unreachable. */
const FETCH_TIMEOUT_MS = 30_000;

export interface RegistryClient {
  url: string;
  index: () => Promise<RegistryIndex>;
  /** Fetches, validates and verifies one item. */
  item: (entry: IndexEntry) => Promise<RegistryItem>;
}

function describe(status: number, path: string, url: string): CliError {
  if (status === 404) return new CliError(`${path} was not found in the registry at ${url}`);
  return new CliError(`the registry at ${url} answered ${status} for ${path}`);
}

async function readRaw(base: string, path: string): Promise<string> {
  if (base.startsWith('file:')) {
    // A local registry folder, such as a development build.
    try {
      return await readFile(fileURLToPath(`${base}/${path}`), 'utf8');
    } catch {
      throw describe(404, path, base);
    }
  }
  let response: Response;
  try {
    // The registry origin is the user's own configuration (rectio.json, --registry or env).
    // eslint-disable-next-line noctcore-security/no-user-controlled-fetch-url
    response = await fetch(`${base}/${path}`, {
      headers: { accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new CliError(`could not reach the registry at ${base}: ${(error as Error).message}`);
  }
  if (!response.ok) throw describe(response.status, path, base);
  return response.text();
}

/**
 * Drops index entries of an item type this CLI does not know, so a registry that gains a new
 * kind of item keeps working with an older CLI (which simply does not offer it). `debug` hears
 * which entries were dropped, so a mistyped type does not vanish without a trace.
 */
export function knownEntries(raw: unknown, debug?: (line: string) => void): unknown {
  if (typeof raw !== 'object' || raw === null || !('items' in raw) || !Array.isArray(raw.items))
    return raw;
  const known = (entry: unknown) =>
    typeof entry !== 'object' ||
    entry === null ||
    !('type' in entry) ||
    itemTypeSchema.safeParse(entry.type).success;
  const entries = raw.items as unknown[];
  const skipped = entries.filter((entry) => !known(entry));
  if (skipped.length > 0 && debug !== undefined) {
    const named = skipped.map((entry) => {
      const { name, type } = entry as { name?: unknown; type?: unknown };
      return `${String(name)} (${String(type)})`;
    });
    debug(
      `registry: skipped ${String(skipped.length)} item(s) of a type this CLI does not know: ${named.join(', ')}`,
    );
  }
  return { ...raw, items: entries.filter(known) };
}

function parse<T>(
  schema: z.ZodType<T>,
  text: string,
  what: string,
  prepare: (raw: unknown) => unknown = (raw) => raw,
): T {
  let raw: unknown;
  try {
    raw = prepare(JSON.parse(text));
  } catch {
    throw new CliError(`${what} is not valid JSON`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new CliError(
      `${what} does not match the registry schema: ${issue?.path.join('.') ?? ''} ${issue?.message ?? ''}`,
      'Update the CLI, or check the registry URL.',
    );
  }
  return parsed.data;
}

/** `debug` hears registry notes, such as index entries this CLI skips. */
export function createRegistryClient(url: string, debug?: (line: string) => void): RegistryClient {
  let cached: Promise<RegistryIndex> | undefined;
  // One fetch per item per run: `init --template` checks every item before writing, then installs.
  const items = new Map<string, Promise<RegistryItem>>();
  const fetchItem = async (entry: IndexEntry): Promise<RegistryItem> => {
    const path = itemPath(entry.name);
    const item = parse(registryItemSchema, await readRaw(url, path), path);
    if (item.name !== entry.name) {
      throw new CliError(`${path} holds "${item.name}", not "${entry.name}"`);
    }
    const problems = verifyItem(item);
    if (problems.length > 0) {
      throw new CliError(
        `${entry.name} failed its integrity check: ${problems.map((p) => p.message).join('; ')}`,
        'The download was altered or corrupted. Nothing was written.',
      );
    }
    return item;
  };
  return {
    url,
    index: () => {
      cached ??= readRaw(url, INDEX_PATH).then((text) =>
        parse(registryIndexSchema, text, `${url}/${INDEX_PATH}`, (raw) => knownEntries(raw, debug)),
      );
      return cached;
    },
    item: (entry) => {
      const id = `${entry.name}@${entry.version}`;
      let item = items.get(id);
      if (item === undefined) {
        item = fetchItem(entry);
        // A failed fetch is not remembered: a retry after a network error refetches.
        void item.catch(() => items.delete(id));
        items.set(id, item);
      }
      return item;
    },
  };
}
