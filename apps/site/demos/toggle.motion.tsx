'use client';

import { ArchiveIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { SegmentedControl, ToggleGroup } from '@rectio/motion';
import { Toggle } from '@rectio/ui';
import { useState } from 'react';

const STATUSES = [
  { value: 'all', label: 'All', hint: 48 },
  { value: 'unpaid', label: 'Unpaid', hint: 11 },
  { value: 'overdue', label: 'Overdue', hint: 3 },
  { value: 'paid', label: 'Paid' },
] as const;

type Status = (typeof STATUSES)[number]['value'];

/** The toolbar above an invoice list: a period switch, a view switch and a filter. */
export default function ToggleMotionDemo() {
  const [period, setPeriod] = useState(['month']);
  const [status, setStatus] = useState<Status>('unpaid');

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <SegmentedControl
        label="Status"
        options={STATUSES}
        value={status}
        onValueChange={setStatus}
      />
      <div className="flex flex-wrap items-end gap-4">
        <ToggleGroup legend="Period" value={period} onValueChange={setPeriod}>
          <Toggle value="week">Week</Toggle>
          <Toggle value="month">Month</Toggle>
          <Toggle value="quarter">Quarter</Toggle>
          <Toggle value="year">Year</Toggle>
        </ToggleGroup>
        <ToggleGroup aria-label="View" defaultValue={['list']}>
          <Toggle value="list" iconOnly aria-label="List">
            <ListIcon aria-hidden weight="bold" className="size-4" />
          </Toggle>
          <Toggle value="board" iconOnly aria-label="Board">
            <SquaresFourIcon aria-hidden weight="bold" className="size-4" />
          </Toggle>
        </ToggleGroup>
        <Toggle>
          <ArchiveIcon aria-hidden weight="bold" className="size-4" />
          Show archived
        </Toggle>
      </div>
    </div>
  );
}
