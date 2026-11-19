'use client';

import {
  ArrowsLeftRightIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import { Button, Meter } from '@rectio/motion';
import { Avatar, Badge, SwitchField, cn } from '@rectio/ui';
import { useRef, useState } from 'react';

import { DAYS, OPEN_SHIFTS, TEAM_WEEK } from '@/data/schedule';

/**
 * Small pieces of the product, built from rectio components and every one live: the swap approves,
 * the open shift can be claimed, the switches switch. They float over the hero and fill the bento.
 */

const ROW = 'flex items-center justify-between gap-3';

/** Where focus lands once the button it was on goes away, so a keyboard keeps its place. */
const LANDING =
  'rounded-control outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus';

/** A container to move focus to after an action replaces the control that ran it. */
function useLanding<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const land = () => {
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  };
  return { ref, land };
}

export function SwapCard() {
  const [state, setState] = useState<'pending' | 'approved' | 'declined'>('pending');
  const { ref, land } = useLanding<HTMLDivElement>();
  return (
    <div ref={ref} tabIndex={-1} className={cn('flex flex-col gap-3', LANDING)}>
      <div className={ROW}>
        <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
          <ArrowsLeftRightIcon aria-hidden weight="bold" className="size-4" />
          Shift swap
        </span>
        <span aria-live="polite">
          {state === 'pending' ? (
            <Badge tone="warning">Needs you</Badge>
          ) : (
            <Badge tone={state === 'approved' ? 'positive' : 'neutral'}>
              {state === 'approved' ? 'Swap approved' : 'Swap declined'}
            </Badge>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Avatar name="Ana Ribeiro" size="md" />
        <div className="flex min-w-0 flex-col">
          <span className="font-medium text-pretty text-fg">Ana swaps Thu 07:00 with Marco</span>
          <span className="text-sm text-fg-muted">Both qualified for Front desk</span>
        </div>
      </div>
      {state === 'pending' && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="md"
            variant="secondary"
            aria-label="Decline Ana's swap with Marco"
            onClick={() => {
              setState('declined');
              land();
            }}
          >
            Decline
          </Button>
          <Button
            size="md"
            aria-label="Approve Ana's swap with Marco"
            onClick={() => {
              setState('approved');
              land();
            }}
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

export function CoverageCard() {
  return (
    <Meter
      variant="bar"
      label="Saturday coverage"
      value={75}
      thresholds={{ warning: 80, worse: 'low' }}
      levelLabels={{ warning: 'One shift open' }}
      description="3 of 4 shifts filled"
    />
  );
}

export function PublishedCard() {
  return (
    <div className="flex items-center gap-3">
      <PaperPlaneTiltIcon aria-hidden weight="fill" className="size-8 shrink-0 text-accent" />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium text-fg">Week 48 published</span>
        <span className="text-sm text-fg-muted">24 people notified on their phones</span>
      </div>
    </div>
  );
}

/** The open shift board: claim a gap and it is yours, with no one to chase. */
export function OpenShiftBoard() {
  const [claimed, setClaimed] = useState<string | null>(null);
  const { ref, land } = useLanding<HTMLDivElement>();
  const taken = OPEN_SHIFTS.find((item) => item.id === claimed);
  return (
    <div ref={ref} tabIndex={-1} className={LANDING}>
      <p aria-live="polite" className="sr-only">
        {taken === undefined ? '' : `You claimed ${taken.day}, ${taken.start} to ${taken.end}.`}
      </p>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface">
        {OPEN_SHIFTS.map((shift) => {
          const mine = claimed === shift.id;
          return (
            <li key={shift.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-fg">
                  {shift.day}, <span className="numeric">{shift.start}</span> to{' '}
                  <span className="numeric">{shift.end}</span>
                </span>
                <span className="text-sm text-fg-muted">
                  {shift.role}, {shift.pay.toLowerCase()}
                </span>
              </div>
              {mine ? (
                <Badge tone="positive" className="w-24 justify-center">
                  Yours
                </Badge>
              ) : (
                <Button
                  size="md"
                  variant="secondary"
                  className="w-24"
                  disabled={claimed !== null}
                  aria-label={`Claim ${shift.day}, ${shift.start} to ${shift.end}`}
                  onClick={() => {
                    setClaimed(shift.id);
                    land();
                  }}
                >
                  Claim
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const AVAILABILITY = [
  { id: 'mornings', label: 'Weekday mornings', description: 'Before 12:00', on: true },
  { id: 'evenings', label: 'Weekday evenings', description: 'After 17:00', on: false },
  { id: 'weekends', label: 'Weekends', description: 'Saturday and Sunday', on: true },
  { id: 'nights', label: 'Night shifts', description: 'After 22:00', on: false },
  { id: 'split', label: 'Split shifts', description: 'Two parts in one day', on: false },
] as const;

export function AvailabilityCard() {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4">
      {AVAILABILITY.map((slot) => (
        <SwitchField
          key={slot.id}
          label={slot.label}
          description={slot.description}
          defaultChecked={slot.on}
        />
      ))}
    </div>
  );
}

const TIME_OFF = [
  { id: 't1', name: 'Priya Natarajan', when: '1 to 5 December', kind: 'Holiday' },
  { id: 't2', name: 'Kofi Mensah', when: '12 December', kind: 'Appointment' },
] as const;

export function TimeOffCard() {
  const [approved, setApproved] = useState<ReadonlySet<string>>(new Set());
  const [last, setLast] = useState<string | null>(null);
  const { ref, land } = useLanding<HTMLDivElement>();
  return (
    <div ref={ref} tabIndex={-1} className={LANDING}>
      <p aria-live="polite" className="sr-only">
        {last === null ? '' : `Time off approved for ${last}.`}
      </p>
      <ul className="flex flex-col gap-3">
        {TIME_OFF.map((request) => {
          const done = approved.has(request.id);
          return (
            <li key={request.id} className="flex items-center gap-3">
              <Avatar name={request.name} size="md" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-fg">{request.name}</span>
                <span className="text-sm text-fg-muted">
                  {request.kind}, {request.when}
                </span>
              </div>
              {done ? (
                <Badge tone="positive" className="w-24 justify-center">
                  Approved
                </Badge>
              ) : (
                <Button
                  size="md"
                  variant="secondary"
                  className="w-24"
                  aria-label={`Approve time off for ${request.name}`}
                  onClick={() => {
                    setApproved((current) => new Set(current).add(request.id));
                    setLast(request.name);
                    land();
                  }}
                >
                  Approve
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HoursCard() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm text-fg-muted">Hours this week</span>
          <span className="numeric font-display text-3xl font-strong tracking-tight text-fg">
            312
            <span className="text-base font-regular text-fg-muted"> of 340</span>
          </span>
        </div>
        <Badge tone="positive">On budget</Badge>
      </div>
      <Meter variant="bar" label="Labour budget used" value={92} />
    </div>
  );
}

export function ClockInCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ClockIcon aria-hidden weight="duotone" className="size-8 shrink-0 text-accent" />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium text-fg">Elin clocked in at 06:56</span>
        <span className="text-sm text-fg-muted">Kitchen, on site</span>
      </div>
    </div>
  );
}

export function ConfirmedCard() {
  return (
    <div className="flex items-center gap-3">
      <CheckCircleIcon aria-hidden weight="fill" className="size-8 shrink-0 text-positive" />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium text-fg">Saturday is covered</span>
        <span className="text-sm text-fg-muted">Kofi claimed the open shift</span>
      </div>
    </div>
  );
}

export function RequestCard() {
  return (
    <div className="flex items-center gap-3">
      <CalendarCheckIcon aria-hidden weight="duotone" className="size-8 shrink-0 text-accent" />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium text-fg">Holiday approved</span>
        <span className="text-sm text-fg-muted">Priya, 1 to 5 December</span>
      </div>
    </div>
  );
}

/** One person's week as the app shows it on their phone: every shift, and the one they offered. */
export function MyWeekCard() {
  const person = TEAM_WEEK[0];
  if (person === undefined) return null;
  return (
    <div className="flex flex-col gap-4 bg-surface p-5 text-fg">
      <div className="flex items-center gap-3">
        <Avatar name={person.name} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">Your week, {person.name.split(' ')[0]}</span>
          <span className="text-sm text-fg-muted">40 hours across 5 shifts</span>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-panel border border-line">
        {person.week.map((shift, index) => {
          const day = DAYS[index];
          if (day === undefined) return null;
          return (
            <li key={day.short} className="flex items-center gap-4 px-4 py-2.5">
              <span className="flex w-10 shrink-0 flex-col">
                <span className="text-xs text-fg-muted">{day.short}</span>
                <span className="numeric text-lg font-strong">{day.date}</span>
              </span>
              {shift === null ? (
                <span className="text-sm text-fg-subtle">Day off</span>
              ) : (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="numeric text-sm font-medium">
                      {shift.start} to {shift.end}
                    </span>
                    <span className="text-sm text-fg-muted">Front desk</span>
                  </span>
                  {index === 3 && <Badge tone="warning">Swap offered</Badge>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
