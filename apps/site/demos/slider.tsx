'use client';

import { Field, FieldDescription, FieldLabel, Slider } from '@rectio/ui';
import { useState } from 'react';

const EUR = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } as const;

export default function SliderDemo() {
  const [threshold, setThreshold] = useState(2500);
  const [range, setRange] = useState([500, 4000]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Field>
        <Slider
          label="Second approver above"
          showValue
          marks
          value={threshold}
          onValueChange={(value) => {
            setThreshold(value as number);
          }}
          min={0}
          max={10000}
          step={250}
          largeStep={1000}
          format={EUR}
          locale="en-IE"
        />
        <FieldDescription>Expenses over this amount need two approvals.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Invoice amount</FieldLabel>
        <Slider
          showValue
          marks={[0, 2500, 5000, 7500, 10000]}
          value={range}
          onValueChange={(value) => {
            setRange(value as number[]);
          }}
          max={10000}
          step={100}
          format={EUR}
          locale="en-IE"
          thumbLabels={['Minimum amount', 'Maximum amount']}
        />
      </Field>
      <Field disabled>
        <Slider
          label="Early payment discount"
          showValue
          defaultValue={0.02}
          max={0.1}
          step={0.005}
          format={{ style: 'percent', minimumFractionDigits: 1 }}
          locale="en-IE"
        />
        <FieldDescription>Set by your finance policy.</FieldDescription>
      </Field>
    </div>
  );
}
