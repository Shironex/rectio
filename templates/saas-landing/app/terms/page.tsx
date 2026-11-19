import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/pages/legal';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms for using Rostra. A template to replace with your own terms.',
};

export default function Page() {
  return <LegalDocPage doc="terms" />;
}
