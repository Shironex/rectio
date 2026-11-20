import type { Metadata } from 'next';

import { TwoFactorPage } from '@/components/auth/two-factor-page';

export const metadata: Metadata = { title: 'Two-factor check' };

export default function Page() {
  return <TwoFactorPage />;
}
