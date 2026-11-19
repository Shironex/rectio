import * as z from 'zod';

/** Bumped only on a breaking change of the item or index shape. */
export const SCHEMA_VERSION = 1;

/**
 * Version of the token contract (the set of semantic and component token names every theme must
 * define). A theme item declares the contract it fills; adding a required token is a breaking
 * change for every sold theme, so it bumps this number.
 */
export const TOKEN_CONTRACT_VERSION = 1;

/**
 * Registry files import each other through this canonical prefix, followed by the alias key and
 * the file's registry path without extension: `@registry/ui/field`, `@registry/lib/cn`. The CLI
 * rewrites it to the consumer's own aliases at install time.
 */
export const REGISTRY_IMPORT_PREFIX = '@registry/';

export const ALIAS_KEYS = ['ui', 'blocks', 'lib', 'hooks', 'styles'] as const;
export type AliasKey = (typeof ALIAS_KEYS)[number];

export const itemNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'lowercase kebab-case, starting with a letter')
  .max(64);

/** Plain semver without build metadata: 1.2.3 or 1.2.3-beta.1. */
export const versionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'a semver version such as 1.2.3');

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'a lowercase hex sha256');

export const itemTypeSchema = z.enum(['component', 'block', 'theme', 'lib', 'hook', 'style']);
export type ItemType = z.infer<typeof itemTypeSchema>;

/**
 * `style` and `theme` files are CSS the CLI imports from the project's CSS entry: themes first,
 * then styles, so the base layer (density, reduced motion) wins over a theme at equal specificity.
 */
export const fileTypeSchema = z.enum(['component', 'block', 'lib', 'hook', 'theme', 'style']);
export type FileType = z.infer<typeof fileTypeSchema>;

export const tierSchema = z.enum(['free', 'pro']);
export type Tier = z.infer<typeof tierSchema>;

/** A relative POSIX path that cannot climb out of its root. */
const safeRelativePath = z
  .string()
  .min(1)
  .refine(
    (path) =>
      !path.startsWith('/') &&
      !path.includes('\\') &&
      !/^[A-Za-z]:/.test(path) &&
      path.split('/').every((segment) => segment !== '..' && segment !== '.' && segment !== ''),
    'a relative POSIX path without "..", "." or empty segments',
  );

/** `@ui/button.tsx`: an alias placeholder followed by a safe relative path. */
const targetSchema = z
  .string()
  .regex(new RegExp(`^@(?:${ALIAS_KEYS.join('|')})/`), 'starts with an alias placeholder')
  .refine((target) => safeRelativePath.safeParse(target.slice(target.indexOf('/') + 1)).success, {
    message: 'the path after the placeholder must be a safe relative path',
  });

export const itemFileSchema = z.object({
  /** Path inside the registry, unique per item: `ui/button.tsx`. */
  path: safeRelativePath,
  type: fileTypeSchema,
  /** Where the file lands in the consumer project, through an alias placeholder. */
  target: targetSchema,
  /** File contents with LF line endings. */
  content: z.string(),
  /** sha256 of `content`, as published (before the CLI rewrites aliases). */
  sha256: sha256Schema,
});
export type ItemFile = z.infer<typeof itemFileSchema>;

const dependencyMapSchema = z.record(z.string().min(1), z.string().min(1));

const cssVarsSchema = z.object({
  /** Added to `@theme inline` so Tailwind generates utilities for them. */
  theme: z.record(z.string(), z.string()).optional(),
  light: z.record(z.string(), z.string()).optional(),
  dark: z.record(z.string(), z.string()).optional(),
});
export type CssVars = z.infer<typeof cssVarsSchema>;

export const requiresSchema = z.object({
  react: z.string().optional(),
  tailwindcss: z.string().optional(),
  /** Token contract version a theme fills or a component reads. */
  tokenContract: z.number().int().positive().optional(),
});

export const themeMetaSchema = z.object({
  /** The `data-theme` value. */
  id: z.string().min(1),
  modes: z.array(z.string()),
  densities: z.array(z.string()),
});

/**
 * One installable unit. A deliberate superset of shadcn's registry item where the fields overlap
 * (name, type, title, description, dependencies, registryDependencies, files, cssVars, docs,
 * categories, meta), plus tier, version, per-file hashes, an item integrity and requires.
 */
export const registryItemSchema = z.object({
  $schema: z.string().optional(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: itemNameSchema,
  version: versionSchema,
  type: itemTypeSchema,
  tier: tierSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  categories: z.array(z.string()).default([]),
  /** npm packages with semver ranges, merged into the consumer's package.json. */
  dependencies: dependencyMapSchema.default({}),
  devDependencies: dependencyMapSchema.default({}),
  /** Other registry items by name. A free item never depends on a pro one. */
  registryDependencies: z.array(itemNameSchema).default([]),
  requires: requiresSchema.default({}),
  files: z.array(itemFileSchema).min(1),
  /** Token additions: the CLI writes them as a generated style file. */
  cssVars: cssVarsSchema.optional(),
  theme: themeMetaSchema.optional(),
  /** Printed after install. */
  docs: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  /** `sha256-<base64>` over the canonical JSON of the item without this field. */
  integrity: z.string().regex(/^sha256-[A-Za-z0-9+/]+=*$/),
});
export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryItemInput = z.input<typeof registryItemSchema>;

/** What the public index says about an item: enough to resolve the graph, never any source. */
export const indexEntrySchema = z.object({
  name: itemNameSchema,
  type: itemTypeSchema,
  tier: tierSchema,
  version: versionSchema,
  /** Every published version, oldest first, so `update` can fetch the exact base of a merge. */
  versions: z.array(versionSchema).min(1),
  title: z.string(),
  description: z.string(),
  categories: z.array(z.string()).default([]),
  registryDependencies: z.array(itemNameSchema).default([]),
});
export type IndexEntry = z.infer<typeof indexEntrySchema>;

export const registryIndexSchema = z.object({
  $schema: z.string().optional(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: z.string().min(1),
  homepage: z.string().optional(),
  items: z.array(indexEntrySchema),
});
export type RegistryIndex = z.infer<typeof registryIndexSchema>;

/** JSON Schemas published next to the registry JSON, for editors and third-party tooling. */
export function jsonSchemas(): { item: unknown; index: unknown } {
  return {
    item: z.toJSONSchema(registryItemSchema, { io: 'input' }),
    index: z.toJSONSchema(registryIndexSchema, { io: 'input' }),
  };
}
