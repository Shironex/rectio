'use client';

import { type ResetPasswordStep } from '@rectio/blocks';
import { ResetPassword } from '@rectio/blocks/motion';
import { useState } from 'react';

/** The app holds the step and moves it on; in your app the reset step opens from the emailed link. */
export default function ResetPasswordMotionDemo() {
  const [step, setStep] = useState<ResetPasswordStep>('request');
  const [sentTo, setSentTo] = useState<string | undefined>();
  return (
    <ResetPassword
      step={step}
      sentTo={sentTo}
      signIn={() => {
        setStep('request');
      }}
      onRequest={(email) => {
        setSentTo(email);
        setStep('sent');
      }}
      onResend={() => {
        // Here the demo jumps ahead, as if the link had been opened.
        setStep('reset');
      }}
      onRestart={() => {
        setStep('request');
      }}
      onReset={() => {
        setStep('done');
      }}
    />
  );
}
