'use client';

import { AmountInput, Button, Field, FieldDescription, FieldLabel } from '@rectio/ui';
import { useState } from 'react';

const RECEIPT_TOTAL = 412.8;

export default function AmountInputDemo() {
  const [amount, setAmount] = useState<number | null>(null);
  const [zloty, setZloty] = useState<number | null>(1749.5);

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
        <FieldDescription>Lufthansa, FRA to WAW. Arrow keys step by one cent.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Amount, PLN</FieldLabel>
        <AmountInput currency="PLN" locale="pl-PL" value={zloty} onValueChange={setZloty} />
        <FieldDescription>
          Polish grouping and decimals, the symbol after the figure.
        </FieldDescription>
      </Field>
    </div>
  );
}
