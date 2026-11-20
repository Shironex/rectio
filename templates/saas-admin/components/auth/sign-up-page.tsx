'use client';

import { GoogleLogoIcon, WindowsLogoIcon } from '@phosphor-icons/react';
import { SocialButton } from '@rectio/blocks';
import { SignUp } from '@rectio/blocks/motion';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@rectio/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signInWith, signUp } from './auth-api';
import { AuthAside, AuthScreen, ProductMark } from './auth-screen';

/** Point these at your published terms and privacy notice; the sample shows a summary. */
const LEGAL = {
  terms: {
    title: 'Terms of service',
    summary:
      'You own your tickets and customer data. We keep the service running, back it up daily and give notice before any change to these terms.',
  },
  privacy: {
    title: 'Privacy notice',
    summary:
      'We store what your customers send you only to run your help desk, never sell it, and delete it 30 days after you close the workspace.',
  },
} as const;

export function SignUpPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [taken, setTaken] = useState(false);
  const [legal, setLegal] = useState<keyof typeof LEGAL | null>(null);

  return (
    <AuthScreen>
      <SignUp
        brand={<ProductMark />}
        aside={<AuthAside />}
        title="Start your help desk"
        description="Free for 14 days on the Team plan. No card needed."
        pending={pending}
        error={error}
        emailTaken={taken}
        social={
          <div className="grid gap-2 sm:grid-cols-2">
            {(['google', 'microsoft'] as const).map((provider) => (
              <SocialButton
                key={provider}
                icon={
                  provider === 'google' ? (
                    <GoogleLogoIcon aria-hidden weight="bold" />
                  ) : (
                    <WindowsLogoIcon aria-hidden weight="bold" />
                  )
                }
                onClick={() => {
                  void signInWith(provider).then((result) => {
                    if (result.ok) router.push('/?state=empty');
                  });
                }}
              >
                {provider === 'google' ? 'Google' : 'Microsoft'}
              </SocialButton>
            ))}
          </div>
        }
        terms={() => {
          setLegal('terms');
        }}
        privacy={() => {
          setLegal('privacy');
        }}
        signIn={() => {
          router.push('/sign-in');
        }}
        onSubmit={(values) => {
          setPending(true);
          setError(undefined);
          setTaken(false);
          void signUp(values).then((result) => {
            setPending(false);
            if (result.ok) router.push('/?state=empty');
            else if ('taken' in result) setTaken(true);
            else setError(result.message);
          });
        }}
      />
      <Dialog
        open={legal !== null}
        onOpenChange={(open) => {
          if (!open) setLegal(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{legal === null ? '' : LEGAL[legal].title}</DialogTitle>
            <DialogDescription>{legal === null ? '' : LEGAL[legal].summary}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthScreen>
  );
}
