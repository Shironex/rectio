'use client';

import { NumberField } from '@rectio/motion';
import { Field, FieldDescription, FieldLabel } from '@rectio/ui';
import { useState } from 'react';

export default function NumberFieldMotionDemo() {
  const [seats, setSeats] = useState<number | null>(12);
  const [discount, setDiscount] = useState<number | null>(0.1);
  const [retention, setRetention] = useState<number | null>(30);

  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Field>
        <FieldLabel>Seats</FieldLabel>
        <NumberField value={seats} onValueChange={setSeats} min={1} max={250} unit="seats" />
        <FieldDescription>Billed per seat each month.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Volume discount</FieldLabel>
        <NumberField
          value={discount}
          onValueChange={setDiscount}
          min={0}
          max={0.5}
          step={0.01}
          largeStep={0.05}
          locale="en-IE"
          format={{ style: 'percent' }}
        />
      </Field>
      <Field>
        <FieldLabel>Keep audit logs for</FieldLabel>
        <NumberField
          value={retention}
          onValueChange={setRetention}
          min={7}
          max={365}
          step={1}
          largeStep={30}
          locale="en-IE"
          format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
        />
        <FieldDescription>Page Up and Page Down step by 30 days.</FieldDescription>
      </Field>
    </div>
  );
}
