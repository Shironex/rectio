'use client';

import { SelectContent, SelectItem } from '@rectio/motion';
import {
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectGroup,
  SelectTrigger,
} from '@rectio/ui';
import { useState } from 'react';

/** Expense categories with the ledger account each one posts to. */
const CATEGORIES = [
  { value: 'flights', label: 'Flights', account: '6110', group: 'Travel' },
  { value: 'rail', label: 'Rail', account: '6120', group: 'Travel' },
  { value: 'hotels', label: 'Hotels', account: '6130', group: 'Travel' },
  { value: 'meals', label: 'Client meals', account: '6210', group: 'Meals' },
  { value: 'software', label: 'Software', account: '6410', group: 'Tools' },
  { value: 'office', label: 'Office supplies', account: '6420', group: 'Tools' },
] as const;
const GROUPS = ['Travel', 'Meals', 'Tools'] as const;
const ITEMS = CATEGORIES.map(({ value, label }) => ({ value, label }));

export default function SelectMotionDemo() {
  const [category, setCategory] = useState<string | null>(null);

  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Category</FieldLabel>
      <Select items={ITEMS} value={category} onValueChange={setCategory}>
        <SelectTrigger placeholder="Choose a category" />
        <SelectContent>
          {GROUPS.map((group) => (
            <SelectGroup key={group} label={group}>
              {CATEGORIES.filter((c) => c.group === group).map((c) => (
                <SelectItem key={c.value} value={c.value} hint={c.account}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Sets the ledger account the line posts to.</FieldDescription>
    </Field>
  );
}
