import type { Metadata } from 'next';

import { DevelopersPage } from '@/components/developers/developers-page';

export const metadata: Metadata = { title: 'API keys' };

export default function Page() {
  return <DevelopersPage />;
}
