import type { Metadata } from 'next';

import { ContactPage } from '@/components/pages/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Book a demo, ask about plans or get help moving to Rostra.',
};

export default function Page() {
  return <ContactPage />;
}
