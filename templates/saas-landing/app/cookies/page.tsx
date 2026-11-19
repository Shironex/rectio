import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/pages/legal';

export const metadata: Metadata = { title: 'Cookie policy' };

export default function Page() {
  return <LegalDocPage doc="cookies" />;
}
