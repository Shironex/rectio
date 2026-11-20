'use client';

import { TwoFactor } from '@rectio/blocks/motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePageState } from '../use-page-state';
import { verifyBackupCode, verifyCode } from './auth-api';
import { AuthAside, AuthScreen, ProductMark } from './auth-screen';

export function TwoFactorPage() {
  const state = usePageState();
  return <TwoFactorScreen key={state} failed={state === 'error'} />;
}

function TwoFactorScreen({ failed }: { failed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(
    failed ? 'That code has expired. Use the newest one in your app.' : undefined,
  );

  const done = (result: Awaited<ReturnType<typeof verifyCode>>) => {
    setPending(false);
    if (result.ok) router.push('/');
    else setError(result.message);
  };

  return (
    <AuthScreen>
      <TwoFactor
        brand={<ProductMark />}
        aside={<AuthAside />}
        title="Enter your code"
        method="app"
        autoFocus
        pending={pending}
        error={error}
        rememberLabel="Trust this browser for 30 days"
        onVerify={(code) => {
          setPending(true);
          setError(undefined);
          void verifyCode(code).then(done);
        }}
        onUseBackupCode={(code) => {
          setPending(true);
          setError(undefined);
          void verifyBackupCode(code).then(done);
        }}
        back={() => {
          router.push('/sign-in');
        }}
      />
    </AuthScreen>
  );
}
