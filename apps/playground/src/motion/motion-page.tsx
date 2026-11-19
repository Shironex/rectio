import { ArrowLeftIcon, MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import {
  MotionPreferenceProvider,
  readMotionTokens,
  usePlainMotion,
  type MotionTokens,
  type SpringToken,
} from '@rectio/motion';
import {
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectTrigger,
  Table,
  TableBody,
  TableCell as PlainTableCell,
  TableFooter,
  TableHead,
  TableRow as PlainTableRow,
  ThemeScope,
  formatMoney,
} from '@rectio/ui';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

import { CATEGORIES } from '../expenses/data';
import { KitProvider, useHeldUntilCount, useKit } from '../expenses/kit';
import { usePageCanvas } from '../page-canvas';
import { MODES, THEMES, type Mode, type ThemeId } from '../themes';

const CURRENCY = 'EUR';
const LOCALE = 'en-IE';
const SAVE_DELAY_MS = 1400;

/**
 * Waits on the animation clock rather than a timer, so a capture that slows animations down slows
 * the demo's pretend work with them and shows the whole loading state.
 */
function afterAnimationTime(ms: number, then: () => void) {
  const hold = new Animation(new KeyframeEffect(null, null, ms), document.timeline);
  hold.onfinish = then;
  hold.play();
}
const STEP = 10;
const ITEMS = CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
const LINES = [
  { id: 'l1', merchant: 'Lufthansa', amount: 412.8 },
  { id: 'l2', merchant: 'Deutsche Bahn', amount: 129.4 },
  { id: 'l3', merchant: 'Hotel Adlon', amount: 486 },
];
const EXTRA = [
  { merchant: 'Figma', amount: 54.12 },
  { merchant: 'Café Einstein', amount: 38.5 },
  { merchant: 'Staples', amount: 21.99 },
];

const LINK =
  'inline-flex min-h-6 items-center text-sm text-accent-strong underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const ms = (seconds: number) => `${String(Math.round(seconds * 1000))} ms`;

/** About when a spring is within 2 percent of rest, and whether it can overshoot. */
function springSpec({ stiffness, damping, mass }: SpringToken) {
  const omega = Math.sqrt(stiffness / mass);
  const ratio = damping / (2 * Math.sqrt(stiffness * mass));
  // Near critical damping the 2 percent settling time is about 5.8 / omega.
  const settle = ratio >= 0.95 ? 5.8 / omega : 4 / (ratio * omega);
  return `${ms(settle)}, ${ratio >= 0.95 ? 'no overshoot' : 'slight overshoot'}`;
}

/**
 * The timing behind each motioned specimen, read from the theme's tokens on the page itself, so
 * the numbers are the ones the components use in this theme.
 */
type Spec = (tokens: MotionTokens) => string;

/** Which column a specimen is in, so it can say what moves there. */
const InMotionColumn = createContext(false);

/** One specimen: a title, what moves in this column, then the live component. */
function Specimen({
  title,
  plain,
  motion,
  spec,
  plainSpec,
  children,
}: {
  title: string;
  /** The motioned timing, from tokens. */
  spec: Spec;
  /** The plain timing, from the same tokens. */
  plainSpec: Spec;
  /** What the plain base does. */
  plain: string;
  /** What the add-on changes. */
  motion: string;
  children: ReactNode;
}) {
  const inMotion = use(InMotionColumn);
  const note = inMotion ? motion : plain;
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-fg">
          {title}
          <span className="text-fg-muted md:sr-only">, {inMotion ? 'motion' : 'plain'}</span>
        </h2>
        {/* Two lines kept for every note, so plain and motion specimens start level. */}
        <p className="min-h-[2lh] max-w-prose text-sm text-fg-muted">{note}</p>
        {/* One fixed slot for the timing in both columns, so each pair starts level. */}
        <p
          className="mt-1 min-h-[2lh] font-mono text-xs text-fg-muted"
          ref={(element) => {
            if (element === null) return;
            const tokens = readMotionTokens(element);
            element.textContent =
              tokens === null ? 'Motion tokens missing.' : (inMotion ? spec : plainSpec)(tokens);
          }}
        />
      </div>
      <div className="flex min-h-11 flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function ButtonSpecimen() {
  const { Button } = useKit();
  const [saving, setSaving] = useState(false);
  return (
    <Specimen
      title="Button"
      plainSpec={(t) => `Press: CSS scale, ${ms(t.duration.fast)}. Loading: instant swap.`}
      spec={(t) =>
        `Press: ${springSpec(t.spring.press)}. Loading: label out in ${ms(t.duration.fast)}, spinner in from ${ms(t.duration.fast * 0.6)}.`
      }
      plain="Press scales in CSS. Loading swaps the label for a spinner, same width."
      motion="Press eases back to rest with no overshoot. Loading lifts the label out, then the spinner in."
    >
      <Button
        loading={saving}
        onClick={() => {
          setSaving(true);
          afterAnimationTime(SAVE_DELAY_MS, () => {
            setSaving(false);
          });
        }}
      >
        Save expense
      </Button>
      <Button variant="secondary">Export</Button>
    </Specimen>
  );
}

function AmountSpecimen() {
  const { AmountInput, Button } = useKit();
  const [amount, setAmount] = useState<number | null>(129.4);
  const step = (by: number) => {
    setAmount((a) => Math.max(0, Math.round(((a ?? 0) + by) * 100) / 100));
  };
  return (
    <Specimen
      title="Amount input"
      plainSpec={() => 'Figures change in place, no movement.'}
      spec={(t) => `Nudge: ${t.distance.tick} over ${ms(t.duration.base)}, ease out. Steps only.`}
      plain="A stepped change replaces the figures in place."
      motion="A stepped change nudges the figures a hair toward its direction. Typing never moves them."
    >
      <Field className="w-44">
        <FieldLabel>Amount, EUR</FieldLabel>
        <AmountInput currency={CURRENCY} locale={LOCALE} value={amount} onValueChange={setAmount} />
        <FieldDescription>Arrow keys step by 0.01, the buttons by 10.00.</FieldDescription>
      </Field>
      <div className="flex gap-1 self-center">
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          aria-label={`Subtract ${String(STEP)}.00`}
          onClick={() => {
            step(-STEP);
          }}
        >
          <MinusIcon aria-hidden weight="bold" className="size-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          aria-label={`Add ${String(STEP)}.00`}
          onClick={() => {
            step(STEP);
          }}
        >
          <PlusIcon aria-hidden weight="bold" className="size-3.5" />
        </Button>
      </div>
    </Specimen>
  );
}

function RowsSpecimen() {
  const { Button, Money, TableRows, TableRow, TableCell } = useKit();
  const [lines, setLines] = useState(LINES);
  const [added, setAdded] = useState(0);
  /** After a removal, focus goes to the line that took its place, or to the add button. */
  const focusNext = useRef<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = focusNext.current;
    if (id === null) return;
    focusNext.current = null;
    tableRef.current?.querySelector<HTMLElement>(`[data-focus="${id}"]`)?.focus();
  }, [lines]);
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const [count, countRef] = useHeldUntilCount(lines.length);
  const next = EXTRA[added % EXTRA.length];
  return (
    <Specimen
      title="Rows and total"
      plainSpec={() => 'Rows and total change at once.'}
      spec={(t) =>
        `Row: ${ms(t.duration.base)}. Total: waits ${ms(t.duration.base)}, counts ${ms(t.duration.count)}, ease out.`
      }
      plain="Lines appear and disappear at once; the total changes in one step."
      motion="A new line opens in place, a removed one fades and closes the gap. The total counts to its new figure and settles: the one signature moment."
    >
      <div ref={tableRef} className="flex w-full flex-col gap-3">
        <Table>
          <caption className="sr-only">Lines</caption>
          <TableBody>
            <TableRows>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.merchant}</TableCell>
                  <TableCell align="end">
                    <Money amount={line.amount} currency={CURRENCY} locale={LOCALE} />
                  </TableCell>
                  <TableCell align="end" className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Remove ${line.merchant}`}
                      data-focus={line.id}
                      className="text-fg-subtle hover:text-fg"
                      onClick={() => {
                        const index = lines.findIndex((l) => l.id === line.id);
                        focusNext.current = (lines[index + 1] ?? lines[index - 1])?.id ?? 'add';
                        setLines((list) => list.filter((l) => l.id !== line.id));
                      }}
                    >
                      <TrashIcon aria-hidden weight="bold" className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableRows>
          </TableBody>
          <TableFooter>
            <PlainTableRow>
              <TableHead ref={countRef} scope="row">
                Total, {count} lines
              </TableHead>
              <PlainTableCell align="end" className="text-xl font-strong">
                <Money amount={total} currency={CURRENCY} locale={LOCALE} />
              </PlainTableCell>
              <PlainTableCell />
            </PlainTableRow>
          </TableFooter>
        </Table>
        {next !== undefined && (
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            data-focus="add"
            onClick={() => {
              setLines((list) => [...list, { id: `x${String(added)}`, ...next }]);
              setAdded((n) => n + 1);
            }}
          >
            <PlusIcon aria-hidden weight="bold" className="size-3.5" />
            Add {next.merchant}, {formatMoney(next.amount, CURRENCY, { locale: LOCALE })}
          </Button>
        )}
      </div>
    </Specimen>
  );
}

function DialogSpecimen() {
  const { Button, Dialog, DialogContent, DialogTrigger } = useKit();
  return (
    <Specimen
      title="Dialog"
      plainSpec={(t) =>
        `Open: CSS rise and fade, ${ms(t.duration.slow)}. Close: ${ms(t.duration.fast)}.`
      }
      spec={(t) =>
        `Open: ${springSpec(t.spring.overlay)}, from ${String(t.scale.origin)} and ${t.distance.origin} toward the trigger. Close: ${ms(t.duration.fast)} fade.`
      }
      plain="Rises a few pixels and fades in, in CSS."
      motion="Grows from the side of the button that opened it and leans back toward it on close."
    >
      <Dialog>
        <DialogTrigger render={<Button variant="secondary" />}>Submit for approval</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit report 2041?</DialogTitle>
            <DialogDescription>
              Anna Kowalska's March report goes to Piotr Nowak for approval.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-fg-muted">You can still withdraw it until it is approved.</p>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <DialogClose render={<Button />}>Submit</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Specimen>
  );
}

function SelectSpecimen() {
  const { SelectContent, SelectItem } = useKit();
  return (
    <Specimen
      title="Select"
      plainSpec={(t) => `List: CSS fade and scale, ${ms(t.duration.base)}. Highlight: instant.`}
      spec={(t) =>
        `List: ${springSpec(t.spring.overlay)}. Highlight: ${springSpec(t.spring.press)}.`
      }
      plain="The list fades in from its trigger; each option highlights itself."
      motion="The list grows from its trigger. On arrow keys, one highlight glides to the next option."
    >
      <Field className="w-56">
        <FieldLabel>Category</FieldLabel>
        <Select items={ITEMS} defaultValue="rail">
          <SelectTrigger placeholder="Choose a category" />
          <SelectContent>
            {ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </Specimen>
  );
}

/** One specimen in both kits, side by side, so each row lines up across the two columns. */
function Pair({ specimen: Specimen }: { specimen: () => ReactNode }) {
  return (
    <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
      {([false, true] as const).map((motion) => (
        <KitProvider key={String(motion)} motion={motion}>
          <InMotionColumn value={motion}>
            <div data-column={motion ? 'motion' : 'plain'} className="flex min-w-0 flex-col">
              <Specimen />
            </div>
          </InMotionColumn>
        </KitProvider>
      ))}
    </div>
  );
}

/** Plain beside motioned, every motioned component, in one theme and mode. */
export function MotionPage({ theme, mode }: { theme: ThemeId; mode: Mode }) {
  const [off, setOff] = useState(false);
  return (
    <MotionPreferenceProvider value={off ? 'off' : 'user'}>
      <Page theme={theme} mode={mode} off={off} onOffChange={setOff} />
    </MotionPreferenceProvider>
  );
}

function Page({
  theme,
  mode,
  off,
  onOffChange,
}: {
  theme: ThemeId;
  mode: Mode;
  off: boolean;
  onOffChange: (off: boolean) => void;
}) {
  const still = usePlainMotion();
  const canvas = usePageCanvas(mode);
  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <a
          href="?"
          className="inline-flex min-h-6 w-fit items-center gap-1.5 text-sm text-fg-muted underline decoration-line-strong underline-offset-4 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5" />
          All components
        </a>
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-heading tracking-tight">Motion add-on</h1>
          <p className="max-w-prose text-base text-fg-muted">
            The add-on beside the plain base. Same names and props: an app picks motion per
            component by importing it from <code className="font-mono text-sm">@rectio/motion</code>{' '}
            instead of <code className="font-mono text-sm">@rectio/ui</code>.
          </p>
          <nav aria-label="Theme and mode" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {THEMES.flatMap((t) =>
              MODES.map((m) => {
                const current = t.id === theme && m === mode;
                return (
                  <a
                    key={`${t.id}-${m}`}
                    href={`?view=motion&theme=${t.id}&mode=${m}`}
                    aria-current={current ? 'page' : undefined}
                    className={
                      current
                        ? 'inline-flex min-h-6 items-center text-sm font-medium text-fg'
                        : LINK
                    }
                  >
                    {t.name} {m}
                  </a>
                );
              }),
            )}
            <a
              href={`?view=app&motion=on&theme=${theme}&mode=${mode}`}
              className={`${LINK} sm:ms-auto`}
            >
              Expense report with motion
            </a>
          </nav>
          <label className="flex min-h-6 w-fit items-start gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={off}
              onChange={(event) => {
                onOffChange(event.target.checked);
              }}
              className="mt-0.5 size-4 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
            <span>
              Turn motion off (what{' '}
              <code className="font-mono text-sm">{'<MotionPreferenceProvider value="off">'}</code>{' '}
              does)
            </span>
          </label>
          {still && (
            <p role="note" className="max-w-prose text-sm text-fg-muted">
              {off
                ? 'Motion is off, so both columns show the plain behaviour.'
                : 'Your system asks for reduced motion, so both columns show the plain behaviour.'}
            </p>
          )}
        </header>
        <div className="flex flex-col gap-8">
          <div aria-hidden className="hidden gap-x-12 md:grid md:grid-cols-2">
            <span className="font-display text-xl font-heading tracking-tight">Plain</span>
            <span className="font-display text-xl font-heading tracking-tight">Motion</span>
          </div>
          {[ButtonSpecimen, AmountSpecimen, SelectSpecimen, DialogSpecimen, RowsSpecimen].map(
            (specimen) => (
              <Pair key={specimen.name} specimen={specimen} />
            ),
          )}
        </div>
      </main>
    </ThemeScope>
  );
}
