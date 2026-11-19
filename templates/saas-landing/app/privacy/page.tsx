import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/pages/legal';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How Rostra collects, uses and protects personal data. A template to replace with your own policy.',
};

export default function Page() {
  return <LegalDocPage doc="privacy" />;
}
