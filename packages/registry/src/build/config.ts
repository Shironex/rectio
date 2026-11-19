import type { CssVars, Tier } from '../schema.ts';

export type SourceItemType = 'component' | 'block' | 'lib' | 'hook';

/** One item built from source files. */
export interface SourceItemConfig {
  name: string;
  type: SourceItemType;
  tier: Tier;
  version: string;
  title: string;
  description: string;
  categories?: string[];
  /** Source files relative to `sourceDir`; tests and stories are never listed here. */
  files: string[];
  /**
   * Add a `'use client'` directive to the item's .tsx files. Left unset, the build decides: a .tsx
   * file that imports a React hook, createContext or a UI package gets one.
   */
  client?: boolean;
  docs?: string;
  cssVars?: CssVars;
  meta?: Record<string, unknown>;
}

export interface ThemeItemConfig {
  /** The `data-theme` id in @rectio/tokens. The item is named `theme-<id>`. */
  id: string;
  tier: Tier;
  version: string;
  title: string;
  description: string;
}

export interface TokensItemConfig {
  version: string;
  title: string;
  description: string;
}

/**
 * A second source tree, such as an add-on package built on the first. Its imports of a package in
 * `workspacePackages` become registry dependencies on the items that export each name.
 */
export interface AddonSourceConfig {
  /** Root of the add-on sources, such as packages/motion/src. */
  sourceDir: string;
  /**
   * Folder its files install into under their alias, so they never clash with the base items:
   * `motion` puts motion's button/button.tsx at `@ui/motion/button.tsx`.
   */
  targetFolder: string;
  /** Same rule as the base tree: every folder directly under `sourceDir` belongs to an item. */
  requireEveryFolder?: boolean;
  items: SourceItemConfig[];
}

export interface RegistryConfig {
  name: string;
  homepage?: string;
  /** Root of the component sources, such as packages/ui/src. */
  sourceDir: string;
  /** package.json files whose ranges give the version of every npm import. First match wins. */
  packageJsons: string[];
  /**
   * Folders directly under `sourceDir` that must each belong to an item. A folder that is not
   * listed by any item fails the build, so a new component is never silently left out.
   */
  requireEveryFolder?: boolean;
  /** The token package (its dist/ must be built). Omit to build components only. */
  tokens?: {
    dir: string;
    item: TokensItemConfig;
    themes: ThemeItemConfig[];
  };
  items: SourceItemConfig[];
  /** Add-on trees built on top of `sourceDir`. */
  addons?: AddonSourceConfig[];
  /**
   * Workspace packages an add-on imports, each mapped to its barrel file (the package's index.ts).
   * The barrel's re-exports say which base item owns each imported name.
   */
  workspacePackages?: Record<string, string>;
}

export function defineRegistry(config: RegistryConfig): RegistryConfig {
  return config;
}
