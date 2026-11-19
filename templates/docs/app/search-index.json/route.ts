import type { DocsSearchDocument } from '@rectio/blocks/docs';

import { getNav, getPages } from '@/lib/content';
import { searchDocuments } from '@/lib/search';

// Written once at build time to out/search-index.json; the search dialog fetches it on demand.
export const dynamic = 'force-static';

export function GET() {
  const documents: DocsSearchDocument[] = searchDocuments(getPages(), getNav());
  return Response.json(documents);
}
