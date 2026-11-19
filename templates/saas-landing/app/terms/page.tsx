import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/pages/legal';

export const metadata: Metadata = { title: 'Terms of service' };

export default function Page() {
  return <LegalDocPage doc="terms" />;
}
