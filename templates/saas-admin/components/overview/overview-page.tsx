'use client';

import {
  ArrowRightIcon,
  ChatsCircleIcon,
  InfoIcon,
  PlusIcon,
  TimerIcon,
  TrayIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { BlockPanel, type OnboardingStep } from '@rectio/blocks';
import { ActivityFeed, OnboardingChecklist } from '@rectio/blocks/motion';
import {
  Button,
  Meter,
  Stat,
  StatGroup,
  Toggle,
  ToggleGroup,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  cn,
} from '@rectio/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { USAGE } from '@/data/account';
import { ACTIVITY, AT_RISK, FIGURES, RANGES, VOLUME, type Range } from '@/data/overview';
import {
  CURRENT_USER,
  LOCALE,
  NOW,
  formatCount,
  formatDuration,
  formatLongDate,
} from '@/data/workspace';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';
import { Sparkline } from './sparkline';
import { VolumeChart } from './volume-chart';

const STAT_ICONS: Record<string, ReactNode> = {
  open: <TrayIcon aria-hidden />,
  'first-response': <TimerIcon aria-hidden />,
  csat: <ChatsCircleIcon aria-hidden />,
  resolved: <UsersThreeIcon aria-hidden />,
};

/** Tickets closest to missing their first-response target, the queue a lead watches. */
function TargetQueue({ className }: { className?: string }) {
  const { openTicket } = useAppData();
  const late = AT_RISK.filter((t) => t.remaining < 0).length;
  return (
    <BlockPanel
      title="Close to target"
      description={
        late === 0 ? 'Every ticket is inside its target' : `${String(late)} past the target`
      }
      bodyClassName="px-0 pb-2"
      actions={
        <Button variant="ghost" size="sm" render={<Link href="/tickets" />} nativeButton={false}>
          Board
          <ArrowRightIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
        </Button>
      }
      {...(className === undefined ? {} : { className })}
    >
      <ul className="flex flex-col">
        {AT_RISK.map((t) => {
          const overdue = t.remaining < 0;
          return (
            <li key={t.id} className="border-t border-line first:border-t-0">
              <button
                type="button"
                onClick={() => {
                  openTicket(t.id);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-start transition-colors duration-fast ease-standard hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-fg">{t.title}</span>
                  <span className="truncate text-sm text-fg-muted">
                    <span className="numeric">{t.reference}</span>, {t.customer}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-badge px-2 py-0.5 text-sm font-medium numeric',
                    overdue
                      ? 'bg-negative-subtle text-negative-strong'
                      : 'bg-warning-subtle text-warning-strong',
                  )}
                >
                  {overdue
                    ? `${formatDuration(-t.remaining)} late`
                    : `${formatDuration(t.remaining)} left`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </BlockPanel>
  );
}

/** How much of the plan the month has used, with the way to more. */
function PlanUsage({ className }: { className?: string }) {
  return (
    <BlockPanel
      title="Plan usage"
      description="Business plan, resets 1 December"
      bodyClassName="gap-5"
      actions={
        <Button variant="ghost" size="sm" render={<Link href="/billing" />} nativeButton={false}>
          Billing
          <ArrowRightIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
        </Button>
      }
      {...(className === undefined ? {} : { className })}
    >
      {USAGE.map((u) => (
        <Meter
          key={u.id}
          variant="bar"
          label={u.label}
          value={u.used}
          max={u.limit}
          thresholds={{ warning: u.limit * 0.8, critical: u.limit * 0.95 }}
          levelLabels={{ warning: 'Nearly used up', critical: 'Almost full' }}
          description={`${formatCount(u.used)} of ${formatCount(u.limit)} ${u.unit}`}
        />
      ))}
    </BlockPanel>
  );
}

function OverviewLoading() {
  return (
    <LoadingRegion label="Loading the overview">
      <LoadingPanel kind="figures" detailed />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <LoadingPanel kind="chart" points={14} />
          <LoadingPanel kind="list" rows={5} className="max-lg:hidden" />
        </div>
        <div className="flex flex-col gap-6">
          <LoadingPanel kind="list" rows={4} />
          <LoadingPanel kind="list" rows={3} />
        </div>
      </div>
    </LoadingRegion>
  );
}

/** The first steps of a new workspace, shown on the empty overview instead of figures. */
function Setup() {
  const router = useRouter();
  const [steps, setSteps] = useState<OnboardingStep[]>(() => [
    {
      id: 'email',
      title: 'Forward your support email',
      description: 'Send support@ to your Lindwell address so every message becomes a ticket.',
      done: true,
    },
    {
      id: 'team',
      title: 'Invite your team',
      description: 'Agents answer tickets; viewers see reports. Invites hold a seat.',
      done: false,
      action: {
        label: 'Invite people',
        onSelect: () => {
          router.push('/team#invite');
        },
      },
    },
    {
      id: 'customers',
      title: 'Import your customers',
      description: 'A CSV from your CRM links tickets to accounts from the first day.',
      done: false,
      action: {
        label: 'Import a CSV',
        onSelect: () => {
          router.push('/customers');
        },
      },
    },
    {
      id: 'widget',
      title: 'Add the help widget to your app',
      description: 'An API key and four lines of code.',
      done: false,
      optional: true,
      action: {
        label: 'Create a key',
        onSelect: () => {
          router.push('/developers');
        },
      },
    },
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <OnboardingChecklist
        title="Set up your help desk"
        estimate="About 10 minutes"
        steps={steps}
        onToggleStep={(id, done) => {
          setSteps((list) => list.map((s) => (s.id === id ? { ...s, done } : s)));
        }}
        className="lg:col-span-2"
      />
      <EmptyPanel
        icon={<TrayIcon aria-hidden weight="bold" />}
        title="No tickets yet"
        description="Response times, satisfaction and the busiest days appear here once the first ticket arrives."
      />
    </div>
  );
}

export function OverviewPage() {
  const state = usePageState();
  const { openNewTicket } = useAppData();
  const [range, setRange] = useState<Range>('14d');
  const figures = FIGURES[range];
  const days = VOLUME.slice(range === '14d' ? -14 : 0);
  const firstName = CURRENT_USER.name.split(' ')[0] ?? '';

  const actions = (
    <>
      {state !== 'empty' && (
        <ToggleGroup
          aria-label="Range"
          value={[range]}
          onValueChange={(value: string[]) => {
            const next = RANGES.find((r) => r.value === value[0]);
            if (next !== undefined) setRange(next.value);
          }}
        >
          {RANGES.map((r) => (
            <Toggle key={r.value} value={r.value}>
              {r.label}
            </Toggle>
          ))}
        </ToggleGroup>
      )}
      <Button
        onClick={() => {
          openNewTicket();
        }}
      >
        <PlusIcon aria-hidden weight="bold" className="size-4" />
        New ticket
      </Button>
    </>
  );

  return (
    <>
      <PageHeader
        title={`Good morning, ${firstName}`}
        description={`${formatLongDate(NOW)}. The last ${range === '14d' ? '14' : '30'} days against the ${range === '14d' ? '14' : '30'} before.`}
        actions={actions}
      />
      {state === 'loading' ? (
        <OverviewLoading />
      ) : state === 'error' ? (
        <ErrorPanel title="The overview did not load" />
      ) : state === 'empty' ? (
        <Setup />
      ) : (
        <>
          <StatGroup aria-label="Key figures">
            {figures.map((f) => (
              <Stat
                key={f.id}
                label={f.label}
                icon={STAT_ICONS[f.id]}
                value={f.value}
                {...(f.unit === undefined ? {} : { unit: f.unit })}
                change={{ ...f.change, comparison: 'vs the period before' }}
                description={f.description}
                trend={<Sparkline values={f.series} favourable={f.change.favourable} />}
              />
            ))}
          </StatGroup>
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
            <div className="flex flex-col gap-6 max-lg:contents lg:col-span-2">
              <BlockPanel
                title="Ticket volume"
                description="Created and resolved per day"
                className="max-lg:order-2"
                actions={
                  <Popover>
                    <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
                      <InfoIcon aria-hidden weight="bold" className="size-3.5" />
                      Why the spike?
                    </PopoverTrigger>
                    <PopoverContent align="end" className="max-w-xs">
                      <PopoverTitle>Card payments outage</PopoverTitle>
                      <PopoverDescription>
                        Apple Pay checkouts failed on 8 November, and the queue doubled for two
                        days. Resolved tickets caught up by 10 November.
                      </PopoverDescription>
                    </PopoverContent>
                  </Popover>
                }
              >
                <VolumeChart days={days} />
              </BlockPanel>
              <ActivityFeed
                title="Recent activity"
                events={ACTIVITY}
                now={NOW}
                locale={LOCALE}
                className="max-lg:order-4"
              />
            </div>
            <div className="flex flex-col gap-6 max-lg:contents">
              <TargetQueue className="max-lg:order-1" />
              <PlanUsage className="max-lg:order-3" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
