'use client';

import { HexagonIcon } from '@phosphor-icons/react';
import { TwoFactor } from '@rectio/blocks';
import { useState } from 'react';

/** Any code other than 000000 is refused here, to show the error; your server checks the real one. */
export default function TwoFactorDemo() {
  const [sentAt, setSentAt] = useState(() => new Date());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  return (
    <TwoFactor
      brand={
        <span className="flex items-center gap-2 font-display text-lg font-heading">
          <HexagonIcon aria-hidden weight="duotone" className="size-6 text-accent" />
          Fernhill
        </span>
      }
      method="sms"
      destination="+44 7700 900829"
      sentAt={sentAt}
      pending={pending}
      error={error}
      rememberLabel="Trust this device for 30 days"
      back="#sign-in"
      onResend={() => {
        setSentAt(new Date());
        setError(undefined);
      }}
      onUseBackupCode={(code) => {
        console.info('backup code', code);
      }}
      onVerify={(code) => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
          setError(
            code === '000000' ? undefined : 'That code is not right. Check it and try again.',
          );
        }, 700);
      }}
    />
  );
}
