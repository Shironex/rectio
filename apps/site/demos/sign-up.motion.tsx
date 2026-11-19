'use client';

import { GoogleLogoIcon, HexagonIcon } from '@phosphor-icons/react';
import { SocialButton } from '@rectio/blocks';
import { SignUp } from '@rectio/blocks/motion';
import { useState } from 'react';

/** Your app creates the account; the block checks the fields and the password rules first. */
export default function SignUpMotionDemo() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  return (
    <SignUp
      brand={
        <span className="flex items-center gap-2 font-display text-lg font-heading">
          <HexagonIcon aria-hidden weight="duotone" className="size-6 text-accent" />
          Fernhill
        </span>
      }
      pending={pending}
      error={error}
      social={
        <SocialButton icon={<GoogleLogoIcon aria-hidden weight="bold" />}>
          Continue with Google
        </SocialButton>
      }
      terms="#terms"
      privacy="#privacy"
      signIn="#sign-in"
      onSubmit={() => {
        setPending(true);
        setError(undefined);
        setTimeout(() => {
          setPending(false);
          setError('An account with this email already exists. Sign in instead.');
        }, 900);
      }}
    />
  );
}
