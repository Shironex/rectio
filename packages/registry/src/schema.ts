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

/**
 * Target placeholder of a template file: the root of the project the template creates, not an
 * alias. `@project/app/page.tsx` lands at `<new project>/app/page.tsx`. Only template files use it.
 */
export const PROJECT_PLACEHOLDER = 'project';

/**
 * Where each alias points in a project made from a template (its tsconfig maps `@/*` to the root),
 * so the CLI writes kit items there and the build can check a template never collides with one.
 */
export const TEMPLATE_ALIAS_DIRS: Record<AliasKey, string> = {
  ui: 'components/ui',
  blocks: 'components/blocks',
  lib: 'lib',
  hooks: 'hooks',
  styles: 'styles/rectio',
};

export const itemNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'lowercase kebab-case, starting with a letter')
  .max(64);

/** Plain semver without build metadata: 1.2.3 or 1.2.3-beta.1. */
export const versionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'a semver version such as 1.2.3');

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'a lowercase hex sha256');

export const itemTypeSchema = z.enum([
  'component',
  'block',
  'theme',
  'skin',
  'lib',
  'hook',
  'style',
  'template',
]);
export type ItemType = z.infer<typeof itemTypeSchema>;

/**
 * `style`, `theme` and `skin` files are CSS the CLI imports from the project's CSS entry: themes
 * first, then skins, then styles, so a skin wins over a theme and the base layer (density, reduced
 * motion) wins over both at equal specificity.
 * `template` files make up a new project and are written once, by `rectio init --template`.
 */
export const fileTypeSchema = z.enum([
  'component',
  'block',
  'lib',
  'hook',
  'theme',
  'skin',
  'style',
  'template',
]);
export type FileType = z.infer<typeof fileTypeSchema>;

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

/** `@ui/button.tsx`: an alias placeholder (or `@project` for a template) and a safe relative path. */
const targetSchema = z
  .string()
  .regex(
    new RegExp(`^@(?:${[...ALIAS_KEYS, PROJECT_PLACEHOLDER].join('|')})/`),
    'starts with an alias placeholder',
  )
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

export const TEMPLATE_CATEGORIES = ['app', 'dashboard', 'marketing', 'docs'] as const;
export const templateCategorySchema = z.enum(TEMPLATE_CATEGORIES);
export type TemplateCategory = z.infer<typeof templateCategorySchema>;

/** What a template item says about the project it creates, beside its files. */
export const templateMetaSchema = z.object({
  category: templateCategorySchema,
  framework: z.enum(['next']),
  /** Routes of the app, for docs and the CLI's summary. */
  pages: z.array(z.string().min(1)).min(1),
  /** The registry items the template imports directly. */
  uses: z.array(itemNameSchema),
  /** Screenshot paths inside the template folder of the rectio repo (not shipped). */
  screenshots: z.array(z.string().min(1)),
});
export type TemplateMeta = z.infer<typeof templateMetaSchema>;

export const themeMetaSchema = z.object({
  /** The `data-theme` value. */
  id: z.string().min(1),
  modes: z.array(z.string()),
  densities: z.array(z.string()),
});

export const skinMetaSchema = z.object({
  /** The `data-skin` value. */
  id: z.string().min(1),
  /** Token names the skin sets, for docs and the MCP server. */
  tokens: z.array(z.string()),
});

/**
 * One installable unit. A superset of the common registry item shape where the fields overlap
 * (name, type, title, description, dependencies, registryDependencies, files, cssVars, docs,
 * categories, meta), plus version, per-file hashes, an item integrity and requires.
 */
export const registryItemSchema = z
  .object({
    $schema: z.string().optional(),
    schemaVersion: z.literal(SCHEMA_VERSION),
    name: itemNameSchema,
    version: versionSchema,
    type: itemTypeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    categories: z.array(z.string()).default([]),
    /** npm packages with semver ranges, merged into the consumer's package.json. */
    dependencies: dependencyMapSchema.default({}),
    devDependencies: dependencyMapSchema.default({}),
    /** Other registry items by name. */
    registryDependencies: z.array(itemNameSchema).default([]),
    requires: requiresSchema.default({}),
    files: z.array(itemFileSchema).min(1),
    /** Token additions: the CLI writes them as a generated style file. */
    cssVars: cssVarsSchema.optional(),
    theme: themeMetaSchema.optional(),
    skin: skinMetaSchema.optional(),
    template: templateMetaSchema.optional(),
    /** Printed after install. */
    docs: z.string().optional(),
    /** Why the item is going away and what to use instead. The CLI prints it as a warning. */
    deprecated: z.string().min(1).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    /** `sha256-<base64>` over the canonical JSON of the item without this field. */
    integrity: z.string().regex(/^sha256-[A-Za-z0-9+/]+=*$/),
  })
  .superRefine((item, ctx) => {
    // A template is a whole project: only template files, each under @project. Nothing else may
    // write outside the aliases.
    const isTemplate = item.type === 'template';
    if (isTemplate && item.template === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['template'],
        message: 'a template item needs template',
      });
    }
    item.files.forEach((file, index) => {
      const projectFile =
        file.type === 'template' && file.target.startsWith(`@${PROJECT_PLACEHOLDER}/`);
      if (isTemplate !== projectFile) {
        ctx.addIssue({
          code: 'custom',
          path: ['files', index],
          message: isTemplate
            ? 'a template file has type "template" and an @project target'
            : 'only a template item has template files or @project targets',
        });
      }
    });
  });
export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryItemInput = z.input<typeof registryItemSchema>;

/** What the public index says about an item: enough to resolve the graph, never any source. */
export const indexEntrySchema = z.object({
  name: itemNameSchema,
  type: itemTypeSchema,
  version: versionSchema,
  /** Every published version, oldest first, so `update` can fetch the exact base of a merge. */
  versions: z.array(versionSchema).min(1),
  title: z.string(),
  description: z.string(),
  categories: z.array(z.string()).default([]),
  registryDependencies: z.array(itemNameSchema).default([]),
  /** Set on an item that is going away: the reason and what to use instead. */
  deprecated: z.string().min(1).optional(),
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
