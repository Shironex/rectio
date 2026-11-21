import { FileTextIcon, FolderIcon, FunnelIcon, TrashIcon } from '@phosphor-icons/react';
import {
  AlertDialogContent as MotionAlertDialogContent,
  CopyButton as MotionCopyButton,
  SegmentedControl as MotionSegmentedControl,
} from '@rectio/motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  FieldLabel,
  Input,
  Money,
  AlertDialogContent as PlainAlertDialogContent,
  CopyButton as PlainCopyButton,
  SegmentedControl as PlainSegmentedControl,
  Rating,
  RatingDisplay,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Switch,
  ThemeScope,
  Tree,
  type TreeNode,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';

const STATUSES = [
  { value: 'all', label: 'All', hint: 48 },
  { value: 'unpaid', label: 'Unpaid', hint: 11 },
  { value: 'overdue', label: 'Overdue', hint: 3 },
  { value: 'paid', label: 'Paid', hint: 34 },
  { value: 'void', label: 'Void', hint: 0 },
] as const;

const PERIODS = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
] as const;

const folder = <FolderIcon weight="bold" />;
const file = <FileTextIcon weight="bold" />;

const ACCOUNTS: TreeNode[] = [
  {
    id: 'assets',
    label: 'Assets',
    icon: folder,
    meta: '€412,980',
    children: [
      {
        id: 'bank',
        label: 'Bank accounts',
        icon: folder,
        meta: '€186,240',
        children: [
          { id: 'operating', label: '1010 Operating account', icon: file, meta: '€142,800' },
          { id: 'payroll', label: '1020 Payroll account', icon: file, meta: '€38,440' },
          { id: 'savings', label: '1030 Tax reserve', icon: file, meta: '€5,000' },
        ],
      },
      { id: 'receivables', label: '1200 Receivables', icon: file, meta: '€96,410' },
      { id: 'prepaid', label: '1300 Prepaid expenses', icon: file, meta: '€12,330' },
    ],
  },
  {
    id: 'liabilities',
    label: 'Liabilities',
    icon: folder,
    meta: '€88,120',
    children: [
      { id: 'payables', label: '2000 Payables', icon: file, meta: '€61,900' },
      { id: 'vat', label: '2200 VAT owed', icon: file, meta: '€26,220' },
    ],
  },
  { id: 'archive', label: 'Closed accounts', icon: folder, hasChildren: true },
  { id: 'imported', label: 'Imported from the old ledger', icon: folder, hasChildren: true },
  { id: 'equity', label: 'Equity (locked for the audit)', icon: folder, disabled: true },
];

/** Closed accounts load; the old ledger import fails, to show the retry row. */
function loadChildren(node: TreeNode): Promise<TreeNode[]> {
  if (node.id === 'imported') return Promise.reject(new Error('offline'));
  return Promise.resolve([
    { id: 'old-1', label: '1040 Old savings, closed 2024', icon: file },
    { id: 'old-2', label: '1050 Card clearing, closed 2023', icon: file },
  ]);
}

const INVOICES = [
  { id: '2041', customer: 'Nordlicht GmbH', status: 'Sent' },
  { id: '2040', customer: 'Kestrel Logistics', status: 'Paid' },
  { id: '2039', customer: 'Halden Print Works', status: 'Overdue' },
  { id: '2038', customer: 'Brightwater Studio', status: 'Paid' },
  { id: '2037', customer: 'Okafor and Lind', status: 'Paid' },
] as const;

const VENDORS = [
  { name: 'Nordlicht GmbH', score: 4.6 },
  { name: 'Kestrel Logistics', score: 3.8 },
  { name: 'Halden Print Works', score: 2.4 },
] as const;

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-(--rx-popover-radius) border border-line bg-surface p-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-heading tracking-tight">{title}</h2>
        <p className="text-sm text-pretty text-fg-muted">{note}</p>
      </header>
      {children}
    </section>
  );
}

const phoneWidth = () => window.matchMedia('(width < 40rem)').matches;

/** The new primitives in one theme and mode, for design rounds. `open` shows an overlay open. */
export function PrimitivesPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const canvas = usePageCanvas(theme, mode);
  const SegmentedControl = motion ? MotionSegmentedControl : PlainSegmentedControl;
  const AlertDialogContent = motion ? MotionAlertDialogContent : PlainAlertDialogContent;
  const CopyButton = motion ? MotionCopyButton : PlainCopyButton;
  const open = new URLSearchParams(window.location.search).get('open');
  const [status, setStatus] = useState<(typeof STATUSES)[number]['value']>('unpaid');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['value']>('quarter');
  const [score, setScore] = useState<number | null>(3.5);
  const [selected, setSelected] = useState<string[]>(['operating']);
  const [vertical] = useState(phoneWidth);

  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-heading tracking-tight">Primitives</h1>
          <p className="text-sm text-fg-muted">
            Segmented control, alert dialog, drawer, copy button, rating, tree and resizable panels.
          </p>
        </header>

        <Section
          title="Segmented control"
          note="One choice from a few, with counts. Two even columns on a phone; a short set stays in one row."
        >
          <div className="flex flex-col gap-4">
            <SegmentedControl
              legend="Invoice status"
              options={STATUSES}
              value={status}
              onValueChange={setStatus}
            />
            <SegmentedControl
              label="Period"
              layout="row"
              size="sm"
              options={PERIODS}
              value={period}
              onValueChange={setPeriod}
            />
          </div>
        </Section>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Section
            title="Alert dialog"
            note="Opens on the safe answer. The action waits for the request before it closes."
          >
            <AlertDialog defaultOpen={open === 'alert'}>
              <AlertDialogTrigger render={<Button variant="danger" className="self-start" />}>
                <TrashIcon aria-hidden weight="bold" className="size-4" />
                Delete draft
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete draft invoice 2041?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The draft for Nordlicht GmbH and its three lines are removed. Sent invoices are
                    not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep draft</AlertDialogCancel>
                  <AlertDialogAction
                    onAction={() =>
                      new Promise<void>((done) => {
                        setTimeout(done, 900);
                      })
                    }
                  >
                    Delete draft
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>

          <Section
            title="Drawer"
            note="A side panel here, a bottom sheet on a phone that a swipe down closes."
          >
            <Drawer defaultOpen={open === 'drawer'}>
              <DrawerTrigger render={<Button variant="secondary" className="self-start" />}>
                <FunnelIcon aria-hidden weight="bold" className="size-4" />
                Filter expenses
              </DrawerTrigger>
              <DrawerContent size="sm">
                <DrawerHeader>
                  <DrawerTitle>Filter expenses</DrawerTitle>
                  <DrawerDescription>
                    Narrow the March report by status and owner.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerBody>
                  <PlainSegmentedControl
                    legend="Status"
                    size="sm"
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                    defaultValue="pending"
                  />
                  <Field>
                    <FieldLabel>Owner</FieldLabel>
                    <Input defaultValue="Rory Quinn" />
                  </Field>
                  <label className="flex items-center justify-between gap-4 text-sm text-fg">
                    Only with receipts missing
                    <Switch />
                  </label>
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose render={<Button variant="ghost" />}>Clear</DrawerClose>
                  <DrawerClose render={<Button />}>Show 12 expenses</DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </Section>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Section
            title="Copy button"
            note="Copies in one press, shows a check and says Copied. Falls back where the clipboard is blocked."
          >
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2">
                <div className="min-w-0">
                  <dt className="text-fg-muted">IBAN</dt>
                  <dd className="truncate font-mono text-fg">IE29 AIBK 9311 5212 3456 78</dd>
                </div>
                <CopyButton value="IE29AIBK93115212345678" label="Copy IBAN" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2">
                <div className="min-w-0">
                  <dt className="text-fg-muted">Payment reference</dt>
                  <dd className="truncate font-mono text-fg">INV-2041</dd>
                </div>
                <CopyButton value="INV-2041" showLabel variant="secondary" />
              </div>
            </dl>
          </Section>

          <Section
            title="Rating"
            note="Radios with half steps to set it; one image with its reading to show it."
          >
            <div className="flex flex-col gap-1.5">
              <span id="primitives-rating" className="text-sm font-medium text-fg">
                How was the delivery?
              </span>
              <div className="flex items-center gap-3">
                <Rating
                  aria-labelledby="primitives-rating"
                  value={score}
                  onValueChange={setScore}
                  allowHalf
                />
                <span className="text-sm text-fg-muted numeric">
                  {score === null ? 'Not rated' : `${String(score)} of 5`}
                </span>
              </div>
            </div>
            <ul className="flex flex-col divide-y divide-line text-sm">
              {VENDORS.map((vendor) => (
                <li key={vendor.name} className="flex items-center justify-between gap-4 py-2">
                  <span className="truncate text-fg">{vendor.name}</span>
                  <RatingDisplay value={vendor.score} size="sm" showValue />
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span id="primitives-rating-locked" className="text-fg-muted">
                Your rating, locked after approval
              </span>
              <Rating
                aria-labelledby="primitives-rating-locked"
                defaultValue={4}
                readOnly
                size="sm"
              />
            </div>
          </Section>
        </div>

        <Section
          title="Tree"
          note="A chart of accounts. Arrow keys open and step in, typing jumps. Closed accounts load on open; the import fails and offers a retry."
        >
          <div className="rounded-control border border-line">
            <Tree
              aria-label="Chart of accounts"
              items={ACCOUNTS}
              defaultExpanded={['assets', 'bank', 'imported']}
              selected={selected}
              onSelectedChange={setSelected}
              loadChildren={loadChildren}
              className="max-h-120"
            />
          </div>
        </Section>

        <Section
          title="Resizable panels"
          note="Drag the line or focus it and use the arrow keys. Stacked on a phone."
        >
          <div className="h-96 overflow-hidden rounded-control border border-line">
            <ResizablePanelGroup direction={vertical ? 'vertical' : 'horizontal'}>
              <ResizablePanel
                id="pg-list"
                defaultSize={vertical ? 50 : 38}
                minSize={25}
                maxSize={65}
              >
                <ul className="flex flex-col divide-y divide-line text-sm">
                  {INVOICES.map((invoice) => (
                    <li
                      key={invoice.id}
                      data-current={invoice.id === '2041' || undefined}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 data-current:bg-surface-selected"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-medium text-fg">{invoice.customer}</span>
                        <span className="text-fg-muted numeric">Invoice {invoice.id}</span>
                      </span>
                      <Badge
                        tone={
                          invoice.status === 'Paid'
                            ? 'positive'
                            : invoice.status === 'Overdue'
                              ? 'negative'
                              : 'info'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </ResizablePanel>
              <ResizableHandle label="Resize the invoice list" withGrip />
              <ResizablePanel id="pg-detail" minSize={30}>
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-heading tracking-tight text-fg">
                      Invoice 2041
                    </h3>
                    <Badge tone="info">Sent</Badge>
                  </div>
                  <p className="text-sm text-fg-muted">
                    Nordlicht GmbH, issued 12 March, due 11 April.
                  </p>
                  <Money amount={2374.6} currency="EUR" locale="en-IE" className="text-2xl" />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </Section>
      </main>
    </ThemeScope>
  );
}
