import type { Metadata } from 'next';

import { BlogPage } from '@/components/pages/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Customer stories, guides to fair rotas and product news from Rostra.',
};

export default function Page() {
  return <BlogPage />;
}
