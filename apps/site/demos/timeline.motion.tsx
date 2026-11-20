'use client';

import { Timeline, TimelineItem } from '@rectio/motion';
import { Avatar } from '@rectio/ui';

const activity = [
  { name: 'Ana Ruiz', action: 'approved invoice INV-2041', when: '09:42' },
  { name: 'Ewan Burke', action: 'commented on the March budget', when: '09:15' },
  { name: 'Lena Fischer', action: 'uploaded 3 receipts', when: 'Yesterday' },
];

export default function TimelineMotionDemo() {
  return (
    <Timeline density="compact" className="w-full max-w-sm">
      {activity.map((a) => (
        <TimelineItem
          key={a.name}
          marker={<Avatar name={a.name} size="sm" />}
          title={
            <>
              <span className="font-medium">{a.name}</span> {a.action}
            </>
          }
          time={{ dateTime: '2026-03-14', label: a.when }}
        />
      ))}
    </Timeline>
  );
}
