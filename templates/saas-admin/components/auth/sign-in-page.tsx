'use client';

import { GoogleLogoIcon, WindowsLogoIcon } from '@phosphor-icons/react';
import { SocialButton } from '@rectio/blocks';
import { SignIn } from '@rectio/blocks/motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePageState } from '../use-page-state';
import { sendMagicLink, signIn, signInWith } from './auth-api';
import { AuthAside, AuthScreen, ProductMark } from './auth-screen';

export function SignInPage() {
  const state = usePageState();
  // Keyed by the state, so ?state=error seeds the screen once the URL is read after hydration.
  return <SignInScreen key={state} failed={state === 'error'} />;
}

function SignInScreen({ failed }: { failed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(
    failed ? 'That email and password do not match an account.' : undefined,
  );
  const [linkSentTo, setLinkSentTo] = useState<string | undefined>(undefined);

  const provider = (name: 'google' | 'microsoft') => () => {
    void signInWith(name).then((result) => {
      if (result.ok) router.push('/two-factor');
      else setError(result.message);
    });
  };

  return (
    <AuthScreen>
      <SignIn
        brand={<ProductMark />}
        aside={<AuthAside />}
        title="Sign in to Lindwell"
        description="Welcome back. Use your work email."
        defaultEmail={failed ? 'ines@copperline.app' : ''}
        pending={pending}
        error={error}
        magicLinkSentTo={linkSentTo}
        social={
          <div className="grid gap-2 sm:grid-cols-2">
            <SocialButton
              icon={<GoogleLogoIcon aria-hidden weight="bold" />}
              onClick={provider('google')}
            >
              Google
            </SocialButton>
            <SocialButton
              icon={<WindowsLogoIcon aria-hidden weight="bold" />}
              onClick={provider('microsoft')}
            >
              Microsoft
            </SocialButton>
          </div>
        }
        onSubmit={(values) => {
          setPending(true);
          setError(undefined);
          void signIn(values).then((result) => {
            setPending(false);
            if (result.ok) router.push('/two-factor');
            else setError(result.message);
          });
        }}
        onMagicLink={(email) => {
          void sendMagicLink(email).then((result) => {
            if (result.ok) setLinkSentTo(email);
            else setError(result.message);
          });
        }}
        forgotPassword={() => {
          router.push('/reset-password');
        }}
        signUp={() => {
          router.push('/sign-up');
        }}
      />
    </AuthScreen>
  );
}
