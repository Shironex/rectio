import type { Metadata } from 'next';

import { FeaturesPage } from '@/components/pages/features';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Rota builder, open shifts, swaps, time off and hours: everything a shift team needs in one place.',
};

export default function Page() {
  return <FeaturesPage />;
}
