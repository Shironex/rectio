'use client';

import { ArchiveIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { Toggle, ToggleGroup } from '@rectio/ui';
import { useState } from 'react';

/** The toolbar above an invoice list: a period switch, a view switch and a filter. */
export default function ToggleDemo() {
  const [period, setPeriod] = useState(['month']);

  return (
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
  );
}
