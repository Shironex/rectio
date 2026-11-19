'use client';

import { Field, FieldDescription, FieldLabel, Textarea } from '@rectio/ui';
import { useState } from 'react';

export default function TextareaDemo() {
  const [note, setNote] = useState(
    'Client dinner after the Q3 review with Northwind. Receipt attached; the amount is over the meal limit because of the group size.',
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <Field>
        <FieldLabel>Note for the approver</FieldLabel>
        <Textarea
          value={note}
          onValueChange={setNote}
          minRows={2}
          maxRows={6}
          maxLength={240}
          showCount
        />
        <FieldDescription>Grows with the text up to six lines.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel optional>Internal comment</FieldLabel>
        <Textarea placeholder="Only finance sees this" minRows={3} />
      </Field>
    </div>
  );
}
