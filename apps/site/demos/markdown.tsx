'use client';

import { Markdown } from '@rectio/ui';

const TEXT = `### Close checklist

Run these **in order**; each step needs the one before it.

1. Reconcile every bank account to the statement
2. Post accruals for bills that arrived after month end
3. Clear the \`suspense\` account to zero

| Account | Balance |
| :-- | --: |
| Operating | $184,220.00 |
| Payroll | $42,900.00 |

> A close is done when the trial balance ties.

<script>alert('raw HTML shows as text')</script> and [unsafe links](javascript:alert(1)) lose their link.`;

/** Safe Markdown: no raw HTML, links checked against a protocol list. */
export default function MarkdownDemo() {
  return (
    <div className="w-full max-w-xl">
      <Markdown>{TEXT}</Markdown>
    </div>
  );
}
