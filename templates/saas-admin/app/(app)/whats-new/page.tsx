import type { Metadata } from 'next';

import { WhatsNewPage } from '@/components/whats-new/whats-new-page';

export const metadata: Metadata = { title: 'What’s new' };

export default function Page() {
  return <WhatsNewPage />;
}
