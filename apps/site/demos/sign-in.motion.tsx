'use client';

import { GithubLogoIcon, GoogleLogoIcon, HexagonIcon } from '@phosphor-icons/react';
import { SocialButton } from '@rectio/blocks';
import { SignIn } from '@rectio/blocks/motion';
import { useState } from 'react';

/** Your app signs in; the block reports what was typed and shows what you pass back. */
export default function SignInMotionDemo() {
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
          <SocialButton
            aria-label="Continue with Google"
            icon={<GoogleLogoIcon aria-hidden weight="bold" />}
          >
            Google
          </SocialButton>
          <SocialButton
            aria-label="Continue with GitHub"
            icon={<GithubLogoIcon aria-hidden weight="bold" />}
          >
            GitHub
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
