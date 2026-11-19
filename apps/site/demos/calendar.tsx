'use client';

import { Calendar } from '@rectio/ui';
import { useState } from 'react';

const MARCH = new Date(2026, 2, 1);

export default function CalendarDemo() {
  const [payday, setPayday] = useState<Date | undefined>(new Date(2026, 2, 19));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-panel border border-line bg-surface">
        <Calendar
          mode="single"
          locale="en-IE"
          defaultMonth={MARCH}
          selected={payday}
          onSelect={setPayday}
          disabled={{ dayOfWeek: [0, 6] }}
        />
      </div>
      <p className="text-sm text-fg-muted">Payment runs settle on weekdays only.</p>
    </div>
  );
}
