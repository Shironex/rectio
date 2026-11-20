'use client';

import { AmountInput, Button } from '@rectio/motion';
import { Field, FieldDescription, FieldLabel } from '@rectio/ui';
import { useState } from 'react';

const RECEIPT_TOTAL = 412.8;

export default function AmountInputMotionDemo() {
  const [amount, setAmount] = useState<number | null>(null);
  const [pounds, setPounds] = useState<number | null>(1749.5);

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Field>
        <FieldLabel>Amount, EUR</FieldLabel>
        <div className="flex gap-2">
          <AmountInput currency="EUR" locale="en-IE" value={amount} onValueChange={setAmount} />
          <Button
            variant="secondary"
            onClick={() => {
              setAmount(RECEIPT_TOTAL);
            }}
          >
            Use receipt
          </Button>
        </div>
        <FieldDescription>Lufthansa, FRA to DUB. Arrow keys step by one cent.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Amount, GBP</FieldLabel>
        <AmountInput currency="GBP" locale="en-GB" value={pounds} onValueChange={setPounds} />
        <FieldDescription>Grouping, decimals and the symbol follow the locale.</FieldDescription>
      </Field>
    </div>
  );
}
