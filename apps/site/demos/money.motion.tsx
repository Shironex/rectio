'use client';

import { Button, Money } from '@rectio/motion';
import { useState } from 'react';

const LINES = [
  { label: 'Lufthansa, FRA to WAW', amount: 412.8 },
  { label: 'Hotel Bristol, two nights', amount: 538 },
  { label: 'Hotel Bristol, refund', amount: -61 },
];
const TRAIN = { label: 'Deutsche Bahn', amount: 89.9 };

export default function MoneyMotionDemo() {
  const [withTrain, setWithTrain] = useState(false);
  const lines = withTrain ? [...LINES, TRAIN] : LINES;
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <dl className="flex flex-col">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-fg-muted">{line.label}</dt>
            <dd>
              <Money amount={line.amount} currency="EUR" locale="en-IE" tone="auto" />
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 pt-3">
          <dt className="font-medium">Total</dt>
          <dd>
            <Money
              amount={total}
              currency="EUR"
              locale="en-IE"
              quietCurrency
              className="text-2xl font-strong"
            />
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setWithTrain((on) => !on);
          }}
        >
          {withTrain ? 'Remove Deutsche Bahn' : 'Add Deutsche Bahn'}
        </Button>
        <span className="text-sm text-fg-muted">
          Ledger style: <Money amount={-61} currency="EUR" locale="en-IE" accounting />
        </span>
      </div>
    </div>
  );
}
