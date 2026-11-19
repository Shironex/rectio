'use client';

import {
  DatePicker,
  DateRangePicker,
  Field,
  FieldDescription,
  FieldLabel,
  type DateRange,
  type DateRangePreset,
} from '@rectio/ui';
import { useState } from 'react';

const MARCH = { from: new Date(2026, 2, 1), to: new Date(2026, 2, 31) };
/** Fixed periods, so the example never drifts with the clock. */
const PRESETS: DateRangePreset[] = [
  { label: 'March', range: MARCH },
  { label: 'February', range: { from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) } },
  { label: 'First quarter', range: { from: new Date(2026, 0, 1), to: new Date(2026, 2, 31) } },
];

export default function DatePickerDemo() {
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date(2026, 2, 19));
  const [period, setPeriod] = useState<DateRange | undefined>(MARCH);

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Field>
        <FieldLabel>Invoice date</FieldLabel>
        <DatePicker
          locale="en-IE"
          value={invoiceDate}
          onValueChange={setInvoiceDate}
          disabledDays={{ after: MARCH.to }}
        />
        <FieldDescription>Type it, or press Alt and Down for the calendar.</FieldDescription>
      </Field>
      <DateRangePicker
        aria-label="Statement period"
        locale="en-IE"
        value={period}
        onValueChange={setPeriod}
        presets={PRESETS}
      />
    </div>
  );
}
