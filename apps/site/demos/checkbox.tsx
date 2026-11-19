'use client';

import { Checkbox, Money } from '@rectio/ui';
import { useState } from 'react';

const RECEIPTS = [
  { id: 'lufthansa', label: 'Lufthansa, 3 Mar', amount: 412.8 },
  { id: 'bristol', label: 'Hotel Bristol, 4 Mar', amount: 538 },
  { id: 'bahn', label: 'Deutsche Bahn, 7 Mar', amount: 89.9 },
];

export default function CheckboxDemo() {
  const [picked, setPicked] = useState<string[]>(['lufthansa']);
  const all = picked.length === RECEIPTS.length;

  return (
    <fieldset className="flex w-full max-w-xs flex-col gap-3">
      <legend className="mb-3 text-sm font-medium">Receipts to attach</legend>
      <label className="flex items-center gap-2.5 border-b border-line pb-3">
        <Checkbox
          checked={all}
          indeterminate={picked.length > 0 && !all}
          onCheckedChange={(checked) => {
            setPicked(checked ? RECEIPTS.map((r) => r.id) : []);
          }}
        />
        All receipts
      </label>
      {RECEIPTS.map((receipt) => (
        <label key={receipt.id} className="flex items-center gap-2.5">
          <Checkbox
            checked={picked.includes(receipt.id)}
            onCheckedChange={(checked) => {
              setPicked((list) =>
                checked ? [...list, receipt.id] : list.filter((id) => id !== receipt.id),
              );
            }}
          />
          <span className="flex-1">{receipt.label}</span>
          <Money amount={receipt.amount} currency="EUR" locale="en-IE" className="text-fg-muted" />
        </label>
      ))}
    </fieldset>
  );
}
