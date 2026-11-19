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
  /** Fetches, validates and verifies one item. Pro items need `licenseKey`. */
  item: (entry: IndexEntry, licenseKey?: string) => Promise<RegistryItem>;
}

function describe(status: number, path: string, url: string): CliError {
  if (status === 401) {
    return new CliError(
      `the registry refused the license key for ${path} (401)`,
      'Check the key, or that it has not been revoked. Nothing was written.',
    );
  }
  if (status === 403) {
    return new CliError(
      `the license key is valid but does not include ${path} (403)`,
      'Nothing was written.',
    );
  }
  if (status === 404) return new CliError(`${path} was not found in the registry at ${url}`);
  return new CliError(`the registry at ${url} answered ${status} for ${path}`);
}

async function readRaw(base: string, path: string, licenseKey?: string): Promise<string> {
  if (base.startsWith('file:')) {
    // A local registry has no gate: it serves development builds only.
    try {
      return await readFile(fileURLToPath(`${base}/${path}`), 'utf8');
    } catch {
      throw describe(404, path, base);
    }
  }
  const headers: Record<string, string> = { accept: 'application/json' };
  if (licenseKey !== undefined) headers.authorization = `Bearer ${licenseKey}`;
  let response: Response;
  try {
    // The registry origin is the user's own configuration (rectio.json, --registry or env).
    // eslint-disable-next-line noctcore-security/no-user-controlled-fetch-url
    response = await fetch(`${base}/${path}`, {
      headers,
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
  return {
    url,
    index: () => {
      cached ??= readRaw(url, INDEX_PATH).then((text) =>
        parse(registryIndexSchema, text, `${url}/${INDEX_PATH}`),
      );
      return cached;
    },
    item: async (entry, licenseKey) => {
      const path = itemPath(entry.name, entry.tier);
      const item = parse(
        registryItemSchema,
        await readRaw(url, path, entry.tier === 'pro' ? licenseKey : undefined),
        path,
      );
      if (item.name !== entry.name || item.tier !== entry.tier) {
        throw new CliError(`${path} holds "${item.name}" (${item.tier}), not "${entry.name}"`);
      }
      const problems = verifyItem(item);
      if (problems.length > 0) {
        throw new CliError(
          `${entry.name} failed its integrity check: ${problems.map((p) => p.message).join('; ')}`,
          'The download was altered or corrupted. Nothing was written.',
        );
      }
      return item;
    },
  };
}
