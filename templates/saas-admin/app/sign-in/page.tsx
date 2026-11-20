import type { Metadata } from 'next';

import { SignInPage } from '@/components/auth/sign-in-page';

export const metadata: Metadata = { title: 'Sign in' };

export default function Page() {
  return <SignInPage />;
}
