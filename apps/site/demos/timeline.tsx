'use client';

import { FileTextIcon, PaperPlaneTiltIcon, ReceiptIcon } from '@phosphor-icons/react';
import { Timeline, TimelineItem } from '@rectio/ui';

export default function TimelineDemo() {
  return (
    <Timeline className="w-full max-w-sm">
      <TimelineItem
        title="Invoice INV-2041 created"
        icon={<FileTextIcon weight="bold" />}
        time={{ dateTime: '2026-03-02', label: '2 Mar' }}
      />
      <TimelineItem
        title="Sent to Northwind Logistics"
        tone="accent"
        icon={<PaperPlaneTiltIcon weight="bold" />}
        time={{ dateTime: '2026-03-02', label: '2 Mar' }}
      />
      <TimelineItem
        title="Paid in full"
        tone="positive"
        icon={<ReceiptIcon weight="bold" />}
        time={{ dateTime: '2026-03-14', label: '14 Mar' }}
      >
        Bank transfer, reference 4471.
      </TimelineItem>
    </Timeline>
  );
}
