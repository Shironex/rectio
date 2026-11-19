import type { Metadata } from 'next';

import { SignInForm } from '@/components/sign-in/sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function Page() {
  return <SignInForm />;
}
