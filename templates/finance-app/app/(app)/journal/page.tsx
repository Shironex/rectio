import type { Metadata } from 'next';

import { JournalPage } from '@/components/journal/journal-page';

export const metadata: Metadata = { title: 'Journal' };

export default function Page() {
  return <JournalPage />;
}
