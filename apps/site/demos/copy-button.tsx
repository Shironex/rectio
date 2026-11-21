'use client';

import { CopyButton } from '@rectio/ui';

/** Payment details on an invoice: copy the IBAN or the reference in one press. */
export default function CopyButtonDemo() {
  return (
    <dl className="grid w-full max-w-sm gap-3 text-sm">
      <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-3 py-2">
        <div className="min-w-0">
          <dt className="text-fg-muted">IBAN</dt>
          <dd className="truncate font-mono text-fg">IE29 AIBK 9311 5212 3456 78</dd>
        </div>
        <CopyButton value="IE29AIBK93115212345678" label="Copy IBAN" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-3 py-2">
        <div className="min-w-0">
          <dt className="text-fg-muted">Payment reference</dt>
          <dd className="truncate font-mono text-fg">INV-2041</dd>
        </div>
        <CopyButton
          value="INV-2041"
          label="Copy"
          copiedLabel="Copied"
          showLabel
          variant="secondary"
        />
      </div>
    </dl>
  );
}
