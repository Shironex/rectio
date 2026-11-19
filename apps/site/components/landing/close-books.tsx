'use client';

import { CheckIcon } from '@phosphor-icons/react';
import { Money } from '@rectio/motion';
import { Badge, cn } from '@rectio/ui';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useReducedMotion } from './motion-tokens';
import { Eyebrow } from './section';

const CURRENCY = 'EUR';
const LOCALE = 'en-IE';

/** The bank feed and the receipts it should match: report 2041, the same trip as the bench. */
const LINES = [
  {
    id: 'l1',
    date: '3 Mar',
    payee: 'LUFTHANSA 2204417',
    merchant: 'Lufthansa',
    note: 'FRA to WAW, return',
    amount: -412.8,
  },
  {
    id: 'l2',
    date: '6 Mar',
    payee: 'HOTEL BRISTOL WAW',
    merchant: 'Hotel Bristol',
    note: 'Two nights',
    amount: -538,
  },
  {
    id: 'l3',
    date: '6 Mar',
    payee: 'ATELIER REST. SP',
    merchant: 'Atelier Restaurant',
    note: 'Client, 3 guests',
    amount: -214.5,
  },
  {
    id: 'l4',
    date: '9 Mar',
    payee: 'HOTEL BRISTOL REF',
    merchant: 'Hotel Bristol',
    note: 'Refund, late checkout',
    amount: 61,
  },
] as const;

const TOTAL = LINES.reduce((sum, line) => sum + line.amount, 0);

/** One step per matched line, then the total, then the stamp. */
const STEPS = [
  {
    title: 'Read the feed',
    text: 'Four card lines arrive from the bank, none of them matched yet.',
  },
  {
    title: 'Match each line',
    text: 'Every line finds its receipt by amount and date, and says so in words.',
  },
  {
    title: 'Settle the total',
    text: 'The reconciled figure counts to its exact value, with a true minus sign.',
  },
  { title: 'Reconcile', text: 'Nothing left over: the period closes.' },
] as const;
const MATCH_FROM = 1;
const TOTAL_STEP = MATCH_FROM + LINES.length;
const LAST = TOTAL_STEP + 1;

/** Which caption a scroll step belongs to. */
const captionOf = (step: number) =>
  step < MATCH_FROM ? 0 : step < TOTAL_STEP ? 1 : step === TOTAL_STEP ? 2 : 3;

type Corner = 'tl' | 'tr' | 'bl' | 'br';
const CORNERS: Corner[] = ['tl', 'tr', 'bl', 'br'];

/**
 * The "close the books" sequence. A tall section holds a sticky panel; behind it, one band per
 * step fills the stretch the panel stays pinned for. The step is the band under the middle of the
 * viewport (an IntersectionObserver on a line there, no scroll listener), so a jump straight to
 * any point lands on the right step. At each match, detection brackets measured from the real cells travel from
 * the bank line to its receipt, then the line resolves to Matched. Then the total settles and the
 * stamp lands. Reduced motion shows the closed books at once, in a section of normal height.
 */
export function CloseBooks() {
  const [scrolled, setStep] = useState(0);
  const still = useReducedMotion();
  const step = still ? LAST : scrolled;
  const markers = useRef<(HTMLDivElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const corners = useRef<Partial<Record<Corner, HTMLSpanElement | null>>>({});
  const bank = useRef<(HTMLTableRowElement | null)[]>([]);
  const receipts = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (still) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = markers.current.indexOf(entry.target as HTMLDivElement);
          if (entry.isIntersecting) {
            setStep(index);
            continue;
          }
          // Leaving the ends: before the first band is step 0, past the last is the last step.
          const middle = innerHeight / 2;
          if (index === 0 && entry.boundingClientRect.top >= middle) setStep(0);
          if (index === LAST && entry.boundingClientRect.bottom <= middle) setStep(LAST);
        }
      },
      // The root is the line across the middle of the viewport.
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const marker of markers.current) if (marker !== null) observer.observe(marker);
    return () => {
      observer.disconnect();
    };
  }, [still]);

  // Brackets: measured from the cells on screen, moved with transforms only.
  useLayoutEffect(() => {
    const host = stage.current;
    const match = step - MATCH_FROM;
    const place = (cell: Element | null | undefined, animate: boolean) => {
      if (host === null || cell == null) return;
      const box = host.getBoundingClientRect();
      const rect = cell.getBoundingClientRect();
      const x = rect.left - box.left;
      const y = rect.top - box.top;
      const spots: Record<Corner, [number, number]> = {
        tl: [x, y],
        tr: [x + rect.width, y],
        bl: [x, y + rect.height],
        br: [x + rect.width, y + rect.height],
      };
      for (const c of CORNERS) {
        const el = corners.current[c];
        if (el == null) continue;
        const [cx, cy] = spots[c];
        const ox = c === 'tr' || c === 'br' ? -el.offsetWidth : 0;
        const oy = c === 'bl' || c === 'br' ? -el.offsetHeight : 0;
        if (!animate) el.style.transition = 'none';
        el.style.translate = `${String(cx + ox)}px ${String(cy + oy)}px`;
        if (!animate) {
          el.getBoundingClientRect();
          el.style.transition = '';
        }
      }
    };
    if (match < 0 || match >= LINES.length) return;
    // From the bank line to its receipt: the snap is the travel between the two.
    place(bank.current[match], false);
    const frame = requestAnimationFrame(() => {
      place(receipts.current[match], true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [step]);

  const matched = Math.max(0, Math.min(LINES.length, step - MATCH_FROM + 1));
  const settled = step >= TOTAL_STEP;
  const left = LINES.slice(matched).reduce((sum, line) => sum + line.amount, 0);
  const caption = captionOf(step);
  const scanning = !still && step >= MATCH_FROM && step < TOTAL_STEP;

  return (
    <section
      aria-labelledby="close-books-title"
      className="site-runway relative"
      // The runway (site.css) is shorter on phones; the panel inside stays pinned along it.
      style={still ? undefined : { height: 'var(--site-runway)' }}
    >
      <a
        href="#kit"
        className="pointer-events-none absolute start-4 top-4 z-20 rounded-control opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100 bg-accent px-4 py-2 text-base font-medium text-accent-contrast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:start-8"
      >
        Skip the sequence
      </a>
      {!still &&
        Array.from({ length: LAST + 1 }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              markers.current[i] = el;
            }}
            aria-hidden
            className="absolute inset-x-0"
            style={{
              top: `calc(50vh + ${String(i)} * var(--site-band))`,
              height: 'var(--site-band)',
            }}
          />
        ))}
      <div
        className={cn(
          'flex flex-col justify-center',
          still ? 'py-16' : 'sticky top-0 min-h-dvh pt-16 pb-4 sm:py-8',
        )}
      >
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:gap-6 sm:px-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-3 sm:gap-5 lg:col-span-4 lg:justify-center">
            <span className="hidden sm:block">
              <Eyebrow>Month end</Eyebrow>
            </span>
            <h2 id="close-books-title" className="site-headline text-fg">
              Close the books while you scroll.
            </h2>
            <ol className="hidden flex-col gap-5 lg:flex">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  aria-current={i === caption ? 'step' : undefined}
                  className="flex gap-3"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-base ease-standard',
                      i < caption
                        ? 'border-positive-strong bg-positive-strong text-positive-contrast'
                        : i === caption
                          ? 'border-accent-strong bg-accent'
                          : 'border-line-strong',
                    )}
                  >
                    {i < caption && <CheckIcon weight="bold" className="size-2.5" />}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span
                      className={cn(
                        'text-base font-strong transition-colors duration-base ease-standard',
                        i === caption ? 'text-fg' : 'text-fg-muted',
                      )}
                    >
                      {s.title}
                    </span>
                    <span
                      className={cn('text-base', i === caption ? 'text-fg-muted' : 'text-fg-muted')}
                    >
                      {s.text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-fg-muted sm:text-base lg:hidden" aria-live="polite">
              <span aria-hidden className="me-2 inline-flex gap-1 align-middle">
                {STEPS.map((s, i) => (
                  <span
                    key={s.title}
                    className={cn(
                      'size-1.5 rounded-full transition-colors duration-base ease-standard',
                      i <= caption ? 'bg-accent' : 'bg-line-strong',
                    )}
                  />
                ))}
              </span>
              <span className="sr-only">
                Step {caption + 1} of {STEPS.length}:
              </span>
              <span className="font-strong text-fg">{STEPS[caption].title}.</span>{' '}
              {STEPS[caption].text}
            </p>
          </div>

          <div ref={stage} className="relative min-w-0 lg:col-span-8">
            <div className="grid overflow-hidden rounded-panel border border-line bg-surface shadow-overlay md:grid-cols-12">
              <div className="min-w-0 border-line md:col-span-7 md:border-e">
                <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 md:px-5 md:py-4">
                  <p className="text-sm font-strong text-fg">Bank feed, card 4417</p>
                  <p className="text-sm text-fg-muted">March 2026</p>
                </div>
                <table className="w-full text-sm md:text-base">
                  <caption className="sr-only">Card lines and whether each is matched</caption>
                  <tbody>
                    {LINES.map((line, i) => {
                      const done = i < matched;
                      return (
                        <tr
                          key={line.id}
                          ref={(el) => {
                            bank.current[i] = el;
                          }}
                          className="border-b border-line last:border-b-0"
                        >
                          <td className="py-2.5 ps-4 pe-2 md:py-4 md:ps-5 align-top whitespace-nowrap text-fg-muted">
                            {line.date}
                          </td>
                          <td className="min-w-0 px-2 py-2.5 align-top md:py-4 font-mono text-xs text-fg sm:text-sm">
                            {line.payee}
                          </td>
                          <td className="px-2 py-2.5 text-end align-top md:py-4">
                            <Money
                              amount={line.amount}
                              currency={CURRENCY}
                              locale={LOCALE}
                              tone={line.amount < 0 ? 'neutral' : 'auto'}
                            />
                          </td>
                          <td className="py-2.5 ps-2 pe-4 text-end align-top md:py-4 md:pe-5">
                            <Badge tone={done ? 'positive' : 'neutral'}>
                              {done ? 'Matched' : 'Unmatched'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="min-w-0 border-t border-line bg-surface-sunken md:col-span-5 md:border-t-0">
                <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 md:px-5 md:py-4">
                  <p className="text-sm font-strong text-fg">Receipts, report 2041</p>
                  <p className="text-sm text-fg-muted">
                    {matched} of {LINES.length}
                  </p>
                </div>
                <ul className="flex flex-col">
                  {LINES.map((line, i) => {
                    const done = i < matched;
                    return (
                      <li
                        key={line.id}
                        ref={(el) => {
                          receipts.current[i] = el;
                        }}
                        className="flex items-start justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0 md:px-5 md:py-3 md:text-base"
                      >
                        <span className="flex min-w-0 items-start gap-2">
                          <CheckIcon
                            aria-hidden
                            weight="bold"
                            className={cn(
                              'mt-0.5 size-3.5 shrink-0 text-positive-strong transition-opacity duration-base ease-standard',
                              done ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="text-fg">{line.merchant}</span>
                            <span className="hidden text-fg-muted sm:block">{line.note}</span>
                          </span>
                        </span>
                        <Money
                          amount={line.amount}
                          currency={CURRENCY}
                          locale={LOCALE}
                          tone={line.amount < 0 ? 'neutral' : 'auto'}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="relative flex items-end justify-between gap-4 border-t border-line-strong px-4 py-4 md:col-span-12 md:px-5 md:py-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-fg-muted">Reconciled, March</p>
                  <Money
                    amount={settled ? TOTAL : 0}
                    currency={CURRENCY}
                    locale={LOCALE}
                    className="text-2xl font-strong text-fg md:text-4xl"
                  />
                  <p className="text-sm text-fg-muted">
                    Left to match{' '}
                    <Money
                      amount={left}
                      currency={CURRENCY}
                      locale={LOCALE}
                      className="font-strong text-fg"
                    />
                  </p>
                </div>
                {step >= LAST && (
                  <span
                    aria-hidden
                    className="site-stamp pointer-events-none me-1 mb-1 inline-flex shrink-0 items-center gap-2 rounded-control border-2 border-accent-strong bg-accent-subtle px-3 py-1 text-base font-strong tracking-caps text-accent-strong uppercase md:me-4 md:px-4 md:py-1.5 md:text-xl"
                  >
                    <CheckIcon weight="bold" className="size-4 md:size-5" />
                    Reconciled
                  </span>
                )}
                <p role="status" className="sr-only">
                  {step >= LAST ? 'Reconciled: March closes with nothing left to match.' : ''}
                </p>
              </div>
            </div>

            {scanning &&
              CORNERS.map((c) => (
                <span
                  key={c}
                  aria-hidden
                  data-c={c}
                  ref={(el) => {
                    corners.current[c] = el;
                  }}
                  className="site-corner"
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
