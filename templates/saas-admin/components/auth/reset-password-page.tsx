'use client';

import type { ResetPasswordStep } from '@rectio/blocks';
import { ResetPassword } from '@rectio/blocks/motion';
import { useState } from 'react';

import { useQueryParam } from '../use-page-state';
import { requestReset, resetPassword } from './auth-api';
import { AuthAside, AuthScreen, ProductMark } from './auth-screen';

/**
 * Asks for the email, says the link is on its way, then sets the new password. The link in the
 * email opens this page with `?step=reset` (and your token): read the token here and send it with
 * the new password.
 */
export function ResetPasswordPage() {
  const linkStep = useQueryParam('step');
  return <ResetScreen key={linkStep ?? 'request'} fromLink={linkStep === 'reset'} />;
}

function ResetScreen({ fromLink }: { fromLink: boolean }) {
  const [step, setStep] = useState<ResetPasswordStep>(fromLink ? 'reset' : 'request');
  const [sentTo, setSentTo] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <AuthScreen>
      <ResetPassword
        brand={<ProductMark />}
        aside={<AuthAside />}
        step={step}
        sentTo={sentTo}
        pending={pending}
        error={error}
        onRequest={(email) => {
          setPending(true);
          setError(undefined);
          void requestReset(email).then((result) => {
            setPending(false);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setSentTo(email);
            setStep('sent');
          });
        }}
        onResend={() => {
          if (sentTo !== undefined) void requestReset(sentTo);
        }}
        onRestart={() => {
          setStep('request');
        }}
        onReset={(password) => {
          setPending(true);
          setError(undefined);
          void resetPassword(password).then((result) => {
            setPending(false);
            if (result.ok) setStep('done');
            else setError(result.message);
          });
        }}
        signIn="/sign-in"
      />
    </AuthScreen>
  );
}
