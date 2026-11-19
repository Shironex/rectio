import type { Metadata } from 'next';

import { NotFoundPage } from '@/components/pages/not-found';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return <NotFoundPage />;
}
