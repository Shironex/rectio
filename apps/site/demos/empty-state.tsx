'use client';

import { CloudArrowUpIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { Button, EmptyState } from '@rectio/ui';

export default function EmptyStateDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <EmptyState
        icon={<UsersThreeIcon weight="duotone" />}
        title="Invite your team"
        description="Approvers and accountants see the reports you share with them."
        actions={<Button>Invite people</Button>}
      />
      <EmptyState
        size="sm"
        variant="dashed"
        icon={<CloudArrowUpIcon weight="bold" />}
        title="Drop receipts here"
        description="PDF, JPG or PNG, up to 10 MB each."
      />
    </div>
  );
}
