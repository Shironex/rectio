import { loader } from 'fumadocs-core/source';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';
import { z } from 'zod';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // `pro: true` marks a page whose subject is in rectio Pro.
    schema: pageSchema.extend({ pro: z.boolean().optional() }),
  },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
