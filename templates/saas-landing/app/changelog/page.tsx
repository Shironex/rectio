import type { Metadata } from 'next';

import { ChangelogPage } from '@/components/pages/changelog';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Every Rostra release, newest first.',
};

export default function Page() {
  return <ChangelogPage />;
}
