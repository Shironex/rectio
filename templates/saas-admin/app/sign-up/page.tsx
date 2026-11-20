import type { Metadata } from 'next';

import { SignUpPage } from '@/components/auth/sign-up-page';

export const metadata: Metadata = { title: 'Create an account' };

export default function Page() {
  return <SignUpPage />;
}
