import { SITE_URL } from '@rectio/registry';

import { readChangelog } from '@/lib/changelog';
import { changelogFeed } from '@/lib/changelog-feed';

// Rendered once at build time into out/changelog.xml: the export has no server.
export const dynamic = 'force-static';

export function GET() {
  return new Response(changelogFeed(readChangelog(), SITE_URL), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}
