import { SignUp as PlainSignUp, SocialButton } from '@rectio/blocks';
import { SignUp as MotionSignUp } from '@rectio/blocks/motion';
import { GithubLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { Brand } from './brand';
import type { DemoProps } from './demo';

export function SignUpDemo({ motion, empty }: DemoProps) {
  const SignUp = motion ? MotionSignUp : PlainSignUp;
  const [pending, setPending] = useState(false);
  return (
    <SignUp
      brand={<Brand />}
      pending={pending}
      error={empty ? undefined : 'An account with this email already exists. Sign in instead.'}
      defaultEmail={empty ? '' : 'margot.leclerc@fernhill.io'}
      social={
        empty ? undefined : (
          <>
            <SocialButton icon={<GoogleLogoIcon aria-hidden weight="bold" />}>
              Continue with Google
            </SocialButton>
            <SocialButton icon={<GithubLogoIcon aria-hidden weight="bold" />}>
              Continue with GitHub
            </SocialButton>
          </>
        )
      }
      terms={() => undefined}
      privacy={() => undefined}
      signIn={() => undefined}
      onSubmit={() => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
        }, 1200);
      }}
    />
  );
}
