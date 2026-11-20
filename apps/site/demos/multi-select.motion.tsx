'use client';

import { MultiSelect, MultiSelectContent, MultiSelectInput, MultiSelectItem } from '@rectio/motion';
import { Field, FieldDescription, FieldLabel } from '@rectio/ui';
import { useState } from 'react';

interface Approver {
  value: string;
  label: string;
  role: string;
}

const APPROVERS: Approver[] = [
  { value: 'ifraser', label: 'Isla Fraser', role: 'Finance' },
  { value: 'bokafor', label: 'Ben Okafor', role: 'Operations' },
  { value: 'cmartin', label: 'Chloe Martin', role: 'Legal' },
  { value: 'dpatel', label: 'Dev Patel', role: 'Engineering' },
  { value: 'elindqvist', label: 'Eva Lindqvist', role: 'Finance' },
  { value: 'fmoreau', label: 'Félix Moreau', role: 'Sales' },
];

export default function MultiSelectMotionDemo() {
  const [approvers, setApprovers] = useState<Approver[]>(APPROVERS.slice(0, 2));

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Approvers</FieldLabel>
      <MultiSelect items={APPROVERS} value={approvers} onValueChange={setApprovers} selectAll>
        <MultiSelectInput placeholder="Add approvers" maxChips={3} />
        <MultiSelectContent>
          {(item: Approver) => (
            <MultiSelectItem key={item.value} value={item} hint={item.role}>
              {item.label}
            </MultiSelectItem>
          )}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>Each approver signs off on purchases over 5,000 EUR.</FieldDescription>
    </Field>
  );
}
