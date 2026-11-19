import * as z from 'zod';

import { ALIAS_KEYS, type AliasKey } from './schema.ts';

export const FRAMEWORKS = ['vite', 'next', 'tanstack-start'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

const aliasesShape = Object.fromEntries(
  ALIAS_KEYS.map((key) => [key, z.string().min(1)]),
) as Record<AliasKey, z.ZodString>;

/**
 * rectio.json, the CLI's project config. Committed with the project, so it never holds a secret.
 * Lives here so the registry can publish its JSON Schema next to the item schema.
 */
export const configSchema = z.object({
  $schema: z.string().optional(),
  schemaVersion: z.literal(1),
  /** Base URL of the registry: https://, http://localhost or file://. */
  registry: z.string().min(1),
  framework: z.enum(FRAMEWORKS),
  /** The CSS file that imports Tailwind, project relative. */
  css: z.string().min(1),
  /** The data-theme the app uses by default. */
  theme: z.string().min(1),
  /** Import specifiers per alias key; each must resolve through tsconfig paths. */
  aliases: z.object(aliasesShape),
});
export type RectioConfig = z.infer<typeof configSchema>;
