'use client';

import { RangeCalendar, type DateRange, type DateRangePreset } from '@rectio/ui';
import { useState } from 'react';

/** Fixed periods, so the example never drifts with the clock. */
const PRESETS: DateRangePreset[] = [
  { label: 'This week', range: { from: new Date(2026, 2, 16), to: new Date(2026, 2, 22) } },
  { label: 'March', range: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 31) } },
  { label: 'First quarter', range: { from: new Date(2026, 0, 1), to: new Date(2026, 2, 31) } },
];

export default function RangeCalendarDemo() {
  const [period, setPeriod] = useState<DateRange | undefined>(PRESETS[0]?.range);
  return (
    <div className="max-w-full overflow-x-auto rounded-(--rx-popover-radius) border border-line bg-surface">
      <RangeCalendar
        aria-label="Report period"
        locale="en-IE"
        value={period}
        onValueChange={setPeriod}
        presets={PRESETS}
      />
    </div>
  );
}
