import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/pages/legal';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description:
    'The cookies Rostra uses and how to change your choice. A template to replace with your own policy.',
};

export default function Page() {
  return <LegalDocPage doc="cookies" />;
}
