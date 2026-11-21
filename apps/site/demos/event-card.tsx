'use client';

import { EventCard } from '@rectio/ui';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);

export default function EventCardDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
      <EventCard
        title="Board pack: cash section"
        start={at(18, 10)}
        end={at(18, 12)}
        location="Room 2"
        attendees={[{ name: 'Ines Duarte' }, { name: 'Noor Haddad' }]}
        locale="en-GB"
        onSelect={() => undefined}
      />
      <EventCard
        title="Audit kickoff"
        start={at(19, 9, 30)}
        end={at(19, 11)}
        tone="warning"
        location="Floor 3"
        attendees={[
          { name: 'Ines Duarte' },
          { name: 'Callum Ross' },
          { name: 'Priya Raman' },
          { name: 'Aiyana Brooks' },
          { name: 'Noor Haddad' },
        ]}
        locale="en-GB"
      />
      <EventCard
        title="VAT return check"
        start={at(17, 14)}
        end={at(17, 15)}
        tone="warning"
        status="tentative"
        locale="en-GB"
      />
      <EventCard
        title="Vendor call: Halden Freight"
        start={at(16, 14)}
        end={at(16, 14, 30)}
        status="cancelled"
        location="Call"
        locale="en-GB"
      />
      <EventCard
        variant="compact"
        title="Supplier payment run"
        start={at(17, 11)}
        end={at(17, 12, 30)}
        tone="positive"
        locale="en-GB"
        onSelect={() => undefined}
      />
      <EventCard
        variant="compact"
        title="Payroll sign-off"
        start={at(18, 15)}
        end={at(18, 16)}
        tone="negative"
        locale="en-GB"
      />
    </div>
  );
}
