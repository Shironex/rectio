import type { Metadata } from 'next';

import { AboutPage } from '@/components/pages/about';

export const metadata: Metadata = {
  title: 'About',
  description: 'The people building Rostra, what we believe and the roles we are hiring for.',
};

export default function Page() {
  return <AboutPage />;
}
