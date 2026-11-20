import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  INDEX_PATH,
  itemPath,
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

function parse<T>(schema: z.ZodType<T>, text: string, what: string): T {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
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

export function createRegistryClient(url: string): RegistryClient {
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
        parse(registryIndexSchema, text, `${url}/${INDEX_PATH}`),
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
