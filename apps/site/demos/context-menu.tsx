'use client';

import { CopyIcon, EyeIcon, FlagIcon } from '@phosphor-icons/react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  MenuItem,
  MenuSeparator,
  Money,
} from '@rectio/ui';
import { useState } from 'react';

export default function ContextMenuDemo() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ContextMenu>
        <ContextMenuTrigger className="flex items-center justify-between gap-4 rounded-panel border border-line bg-surface px-4 py-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-fg">Atlantic Office Supplies Ltd</span>
            <span className="text-sm text-fg-muted">Bill 8817, due 28 March</span>
          </div>
          <Money amount={-642.5} currency="EUR" locale="en-IE" tone="neutral" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <MenuItem
            icon={<EyeIcon weight="bold" />}
            onClick={() => {
              setLast('Open bill');
            }}
          >
            Open bill
          </MenuItem>
          <MenuItem
            icon={<CopyIcon weight="bold" />}
            onClick={() => {
              setLast('Copy reference');
            }}
          >
            Copy reference
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={<FlagIcon weight="bold" />}
            onClick={() => {
              setLast('Flag for review');
            }}
          >
            Flag for review
          </MenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-sm text-fg-muted" aria-live="polite">
        {last === null
          ? 'Right click the bill, or long press it on a touch screen.'
          : `Chose: ${last}.`}
      </p>
    </div>
  );
}
