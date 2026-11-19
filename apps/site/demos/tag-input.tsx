'use client';

import { Field, FieldDescription, FieldLabel, TagInput } from '@rectio/ui';
import { useState } from 'react';

/** Labels a team puts on vendor records, lower case with dashes. */
const LABEL = /^[a-z0-9-]+$/;

export default function TagInputDemo() {
  const [labels, setLabels] = useState(['saas', 'annual-contract']);

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Vendor labels</FieldLabel>
      <TagInput
        value={labels}
        onValueChange={setLabels}
        max={6}
        placeholder="Add a label"
        validate={(tag) => (LABEL.test(tag) ? null : 'Use lower case letters, digits and dashes.')}
      />
      <FieldDescription>Press Enter or type a comma after each label. Up to six.</FieldDescription>
    </Field>
  );
}
