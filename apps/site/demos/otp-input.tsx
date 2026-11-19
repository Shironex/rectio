'use client';

import { Field, FieldDescription, FieldError, FieldLabel, OtpInput } from '@rectio/ui';
import { useState } from 'react';

/** The code the demo accepts. */
const EXPECTED = '482913';

export default function OtpInputDemo() {
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Field invalid={wrong}>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput
          groups={[3, 3]}
          value={code}
          onValueChange={(next) => {
            setCode(next);
            setWrong(false);
          }}
          onComplete={(value) => {
            setWrong(value !== EXPECTED);
          }}
        />
        <FieldDescription>Sent to +48 600 *** 123. Try {EXPECTED}.</FieldDescription>
        <FieldError>That code is not right. Check the latest message.</FieldError>
      </Field>
      <Field>
        <FieldLabel>Approval PIN</FieldLabel>
        <OtpInput length={4} mask />
        <FieldDescription>Needed to release payments over EUR 10,000.</FieldDescription>
      </Field>
    </div>
  );
}
