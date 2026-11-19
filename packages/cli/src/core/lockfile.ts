import { join } from 'node:path';

import { fileTypeSchema, itemTypeSchema, tierSchema } from '@rectio/registry';
import * as z from 'zod';

import { CliError } from './context.ts';
import { readJson, writeJson } from './fs.ts';

export const LOCK_FILE = 'rectio.lock.json';

const lockedFileSchema = z.object({
  /** Project-relative POSIX path. */
  path: z.string(),
  /** The file's path in the registry item. */
  source: z.string(),
  type: fileTypeSchema,
  /** sha256 of what the CLI wrote (after alias rewriting, LF endings). */
  sha256: z.string(),
});
export type LockedFile = z.infer<typeof lockedFileSchema>;

const lockedItemSchema = z.object({
  version: z.string(),
  type: itemTypeSchema,
  tier: tierSchema,
  /** Integrity of the registry item as fetched, the base of a future three-way merge. */
  integrity: z.string(),
  files: z.array(lockedFileSchema),
});
export type LockedItem = z.infer<typeof lockedItemSchema>;

const lockSchema = z.object({
  lockfileVersion: z.literal(1),
  items: z.record(z.string(), lockedItemSchema),
});
export type Lockfile = z.infer<typeof lockSchema>;

export function readLock(cwd: string): Lockfile {
  const raw = readJson(join(cwd, LOCK_FILE));
  if (raw === undefined) return { lockfileVersion: 1, items: {} };
  const parsed = lockSchema.safeParse(raw);
  if (!parsed.success) throw new CliError(`${LOCK_FILE} is invalid; restore it from git`);
  return parsed.data;
}

/** Written with sorted item names, so the file diffs cleanly in review. */
export function writeLock(cwd: string, lock: Lockfile): void {
  const items = Object.fromEntries(Object.entries(lock.items).sort(([a], [b]) => (a < b ? -1 : 1)));
  writeJson(join(cwd, LOCK_FILE), { lockfileVersion: 1, items });
}

/** The locked file at a project path, across items. */
export function lockedFileAt(lock: Lockfile, path: string): LockedFile | undefined {
  for (const item of Object.values(lock.items)) {
    const hit = item.files.find((f) => f.path === path);
    if (hit !== undefined) return hit;
  }
  return undefined;
}
