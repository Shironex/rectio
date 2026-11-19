import { ResetPassword as PlainResetPassword, type ResetPasswordStep } from '@rectio/blocks';
import { ResetPassword as MotionResetPassword } from '@rectio/blocks/motion';
import { useState } from 'react';

import { Brand } from './brand';
import type { DemoProps } from './demo';

/** `?step=sent|reset|done` opens a later step; the demo walks the flow from there. */
function firstStep(empty: boolean): ResetPasswordStep {
  const step = new URLSearchParams(window.location.search).get('step');
  if (step === 'sent' || step === 'reset' || step === 'done') return step;
  return empty ? 'request' : 'reset';
}

export function ResetPasswordDemo({ motion, empty }: DemoProps) {
  const ResetPassword = motion ? MotionResetPassword : PlainResetPassword;
  const [step, setStep] = useState(() => firstStep(empty));
  const [sentTo, setSentTo] = useState('tomasz@fernhill.io');
  return (
    <ResetPassword
      step={step}
      brand={step === 'request' ? <Brand /> : undefined}
      sentTo={sentTo}
      signIn={() => {
        setStep('request');
      }}
      onRequest={(email) => {
        setSentTo(email);
        setStep('sent');
      }}
      onResend={() => undefined}
      onRestart={() => {
        setStep('request');
      }}
      onReset={() => {
        setStep('done');
      }}
    />
  );
}
