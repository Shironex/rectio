import { TwoFactor as PlainTwoFactor } from '@rectio/blocks';
import { TwoFactor as MotionTwoFactor } from '@rectio/blocks/motion';
import { useState } from 'react';

import type { DemoProps } from './demo';

export function TwoFactorDemo({ motion, empty }: DemoProps) {
  const TwoFactor = motion ? MotionTwoFactor : PlainTwoFactor;
  const [sentAt, setSentAt] = useState(() => new Date());
  const [pending, setPending] = useState(false);
  return (
    <TwoFactor
      method={empty ? 'app' : 'sms'}
      destination="+44 7700 900829"
      sentAt={sentAt}
      pending={pending}
      error={empty ? undefined : 'That code has expired. Send a new one and try again.'}
      rememberLabel="Trust this device for 30 days"
      back={() => undefined}
      onResend={() => {
        setSentAt(new Date());
      }}
      onUseBackupCode={() => undefined}
      onVerify={() => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
        }, 1200);
      }}
    />
  );
}
