'use client';

import { CheckIcon, WarningIcon } from '@phosphor-icons/react';
import { Badge } from '@rectio/ui';

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Draft</Badge>
      <Badge tone="info">Sent</Badge>
      <Badge tone="warning">Due in 3 days</Badge>
      <Badge tone="positive">
        <CheckIcon aria-hidden weight="bold" />
        Paid
      </Badge>
      <Badge tone="negative">
        <WarningIcon aria-hidden weight="bold" />
        Overdue
      </Badge>
    </div>
  );
}
