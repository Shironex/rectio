import * as moving from '@rectio/blocks/motion';
import * as plain from '@rectio/blocks';
import type { AgendaEvent, AgendaVariant } from '@rectio/blocks';
import {
  EventCard,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  RangeCalendar,
  ThemeScope,
  TimeField,
  type DateRange,
  type DateRangePreset,
  type TimeValue,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import { NOW, WEEK } from './data';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);

const PRESETS: DateRangePreset[] = [
  { label: 'This week', range: { from: at(16, 0), to: at(22, 0) } },
  { label: 'Next week', range: { from: at(23, 0), to: at(29, 0) } },
  { label: 'March', range: { from: at(1, 0), to: at(31, 0) } },
];

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-heading tracking-tight">{title}</h2>
        <p className="text-sm text-fg-muted">{note}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * The scheduling pieces in one theme and mode, for design rounds: the week agenda, its day view,
 * event cards, time fields and the range calendar. `?empty=1` shows an empty week.
 */
export function SchedulingPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const canvas = usePageCanvas(theme, mode);
  const params = new URLSearchParams(window.location.search);
  const empty = params.get('empty') === '1';
  const { WeekAgenda } = motion ? moving : plain;
  const [date, setDate] = useState(NOW);
  const [variant, setVariant] = useState<AgendaVariant>('week');
  const [events, setEvents] = useState<AgendaEvent[]>(empty ? [] : WEEK);
  const [opened, setOpened] = useState<string | null>(null);
  const [start, setStart] = useState<TimeValue | null>({ hour: 9, minute: 30 });
  const [pickup, setPickup] = useState<TimeValue | null>({ hour: 14, minute: 0 });
  const [late, setLate] = useState<TimeValue | null>({ hour: 19, minute: 15 });
  const [period, setPeriod] = useState<DateRange | undefined>({ from: at(16, 0), to: at(22, 0) });

  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-heading tracking-tight">Scheduling</h1>
          <p className="text-sm text-fg-muted">
            Week agenda, event cards, time fields and the range calendar.
          </p>
        </header>

        <div data-shot="agenda" className="flex flex-col gap-2">
          <WeekAgenda
            events={events}
            date={date}
            onDateChange={setDate}
            variant={variant}
            onVariantChange={setVariant}
            now={NOW}
            locale="en-GB"
            onEventClick={(event) => {
              setOpened(event.title);
            }}
            onSlotClick={({ start: from, end }) => {
              setEvents((list) => [
                ...list,
                { id: `new-${String(list.length)}`, title: 'New event', start: from, end },
              ]);
            }}
          />
          <p role="status" className="text-sm text-fg-subtle">
            {opened === null ? 'Press an event to open it.' : `Opened: ${opened}`}
          </p>
        </div>

        <div data-shot="day" className="grid gap-6 lg:grid-cols-2">
          <WeekAgenda
            events={WEEK}
            date={NOW}
            variant="day"
            now={NOW}
            locale="en-GB"
            hours={{ start: 8, end: 17 }}
            onEventClick={() => undefined}
          />
          <Section
            title="Event cards"
            note="Full and compact, coloured by kind; tentative and cancelled say so in words."
          >
            <div data-shot="cards" className="grid gap-3 sm:grid-cols-2">
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
                  { name: 'Tomasz Wiśniewski' },
                ]}
                locale="en-GB"
              />
              <EventCard
                title="VAT return check"
                start={at(17, 14)}
                end={at(17, 15)}
                tone="info"
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
              <div className="flex flex-col gap-2">
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
            </div>
          </Section>
        </div>

        <div className="flex flex-wrap gap-x-16 gap-y-10">
          <Section
            title="Time fields"
            note="Typed segment by segment; arrow keys step, the clock follows the locale."
          >
            <div data-shot="time" className="flex flex-col gap-5">
              <Field>
                <FieldLabel>Meeting starts</FieldLabel>
                <TimeField locale="en-GB" value={start} onValueChange={setStart} />
                <FieldDescription>24 hour clock, from the en-GB locale.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Courier pickup</FieldLabel>
                <TimeField locale="en-US" step={15} value={pickup} onValueChange={setPickup} />
                <FieldDescription>12 hour clock, in 15 minute steps.</FieldDescription>
              </Field>
              <Field invalid={late !== null && late.hour * 60 + late.minute > 18 * 60}>
                <FieldLabel>Payment cut-off</FieldLabel>
                <TimeField
                  locale="en-GB"
                  min={{ hour: 8, minute: 0 }}
                  max={{ hour: 18, minute: 0 }}
                  value={late}
                  onValueChange={setLate}
                />
                <FieldError>The bank accepts payments from 08:00 to 18:00.</FieldError>
              </Field>
              <Field>
                <FieldLabel>Disabled</FieldLabel>
                <TimeField
                  locale="en-GB"
                  value={{ hour: 17, minute: 30 }}
                  onValueChange={() => undefined}
                  disabled
                />
              </Field>
            </div>
          </Section>
          <Section
            title="Range calendar"
            note="Two months in place, presets beside them and the period written out below."
          >
            <div
              data-shot="range"
              className="w-fit max-w-full overflow-hidden rounded-(--rx-popover-radius) border border-line bg-surface"
            >
              <RangeCalendar
                aria-label="Report period"
                locale="en-GB"
                value={period}
                onValueChange={setPeriod}
                presets={PRESETS}
              />
            </div>
          </Section>
        </div>
      </main>
    </ThemeScope>
  );
}
