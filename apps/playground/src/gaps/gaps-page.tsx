import {
  ArrowClockwiseIcon,
  BellRingingIcon,
  FileTextIcon,
  GearIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import { Button as MotionButton } from '@rectio/motion';
import {
  CommandMenu,
  CommandMenuTrigger,
  DatePicker,
  DateRangePicker,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Button as PlainButton,
  SkeletonLine,
  ThemeScope,
  type ButtonProps,
  type CommandGroup,
  type DateRange,
  type SkeletonWidth,
} from '@rectio/ui';
import { useState, type ComponentType, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';

/** Enough commands that the list scrolls, so the edge fades show. */
const COMMANDS: CommandGroup[] = [
  {
    label: 'Go to',
    items: [
      'Overview',
      'Invoices',
      'Payables',
      'Expenses',
      'Journal',
      'Bank reconciliation',
      'Cash runway',
      'Budget',
      'Tax summary',
      'Vendors',
      'Payouts',
      'Reports',
    ].map((label) => ({
      id: `go-${label}`,
      label,
      icon: <FileTextIcon aria-hidden className="size-4" />,
      onSelect: () => undefined,
    })),
  },
  {
    label: 'Actions',
    items: [
      'New invoice',
      'Record a payment',
      'Submit an expense',
      'Export the ledger',
      'Invite a teammate',
      'Close the month',
      'Open settings',
    ].map((label) => ({
      id: `do-${label}`,
      label,
      icon: <GearIcon aria-hidden className="size-4" />,
      onSelect: () => undefined,
    })),
  },
];

const WIDTHS: SkeletonWidth[] = ['full', '3/4', '1/2', '1/3', '42%', 'xl', 'md'];

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-(--rx-popover-radius) border border-line bg-surface p-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-heading tracking-tight">{title}</h2>
        <p className="text-sm text-fg-muted">{note}</p>
      </header>
      {children}
    </section>
  );
}

/** One button idle and the same button loading, side by side, so the widths can be compared. */
function Pair({ Button, ...props }: ButtonProps & { Button: ComponentType<ButtonProps> }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...props} />
      <Button {...props} loading />
    </div>
  );
}

/** The kit's recent fixes in one theme and mode, for design rounds. */
export function GapsPage({ theme, mode, motion }: { theme: ThemeId; mode: Mode; motion: boolean }) {
  const canvas = usePageCanvas(theme, mode);
  const Button = motion ? MotionButton : PlainButton;
  const open = new URLSearchParams(window.location.search).get('open') === 'command';
  const [due, setDue] = useState<Date | null>(new Date(2026, 2, 19));
  const [issued, setIssued] = useState<Date | null>(new Date(2026, 2, 5));
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 1),
    to: new Date(2026, 2, 31),
  });

  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-heading tracking-tight">Kit fixes</h1>
          <p className="text-sm text-fg-muted">
            Field errors, skeleton widths, loading buttons, date formats and the command menu.
          </p>
        </header>

        <Section
          title="Field errors"
          note="An invalid field with no message shows nothing; a message keeps its icon level with the first line."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Field invalid>
              <FieldLabel>Reference</FieldLabel>
              <Input defaultValue="INV-0142" />
              <FieldError>{null}</FieldError>
            </Field>
            <Field invalid>
              <FieldLabel>IBAN</FieldLabel>
              <Input defaultValue="IE29 AIBK 9311" />
              <FieldError>Enter all 22 characters of the IBAN.</FieldError>
            </Field>
            <Field invalid>
              <FieldLabel>Amount</FieldLabel>
              <Input defaultValue="12 400" />
              <FieldDescription>Up to your approval limit.</FieldDescription>
              <FieldError>
                Above your approval limit of €10,000. Ask a finance admin to approve it.
              </FieldError>
            </Field>
          </div>
        </Section>

        <Section
          title="Skeleton widths"
          note="Fractions, fixed steps and a percentage, each with its own line."
        >
          <div className="flex flex-col gap-3">
            {WIDTHS.map((width, index) => (
              <div key={width} className="flex items-center gap-4">
                <span className="w-12 shrink-0 text-xs text-fg-subtle numeric">{width}</span>
                <div className="min-w-0 flex-1">
                  <SkeletonLine width={width} index={index} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Loading buttons"
          note="Each button idle, then loading: the label stays, and a leading icon gives its slot to the spinner."
        >
          <div className="flex flex-col gap-4">
            <Pair Button={Button}>Sign in</Pair>
            <Pair Button={Button} variant="secondary">
              <BellRingingIcon aria-hidden weight="bold" className="size-4" />
              Send reminder
            </Pair>
            <Pair Button={Button}>
              <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
              Send invoice
            </Pair>
            <Pair Button={Button} size="sm" variant="ghost">
              <ArrowClockwiseIcon aria-hidden weight="bold" className="size-4" />
              Refresh
            </Pair>
            <Pair Button={Button} iconOnly variant="secondary" aria-label="Refresh">
              <ArrowClockwiseIcon aria-hidden weight="bold" className="size-4" />
            </Pair>
          </div>
        </Section>

        <Section
          title="Date formats"
          note="The short date by default, a pattern with a month name, and the locale's medium date."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Field>
              <FieldLabel>Due date</FieldLabel>
              <DatePicker value={due} onValueChange={setDue} locale="en-GB" />
            </Field>
            <Field>
              <FieldLabel>Issued</FieldLabel>
              <DatePicker
                value={issued}
                onValueChange={setIssued}
                locale="en-GB"
                displayFormat="d MMM yyyy"
              />
            </Field>
            <Field>
              <FieldLabel>Data wystawienia</FieldLabel>
              <DatePicker
                value={issued}
                onValueChange={setIssued}
                locale="pl-PL"
                displayFormat="PP"
              />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5 sm:w-72">
            <span className="text-sm font-medium">Statement period</span>
            <DateRangePicker
              aria-label="Statement period"
              value={range}
              onValueChange={setRange}
              locale="en-GB"
              displayFormat="d MMM"
            />
          </div>
        </Section>

        <Section
          title="Command menu"
          note="A long list fades at the edge that hides rows, top, bottom or both."
        >
          <CommandMenu groups={COMMANDS} defaultOpen={open}>
            <CommandMenuTrigger />
          </CommandMenu>
        </Section>
      </main>
    </ThemeScope>
  );
}
