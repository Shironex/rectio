'use client';

import { GithubLogoIcon, GoogleLogoIcon, HexagonIcon } from '@phosphor-icons/react';
import { SignIn, SocialButton } from '@rectio/blocks';
import { useState } from 'react';

/** Your app signs in; the block reports what was typed and shows what you pass back. */
export default function SignInDemo() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | undefined>();
  return (
    <SignIn
      brand={
        <span className="flex items-center gap-2 font-display text-lg font-heading">
          <HexagonIcon aria-hidden weight="duotone" className="size-6 text-accent" />
          Fernhill
        </span>
      }
      pending={pending}
      error={error}
      magicLinkSentTo={sentTo}
      social={
        <>
          <SocialButton icon={<GoogleLogoIcon aria-hidden weight="bold" />}>
            Continue with Google
          </SocialButton>
          <SocialButton icon={<GithubLogoIcon aria-hidden weight="bold" />}>
            Continue with GitHub
          </SocialButton>
        </>
      }
      forgotPassword="#forgot-password"
      signUp="#sign-up"
      onSubmit={() => {
        setPending(true);
        setError(undefined);
        setTimeout(() => {
          setPending(false);
          setError('That email and password do not match. Try again or reset your password.');
        }, 900);
      }}
      onMagicLink={setSentTo}
    />
  );
}
