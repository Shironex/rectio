'use client';

import { GithubLogoIcon, GoogleLogoIcon, HexagonIcon } from '@phosphor-icons/react';
import { SignUp, SocialButton } from '@rectio/blocks';
import { useState } from 'react';

/** Your app creates the account; the block checks the fields and the password rules first. */
export default function SignUpDemo() {
  const [pending, setPending] = useState(false);
  const [taken, setTaken] = useState(false);
  return (
    <SignUp
      brand={
        <span className="flex items-center gap-2 font-display text-lg font-heading">
          <HexagonIcon aria-hidden weight="duotone" className="size-6 text-accent" />
          Fernhill
        </span>
      }
      pending={pending}
      emailTaken={taken}
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
      terms="#terms"
      privacy="#privacy"
      signIn="#sign-in"
      onSubmit={() => {
        setPending(true);
        setTaken(false);
        setTimeout(() => {
          setPending(false);
          setTaken(true);
        }, 900);
      }}
    />
  );
}
