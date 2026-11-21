'use client';

import { TrendChip } from '@rectio/ui';

export default function TrendChipDemo() {
  return (
    <div className="flex flex-col items-start gap-3">
      <TrendChip value={0.084} locale="en-GB" comparison="vs last month" />
      <TrendChip
        value={0.003}
        format="points"
        better="down"
        locale="en-GB"
        comparison="vs last month"
      />
      <TrendChip value={-0.061} better="down" locale="en-GB" comparison="vs last month" />
      <TrendChip value={0} better="none" locale="en-GB" comparison="vs last month" />
      <TrendChip value={-0.12} variant="plain" locale="en-GB" />
    </div>
  );
}
