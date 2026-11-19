import { SocialButton, SignIn as PlainSignIn } from '@rectio/blocks';
import { SignIn as MotionSignIn } from '@rectio/blocks/motion';
import { GithubLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { Brand } from './brand';
import type { DemoProps } from './demo';

export function SignInDemo({ motion, empty }: DemoProps) {
  const SignIn = motion ? MotionSignIn : PlainSignIn;
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | undefined>();
  return (
    <SignIn
      brand={<Brand />}
      pending={pending}
      magicLinkSentTo={sentTo}
      error={empty ? undefined : 'That email and password do not match. Try again or reset it.'}
      defaultEmail={empty ? '' : 'ines.duarte@fernhill.io'}
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
      forgotPassword={() => undefined}
      signUp={() => undefined}
      onSubmit={() => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
        }, 1200);
      }}
      onMagicLink={(email) => {
        setSentTo(email);
      }}
    />
  );
}
