import * as z from 'zod';

import { itemNameSchema, templateCategorySchema } from './schema.ts';

/**
 * `template.json` at the root of each folder under `templates/`. The registry build turns it into a
 * template item; the site reads it for the docs pages and the landing gallery, so a new template
 * shows up everywhere without touching either.
 */
export const templateManifestSchema = z.object({
  /** Folder name and registry item name: `rectio init --template <name>`. */
  name: itemNameSchema,
  title: z.string().min(1),
  /** One sentence. */
  description: z.string().min(1),
  category: templateCategorySchema,
  /** App routes, `/invoices/[id]` style for dynamic ones. */
  pages: z.array(z.string().startsWith('/')).min(1),
  /** Registry items the template imports directly (checked against its imports by the build). */
  uses: z.array(itemNameSchema),
  /** Paths inside the template folder: desktop light, desktop dark, phone. */
  screenshots: z.array(z.string().regex(/^screenshots\/[\w.-]+\.(?:png|webp)$/)).min(1),
});
export type TemplateManifest = z.infer<typeof templateManifestSchema>;
