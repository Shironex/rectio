'use client';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  TimeField,
  type TimeValue,
} from '@rectio/ui';
import { useState } from 'react';

const OPENS = { hour: 8, minute: 0 };
const CLOSES = { hour: 18, minute: 0 };

export default function TimeFieldDemo() {
  const [starts, setStarts] = useState<TimeValue | null>({ hour: 9, minute: 30 });
  const [pickup, setPickup] = useState<TimeValue | null>({ hour: 14, minute: 0 });
  const [cutOff, setCutOff] = useState<TimeValue | null>({ hour: 17, minute: 30 });
  const late = cutOff !== null && cutOff.hour * 60 + cutOff.minute > CLOSES.hour * 60;

  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Field>
        <FieldLabel>Meeting starts</FieldLabel>
        <TimeField locale="en-GB" value={starts} onValueChange={setStarts} />
        <FieldDescription>A 24 hour clock, from the en-GB locale.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Courier pickup</FieldLabel>
        <TimeField locale="en-US" step={15} value={pickup} onValueChange={setPickup} />
        <FieldDescription>A 12 hour clock, in 15 minute steps.</FieldDescription>
      </Field>
      <Field invalid={late}>
        <FieldLabel>Payment cut-off</FieldLabel>
        <TimeField
          locale="en-GB"
          min={OPENS}
          max={CLOSES}
          value={cutOff}
          onValueChange={setCutOff}
        />
        {late ? (
          <FieldError>The bank accepts payments from 08:00 to 18:00.</FieldError>
        ) : (
          <FieldDescription>Between 08:00 and 18:00.</FieldDescription>
        )}
      </Field>
    </div>
  );
}
