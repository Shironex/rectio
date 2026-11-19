import type { Metadata } from 'next';

import { PricingPage } from '@/components/pages/pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Free for teams of up to ten. Team and Business plans priced per person on the rota.',
};

export default function Page() {
  return <PricingPage />;
}
