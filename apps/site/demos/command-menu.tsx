'use client';

import {
  BankIcon,
  BookOpenIcon,
  HouseIcon,
  PlusIcon,
  ReceiptIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { CommandMenu, CommandMenuTrigger, type CommandGroup } from '@rectio/ui';
import { useState } from 'react';

/** The docs search already owns Command K, so this demo binds its own shortcut. */
const SHORTCUT = 'mod+j';

export default function CommandMenuDemo() {
  const [last, setLast] = useState<string | null>(null);
  const run = (name: string) => () => {
    setLast(name);
  };

  const groups: CommandGroup[] = [
    {
      label: 'Go to',
      items: [
        { id: 'overview', label: 'Overview', icon: <HouseIcon />, onSelect: run('Overview') },
        {
          id: 'payables',
          label: 'Payables',
          icon: <BankIcon />,
          keywords: ['bills', 'suppliers'],
          hint: 'Finance',
          onSelect: run('Payables'),
        },
        {
          id: 'ledger',
          label: 'General ledger',
          icon: <BookOpenIcon />,
          keywords: ['journal'],
          hint: 'Reports',
          onSelect: run('General ledger'),
        },
      ],
    },
    {
      label: 'Actions',
      items: [
        {
          id: 'new-invoice',
          label: 'New invoice',
          icon: <PlusIcon />,
          shortcut: 'mod+shift+i',
          onSelect: run('New invoice'),
        },
        {
          id: 'record-payment',
          label: 'Record payment',
          icon: <ReceiptIcon />,
          onSelect: run('Record payment'),
        },
        {
          id: 'import',
          label: 'Import bank statement',
          icon: <UploadSimpleIcon />,
          disabled: true,
          onSelect: run('Import bank statement'),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <CommandMenu groups={groups} shortcut={SHORTCUT} label="Search pages and actions">
        <CommandMenuTrigger shortcut={SHORTCUT}>Search pages and actions</CommandMenuTrigger>
      </CommandMenu>
      <p className="text-sm text-fg-muted" aria-live="polite">
        {last === null ? 'Try typing nwinv.' : `Ran: ${last}.`}
      </p>
    </div>
  );
}
