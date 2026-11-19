'use client';

import { Field, FieldDescription, FieldError, FieldLabel, Input } from '@rectio/ui';
import { useState } from 'react';

export default function FieldDemo() {
  const [merchant, setMerchant] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = touched && merchant.trim() === '';

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Field invalid={missing}>
        <FieldLabel>Merchant</FieldLabel>
        <Input
          value={merchant}
          onValueChange={setMerchant}
          onBlur={() => {
            setTouched(true);
          }}
        />
        <FieldDescription>As printed on the receipt.</FieldDescription>
        {missing && <FieldError>Enter the merchant name.</FieldError>}
      </Field>
      <Field>
        <FieldLabel optional>Note</FieldLabel>
        <Input defaultValue="Client, 3 guests" />
        <FieldDescription>Who attended, or what it was for.</FieldDescription>
      </Field>
    </div>
  );
}
