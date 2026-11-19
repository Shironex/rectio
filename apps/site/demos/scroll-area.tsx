'use client';

import { ScrollArea } from '@rectio/ui';

export default function ScrollAreaDemo() {
  return (
    <ScrollArea label="Recent receipts" className="h-56 w-72 rounded-panel border border-line">
      <ul className="divide-y divide-line">
        {Array.from({ length: 16 }, (_, i) => (
          <li key={i} className="flex justify-between px-4 py-2 text-sm">
            <span>Receipt {2040 - i}</span>
            <span className="text-fg-muted numeric">{(38.5 + i * 17.25).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
