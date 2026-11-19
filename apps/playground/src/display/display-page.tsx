import {
  ArrowsClockwiseIcon,
  CloudArrowUpIcon,
  FileTextIcon,
  GearSixIcon,
  LightningIcon,
  PaperPlaneTiltIcon,
  ReceiptIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import * as moving from '@rectio/motion';
import * as plain from '@rectio/ui';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  EmptyState,
  Kbd,
  KbdCombo,
  ScrollArea,
  Separator,
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonCircle,
  SkeletonLine,
  SkeletonListItem,
  SkeletonTable,
  SkeletonText,
  Spinner,
  Stat,
  StatGroup,
  Stepper,
  ThemeScope,
  useLoadingAction,
  type SpinnerVariant,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import { MODES, THEMES, type Mode, type ThemeId } from '../themes';
import { ACTIVITY, FAQ, PEOPLE, SETUP_STEPS, SHORTCUTS } from './data';

/** The parts that have a motioned twin; an app picks one by import path. */
type Moving = Pick<
  typeof plain,
  | 'Alert'
  | 'Banner'
  | 'LoadingOverlay'
  | 'Meter'
  | 'Progress'
  | 'ProgressCircle'
  | 'SkeletonSwap'
  | 'Timeline'
  | 'TimelineItem'
>;

export const DISPLAY_SECTIONS = [
  'loaders',
  'skeletons',
  'progress',
  'people',
  'messages',
  'structure',
  'data',
] as const;
export type DisplaySection = (typeof DISPLAY_SECTIONS)[number];

const SPINNERS: { variant: SpinnerVariant; note: string }[] = [
  { variant: 'ring', note: 'Most waits' },
  { variant: 'dots', note: 'Inline, feeds' },
  { variant: 'bars', note: 'Streams, uploads' },
  { variant: 'pulse', note: 'Live sync' },
  { variant: 'orbit', note: 'Background work' },
];

/** One group of specimens. The heading names it; the note says when to reach for what. */
function Group({
  id,
  title,
  note,
  children,
}: {
  id: DisplaySection;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      data-section={id}
      className="flex flex-col gap-5 border-t border-line pt-6"
    >
      <div className="flex max-w-prose flex-col gap-1">
        <h2 id={`${id}-title`} className="font-display text-xl font-heading tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-fg-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

/** A labelled specimen. The label names what is shown, so a screenshot reads alone. */
function Tile({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={plain.cn(
        'flex min-w-0 flex-col gap-4 rounded-panel border border-line bg-surface p-5',
        className,
      )}
    >
      <figcaption className="text-xs font-medium tracking-caps text-fg-subtle uppercase">
        {label}
      </figcaption>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">{children}</div>
    </figure>
  );
}

function Loaders({ ui }: { ui: Moving }) {
  const [busy, setBusy] = useState(false);
  const save = useLoadingAction(() => new Promise((resolve) => setTimeout(resolve, 1600)));
  return (
    <Group
      id="loaders"
      title="Spinners and loaders"
      note="A spinner says work is under way and its length is unknown. Pick the kind by what is waiting; under reduced motion every one breathes in place instead of turning."
    >
      <div className="grid gap-4 md:grid-cols-5">
        {SPINNERS.map(({ variant, note }) => (
          <Tile key={variant} label={variant}>
            <div className="flex items-end justify-center gap-4 py-3">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <Spinner key={size} variant={variant} size={size} label={`Loading, ${variant}`} />
              ))}
            </div>
            <p className="text-center text-sm text-fg-muted">{note}</p>
          </Tile>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Tile label="Inline, with words">
          <Spinner variant="dots" size="sm" showLabel label="Matching 214 transactions" />
          <Spinner variant="pulse" size="sm" tone="muted" showLabel label="Syncing with the bank" />
          <Spinner variant="bars" size="sm" showLabel label="Uploading statements" />
        </Tile>
        <Tile label="Button, loading action">
          <div className="flex flex-wrap items-center gap-3">
            <Button loading={save.loading} onClick={() => void save.run()}>
              Save draft
            </Button>
            <Button
              variant="secondary"
              loading
              renderContent={({ children, loading }) =>
                loading ? (
                  <>
                    <Spinner size="sm" tone="current" decorative />
                    Exporting
                  </>
                ) : (
                  children
                )
              }
            >
              Export
            </Button>
          </div>
          <p className="text-sm text-fg-muted">
            Fast saves never flash a spinner; slow ones hold it long enough to read.
          </p>
        </Tile>
        <Tile label="Section overlay">
          <div
            aria-busy={busy || undefined}
            className="relative overflow-hidden rounded-control border border-line"
          >
            <div className="flex flex-col gap-2 p-4">
              <p className="text-sm font-medium">Exchange rates</p>
              <p className="text-sm text-fg-muted numeric">EUR to PLN 4.2817</p>
              <p className="text-sm text-fg-muted numeric">EUR to USD 1.0842</p>
            </div>
            <ui.LoadingOverlay visible={busy} label="Refreshing rates" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setBusy((b) => !b);
            }}
          >
            <ArrowsClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
            {busy ? 'Finish refresh' : 'Refresh rates'}
          </Button>
        </Tile>
      </div>
    </Group>
  );
}

function Skeletons({ ui }: { ui: Moving }) {
  const [loading, setLoading] = useState(true);
  return (
    <Group
      id="skeletons"
      title="Skeletons"
      note="When the shape of the result is known, draw it. The light runs down each preset as a wave; under reduced motion every shape is still."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Primitives">
          <div className="flex items-center gap-3">
            <SkeletonCircle size="lg" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonLine width="w-2/3" index={1} />
              <SkeletonLine size="sm" width="w-1/2" index={2} />
            </div>
          </div>
          <Skeleton className="h-20" index={3} />
          <div className="flex gap-2">
            <Skeleton animation="pulse" className="h-8 flex-1" />
            <Skeleton animation="pulse" className="h-8 w-20" index={2} />
          </div>
        </Tile>
        <Tile label="Text">
          <SkeletonText heading lines={4} />
        </Tile>
        <Tile label="List items">
          <SkeletonListItem count={3} />
        </Tile>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Card">
          <SkeletonCard />
        </Tile>
        <Tile label="Chart, bars">
          <SkeletonChart />
        </Tile>
        <Tile label="Chart, line">
          <SkeletonChart kind="line" points={10} />
        </Tile>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Tile label="Table rows">
          <SkeletonTable rows={4} columns={4} />
        </Tile>
        <Tile label="Swap to content">
          <ui.SkeletonSwap loading={loading} fallback={<SkeletonListItem count={2} />}>
            <ul className="divide-y divide-line">
              {PEOPLE.slice(0, 2).map((person) => (
                <li key={person.name} className="flex items-center gap-3 py-3">
                  <Avatar name={person.name} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{person.name}</span>
                    <span className="text-xs text-fg-muted">Approver, Finance</span>
                  </div>
                  <span className="text-sm numeric">12</span>
                </li>
              ))}
            </ul>
          </ui.SkeletonSwap>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => {
              setLoading((l) => !l);
            }}
          >
            {loading ? 'Show content' : 'Load again'}
          </Button>
        </Tile>
      </div>
    </Group>
  );
}

function ProgressGroup({ ui }: { ui: Moving }) {
  return (
    <Group
      id="progress"
      title="Progress and meters"
      note="Progress is work that finishes; a meter is a reading inside a known range. Thresholds mark the scale and the level is said in words."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Bar">
          <ui.Progress
            value={64}
            label="Uploading statements"
            showValue
            description="12 of 19 files"
          />
          <ui.Progress value={null} label="Preparing export" size="sm" />
          <ui.Progress value={100} label="Import done" tone="positive" showValue size="sm" />
        </Tile>
        <Tile label="Segmented">
          <ui.Progress value={62.5} segments={4} label="Account setup" showValue />
          <ui.Progress
            value={7}
            max={10}
            segments={10}
            size="lg"
            tone="warning"
            label="Seats used"
            description="7 of 10 seats used, nearing the Team plan limit"
          />
        </Tile>
        <Tile label="Ring">
          <div className="grid grid-cols-2 items-end justify-items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <ui.ProgressCircle value={72} size="lg" label="Profile complete" showLabel />
            <ui.ProgressCircle
              value={3}
              max={5}
              size="lg"
              tone="positive"
              label="Steps done"
              showLabel
            >
              3/5
            </ui.ProgressCircle>
            <ui.ProgressCircle value={40} size="md" label="Sync" showLabel />
            <ui.ProgressCircle value={null} size="md" label="Connecting" showLabel />
          </div>
        </Tile>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Tile label="Gauge, normal" className="items-center">
          <ui.Meter
            value={38}
            label="Budget spent"
            thresholds={{ warning: 75, critical: 90 }}
            levelLabels={{ normal: 'On track' }}
          />
        </Tile>
        <Tile label="Gauge, critical" className="items-center">
          <ui.Meter
            value={93}
            label="Storage used"
            thresholds={{ warning: 75, critical: 90 }}
            levelLabels={{ warning: 'Filling up', critical: 'Nearly full' }}
            description="46.5 of 50 GB"
          />
        </Tile>
        <Tile label="Bar meters" className="lg:col-span-2">
          <ui.Meter
            variant="bar"
            value={78}
            label="API calls this month"
            thresholds={{ warning: 75, critical: 95 }}
            levelLabels={{ warning: 'Above plan pace' }}
            description="78,000 of 100,000"
          />
          <ui.Meter
            variant="bar"
            value={34}
            label="Health score"
            thresholds={{ warning: 50, critical: 30, worse: 'low' }}
            levelLabels={{ normal: 'Healthy', warning: 'At risk' }}
          />
        </Tile>
      </div>
    </Group>
  );
}

function People() {
  return (
    <Group
      id="people"
      title="Avatars"
      note="Initials sit on a tint the name always picks, so a person keeps their colour. Status differs in shape as well as colour, and is in the name."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Sizes and status">
          <div className="flex flex-wrap items-end gap-3">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size, i) => (
              <Avatar
                key={size}
                size={size}
                name={PEOPLE[i]?.name ?? 'Ana Ruiz'}
                status={PEOPLE[i]?.status}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar size="lg" square name="Treasury" />
            <Avatar size="lg" square name="Northwind Logistics" />
            <Avatar size="md" square name="Payroll" status="online" />
          </div>
        </Tile>
        <Tile label="Stacked, hover or focus for names">
          <AvatarGroup label="Approvers" items={PEOPLE} max={4} locale="en" />
          <AvatarGroup
            label="Reviewers"
            items={PEOPLE.slice(2, 5)}
            size="lg"
            names="always"
            locale="en"
          />
        </Tile>
        <Tile label="Spaced, small">
          <AvatarGroup
            label="Watching"
            items={PEOPLE.slice(0, 6)}
            size="sm"
            spacing="spaced"
            max={5}
            names="always"
            locale="en"
          />
          <div className="flex items-center gap-3">
            <Avatar name="Sofia Conti" size="lg" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Sofia Conti</span>
              <span className="text-xs text-fg-muted">Controller, Milan office</span>
            </div>
          </div>
        </Tile>
      </div>
    </Group>
  );
}

function Messages({ ui }: { ui: Moving }) {
  const [shown, setShown] = useState(true);
  return (
    <Group
      id="messages"
      title="Alerts and banners"
      note="A banner speaks for the whole app, one at a time. An alert speaks for the part of the page it sits in. The icon and the title carry the tone, never a side stripe."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-panel border border-line">
          <ui.Banner dismissible action={<a href="#messages">See what changed</a>}>
            Bulk approvals are here: approve up to 50 expenses in one go.
          </ui.Banner>
        </div>
        <div className="overflow-hidden rounded-panel border border-line">
          <ui.Banner tone="neutral">
            Scheduled maintenance on Sunday 16 March, 02:00 to 03:00 CET.
          </ui.Banner>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <ui.Alert tone="info" title="Rates update at 16:00">
            Foreign invoices use the rate published the day before their date.
          </ui.Alert>
          <ui.Alert
            tone="success"
            title="Import finished"
            actions={
              <Button size="sm" variant="secondary">
                Review 214 lines
              </Button>
            }
          >
            214 transactions matched, 3 need a category.
          </ui.Alert>
          <ui.Alert
            tone="warning"
            title="Bank feed paused"
            actions={
              <>
                <Button size="sm">Reconnect</Button>
                <Button size="sm" variant="ghost">
                  Later
                </Button>
              </>
            }
          >
            Transactions after 12 March are not imported until you sign in to the bank again.
          </ui.Alert>
        </div>
        <div className="flex flex-col gap-3">
          <ui.Alert tone="danger" title="Payment to Northwind failed">
            The bank declined the transfer: insufficient funds on the operating account.
          </ui.Alert>
          <ui.Alert tone="neutral" variant="outline" title="Callout">
            Drafts are visible only to you until you submit them for approval.
          </ui.Alert>
          {shown ? (
            <ui.Alert
              tone="info"
              variant="outline"
              dismissible
              onDismiss={() => {
                setShown(false);
              }}
              title="New: export to your accounting system"
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setShown(true);
              }}
            >
              Show the dismissed alert
            </Button>
          )}
        </div>
      </div>
    </Group>
  );
}

function Structure() {
  return (
    <Group
      id="structure"
      title="Cards, disclosure and layout"
      note="Frame a thing only when the frame says something. Disclosures open in place and never animate their height."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="raised" interactive>
          <CardHeader>
            <CardTitle>
              <CardLink href="#structure">Q1 close checklist</CardLink>
            </CardTitle>
            <CardDescription>Due 5 April, owned by Lena Fischer</CardDescription>
            <CardAction>
              <Badge tone="warning">3 open</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <plain.Progress value={70} aria-label="Checklist done" size="sm" />
            <p className="text-sm text-fg-muted">
              7 of 10 tasks done. Bank reconciliation is next.
            </p>
          </CardContent>
          <CardFooter>
            <AvatarGroup label="Owners" items={PEOPLE.slice(0, 3)} size="xs" names="none" />
            <span className="ms-auto">Updated 2 h ago</span>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team plan</CardTitle>
            <CardDescription>12 seats, billed yearly</CardDescription>
          </CardHeader>
          <CardContent>
            <Separator label="Includes" />
            <ul className="flex flex-col gap-1.5 text-sm text-fg-muted">
              <li>Approval rules and audit trail</li>
              <li>Bank feeds for 4 accounts</li>
              <li>Exports to your accounting system</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button size="sm">Upgrade</Button>
            <Button size="sm" variant="ghost">
              Compare plans
            </Button>
          </CardFooter>
        </Card>
        <Card variant="sunken">
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5 text-sm">
              {SHORTCUTS.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3">
                  <span className="text-fg-muted">{s.label}</span>
                  <KbdCombo keys={s.keys} />
                </li>
              ))}
            </ul>
            <p className="text-sm text-fg-muted">
              Press <Kbd size="sm">Esc</Kbd> to close any panel.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Accordion" className="lg:col-span-2">
          <Accordion defaultValue={['vat']}>
            {FAQ.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionPanel>{item.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
          <Accordion variant="separated">
            <AccordionItem value="rules">
              <AccordionTrigger hint="4 rules">Approval rules</AccordionTrigger>
              <AccordionPanel>Expenses over 500 EUR need a second approver.</AccordionPanel>
            </AccordionItem>
            <AccordionItem value="feeds">
              <AccordionTrigger hint="2 paused">Bank feeds</AccordionTrigger>
              <AccordionPanel>Reconnect paused feeds from the bank settings.</AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Tile>
        <Tile label="Collapsible, scroll area">
          <Collapsible defaultOpen>
            <CollapsibleTrigger>Lines behind the total</CollapsibleTrigger>
            <CollapsiblePanel>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-fg-muted">Net</dt>
                <dd className="text-end numeric">1,240.00</dd>
                <dt className="text-fg-muted">VAT 23%</dt>
                <dd className="text-end numeric">285.20</dd>
              </dl>
            </CollapsiblePanel>
          </Collapsible>
          <Separator />
          <ScrollArea label="Recent receipts" className="h-40 rounded-control border border-line">
            <ul className="divide-y divide-line">
              {Array.from({ length: 12 }, (_, i) => (
                <li key={i} className="flex justify-between px-3 py-2 text-sm">
                  <span>Receipt {String(2040 - i)}</span>
                  <span className="text-fg-muted numeric">{(38.5 + i * 17.25).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div className="flex h-5 items-center gap-3 text-sm text-fg-muted">
            <span>Draft</span>
            <Separator orientation="vertical" />
            <span>EUR</span>
            <Separator orientation="vertical" />
            <span>March</span>
          </div>
        </Tile>
      </div>
    </Group>
  );
}

function Data({ ui }: { ui: Moving }) {
  const [step, setStep] = useState(2);
  return (
    <Group
      id="data"
      title="Stats, timelines, steps and empty states"
      note="Figures say how they moved in words as well as colour. Timelines are ordered lists; steps say their status to assistive technology."
    >
      <StatGroup>
        <Stat
          label="Active users"
          value="4,182"
          change={{ value: '12%', direction: 'up', favourable: true, comparison: 'vs last week' }}
        />
        <Stat
          label="Median response"
          value="182"
          unit="ms"
          change={{
            value: '9 ms',
            direction: 'down',
            favourable: true,
            comparison: 'vs last week',
          }}
        />
        <Stat
          label="Churn"
          value="2.1%"
          change={{
            value: '0.4 pt',
            direction: 'up',
            favourable: false,
            comparison: 'vs February',
          }}
        />
        <Stat
          label="Open tickets"
          value="31"
          change={{ value: 'no change', direction: 'flat', comparison: 'since Monday' }}
        />
      </StatGroup>
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Activity">
          <ui.Timeline density="compact">
            {ACTIVITY.map((a) => (
              <ui.TimelineItem
                key={a.iso}
                marker={<Avatar name={a.name} size="sm" />}
                title={
                  <>
                    <span className="font-medium">{a.name}</span> {a.action}
                  </>
                }
                time={{ dateTime: a.iso, label: a.when }}
              />
            ))}
          </ui.Timeline>
        </Tile>
        <Tile label="Audit trail">
          <ui.Timeline>
            <ui.TimelineItem
              title="Invoice INV-2041 created"
              icon={<FileTextIcon weight="bold" />}
              time={{ dateTime: '2026-03-02T09:14', label: '2 Mar' }}
            />
            <ui.TimelineItem
              title="Sent to Northwind Logistics"
              tone="accent"
              icon={<PaperPlaneTiltIcon weight="bold" />}
              time={{ dateTime: '2026-03-02T09:20', label: '2 Mar' }}
            />
            <ui.TimelineItem
              title="Reminder sent"
              tone="warning"
              icon={<LightningIcon weight="bold" />}
              time={{ dateTime: '2026-03-12T08:00', label: '12 Mar' }}
            >
              Overdue by 3 days.
            </ui.TimelineItem>
            <ui.TimelineItem
              title="Paid in full"
              tone="positive"
              icon={<ReceiptIcon weight="bold" />}
              time={{ dateTime: '2026-03-14T10:02', label: '14 Mar' }}
            />
          </ui.Timeline>
        </Tile>
        <Tile label="Plain dots">
          <ui.Timeline>
            <ui.TimelineItem
              title="Draft saved"
              time={{ dateTime: '2026-03-14T08:00', label: '08:00' }}
            />
            <ui.TimelineItem
              title="Submitted for approval"
              tone="accent"
              time={{ dateTime: '2026-03-14T08:10', label: '08:10' }}
            />
            <ui.TimelineItem
              title="Rejected: missing receipt"
              tone="negative"
              time={{ dateTime: '2026-03-14T09:30', label: '09:30' }}
            >
              “Please attach the hotel invoice.”
            </ui.TimelineItem>
          </ui.Timeline>
        </Tile>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Tile label="Stepper, horizontal">
          <Stepper
            steps={SETUP_STEPS}
            current={step}
            label="Account setup"
            onStepSelect={setStep}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={step === 0}
              onClick={() => {
                setStep((s) => Math.max(0, s - 1));
              }}
            >
              Back
            </Button>
            <Button
              size="sm"
              disabled={step === SETUP_STEPS.length}
              onClick={() => {
                setStep((s) => Math.min(SETUP_STEPS.length, s + 1));
              }}
            >
              Continue
            </Button>
          </div>
        </Tile>
        <Tile label="Stepper, vertical">
          <Stepper
            orientation="vertical"
            label="Payout"
            current={1}
            steps={[
              { title: 'Request created', description: 'By Ana Ruiz, 14 Mar' },
              { title: 'Bank check', description: 'IBAN does not match the name', status: 'error' },
              { title: 'Approval' },
              { title: 'Paid' },
            ]}
          />
        </Tile>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Tile label="Empty, page" className="lg:col-span-2">
          <EmptyState
            size="lg"
            icon={<UsersThreeIcon weight="duotone" />}
            title="Invite your team"
            description="Approvers and accountants you invite see the reports you share with them."
            actions={
              <>
                <Button>Invite people</Button>
                <Button variant="ghost">Import from CSV</Button>
              </>
            }
          />
        </Tile>
        <Tile label="Empty, panel and slot">
          <EmptyState
            size="sm"
            icon={<GearSixIcon weight="bold" />}
            title="No rules yet"
            description="Expenses go straight to the default approver."
          />
          <EmptyState
            size="sm"
            variant="dashed"
            icon={<CloudArrowUpIcon weight="bold" />}
            title="Drop receipts here"
            description="PDF, JPG or PNG, up to 10 MB each."
          />
        </Tile>
      </div>
    </Group>
  );
}

function readParams(search: string) {
  const params = new URLSearchParams(search);
  const section = DISPLAY_SECTIONS.find((s) => s === params.get('section'));
  return { section };
}

/**
 * The display components: loaders, skeletons, progress, avatars, messages, structure and data.
 * `&motion=on` swaps in the motion add-on's twins; `&section=<name>` shows one group.
 */
export function DisplayPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const canvas = usePageCanvas(theme, mode);
  const { section } = readParams(window.location.search);
  const ui: Moving = motion ? { ...plain, ...moving } : plain;
  const show = (name: DisplaySection) => section === undefined || section === name;
  const themeName = THEMES.find((t) => t.id === theme)?.name ?? theme;
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      className="min-h-dvh bg-surface-canvas text-fg"
    >
      <moving.MotionPreferenceProvider value={motion ? 'user' : 'off'}>
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-10 px-4 py-8 sm:px-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl font-heading tracking-tight">Display</h1>
              <p className="text-sm text-fg-muted">
                {themeName}, {mode}
                {motion ? ', motion add-on' : ''}
              </p>
            </div>
            <nav aria-label="Theme and mode" className="flex flex-wrap gap-2 text-sm">
              {THEMES.flatMap((t) =>
                MODES.map((m) => (
                  <a
                    key={`${t.id}-${m}`}
                    href={`?view=display&theme=${t.id}&mode=${m}${motion ? '&motion=on' : ''}`}
                    aria-current={t.id === theme && m === mode ? 'page' : undefined}
                    className="rounded-control px-2 py-1 text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus aria-[current=page]:bg-surface-selected aria-[current=page]:text-fg"
                  >
                    {t.name} {m}
                  </a>
                )),
              )}
            </nav>
          </header>
          {show('loaders') && <Loaders ui={ui} />}
          {show('skeletons') && <Skeletons ui={ui} />}
          {show('progress') && <ProgressGroup ui={ui} />}
          {show('people') && <People />}
          {show('messages') && <Messages ui={ui} />}
          {show('structure') && <Structure />}
          {show('data') && <Data ui={ui} />}
        </div>
      </moving.MotionPreferenceProvider>
    </ThemeScope>
  );
}
