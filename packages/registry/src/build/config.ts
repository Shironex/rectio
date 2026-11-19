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
}

export function defineRegistry(config: RegistryConfig): RegistryConfig {
  return config;
}
