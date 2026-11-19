import { BankIcon, CheckIcon, LinkBreakIcon, PlusIcon, SealCheckIcon } from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useId, useState, type ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Figures } from '../lib/figures';
import { formatShortDate, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { Segmented } from '../lib/segmented';
import { StateBadge } from '../lib/state-badge';
import {
  lineState,
  matchesLineFilter,
  reconciliationSummary,
  suggestMatches,
  type BookEntry,
  type LineState,
  type MatchSuggestion,
  type ReconciliationFilter,
  type ReconciliationMatch,
  type StatementLine,
  type SuggestionReason,
} from './bank-reconciliation.logic';

export interface BankReconciliationProps {
  /** The bank statement's lines for the account and period. */
  statement: readonly StatementLine[];
  /** The book entries for the same account and period. */
  book: readonly BookEntry[];
  /** Pairs already made. The app holds them; `reconciliationReducer` keeps them one to one. */
  matches: readonly ReconciliationMatch[];
  /** The closing balance the statement prints. */
  statementBalance: number;
  /** The closing balance of the account in the books. */
  bookBalance: number;
  /** ISO 4217 code of the account. */
  currency: string;
  /** BCP 47 locale for figures and dates. Defaults to the runtime locale. */
  locale?: string;
  /** The account as you name it, such as "Business current •• 4821". */
  account?: string;
  /** The period as you name it, such as "March 2026". */
  period?: string;
  title?: string;
  defaultFilter?: ReconciliationFilter;
  /** How many days apart a statement line and an entry of the same amount may be to be suggested. */
  windowDays?: number;
  /** Your own suggestions in place of the block's, such as from a server's matching rules. */
  suggestions?: readonly MatchSuggestion[];
  /** Pairs a statement line with a book entry: accepting a suggestion. */
  onMatch: (bankId: string, bookId: string) => void;
  onUnmatch: (bankId: string) => void;
  /** Shows Mark reconciled, enabled once the difference is zero and every item is matched. */
  onReconcile?: () => void;
  /** Offers Add to books on statement lines with nothing to match, such as a bank fee. */
  onCreateEntry?: (line: StatementLine) => void;
  /** Shown in the empty state under its note, such as a button that imports a statement. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `BANK_RECONCILIATION_MESSAGES`. */
  messages?: Partial<BankReconciliationMessages>;
  className?: string;
}

export interface BankReconciliationMessages extends CommonMessages {
  title: string;
  /** Under the title: the account and period when given, then how far matching has got. */
  description: (scope: string | undefined, matched: number, total: number) => ReactNode;
  statementBalance: string;
  bookBalance: string;
  difference: string;
  statementLines: (count: number) => string;
  bookEntries: (count: number) => string;
  /** Under the Difference figure. */
  reconciledNote: string;
  toMatch: (count: number) => string;
  explained: string;
  notExplained: (amount: ReactNode) => ReactNode;
  filterLabel: string;
  filters: Record<ReconciliationFilter, string>;
  tableCaption: (filter: string, currency: string) => string;
  date: string;
  onStatement: string;
  inBooks: string;
  amount: string;
  action: string;
  /** Why a pair is suggested, after the entry: "same reference", "same amount, 1 day apart". */
  reason: (reason: SuggestionReason, days: number) => string;
  noEntry: string;
  match: string;
  matchLabel: (line: string, entry: string) => string;
  unmatch: string;
  unmatchLabel: (line: string) => string;
  matchAll: (count: number) => string;
  createEntry: string;
  createEntryLabel: (line: string) => string;
  bookOnly: (count: number) => string;
  bookOnlyCaption: (currency: string) => string;
  bookOnlyNote: string;
  descriptionColumn: string;
  noneInFilter: (filter: string) => string;
  noneInFilterNote: string;
  showAll: string;
  reconcile: string;
  /** Beside Mark reconciled: what is left before it can be pressed, or that it can be. */
  readyNote: string;
  /**
   * What is left: statement lines and book entries with no partner, and the difference, which is
   * null when it is already zero.
   */
  /** What is still open, in the words of the filters, then the difference or null when zero. */
  notReadyNote: (
    open: { suggested: number; unmatched: number; bookOnly: number },
    difference: ReactNode,
  ) => ReactNode;
  emptyTitle: string;
  emptyNote: string;
}

const lines = (count: number) => `${String(count)} ${count === 1 ? 'line' : 'lines'}`;
const entries = (count: number) => `${String(count)} ${count === 1 ? 'entry' : 'entries'}`;

export const BANK_RECONCILIATION_MESSAGES: BankReconciliationMessages = {
  ...COMMON_MESSAGES,
  title: 'Bank reconciliation',
  description: (scope, matched, total) =>
    `${scope === undefined ? '' : `${scope}. `}${String(matched)} of ${lines(total)} matched`,
  statementBalance: 'Statement balance',
  bookBalance: 'Book balance',
  difference: 'Difference',
  statementLines: (count) => `${lines(count)} on the statement`,
  bookEntries: (count) => `${entries(count)} in the books`,
  reconciledNote: 'Reconciled',
  toMatch: (count) => `Zero, ${String(count)} still to match`,
  explained: 'Explained by the unmatched items',
  notExplained: (amount) => <>{amount} not explained by the unmatched items</>,
  filterLabel: 'Show',
  filters: { unmatched: 'Unmatched', suggested: 'Suggested', matched: 'Matched', all: 'All' },
  tableCaption: (filter, currency) =>
    `Statement lines, ${filter.toLowerCase()}, with their book entries, amounts in ${currency}`,
  date: 'Date',
  onStatement: 'On the statement',
  inBooks: 'In the books',
  amount: 'Amount',
  action: 'Action',
  reason: (reason, days) =>
    reason === 'reference'
      ? 'Same amount and reference'
      : days === 0
        ? 'Same amount, same day'
        : `Same amount, ${String(days)} ${days === 1 ? 'day' : 'days'} apart`,
  noEntry: 'No entry with this amount',
  match: 'Match',
  matchLabel: (line, entry) => `Match ${line} to ${entry}`,
  unmatch: 'Unmatch',
  unmatchLabel: (line) => `Unmatch ${line}`,
  matchAll: (count) => `Match all ${String(count)}`,
  createEntry: 'Add to books',
  createEntryLabel: (line) => `Add ${line} to the books`,
  bookOnly: (count) => `In the books, not on the statement (${String(count)})`,
  bookOnlyCaption: (currency) => `Book entries with no statement line, amounts in ${currency}`,
  bookOnlyNote: 'Payments still clearing, or entries to correct.',
  descriptionColumn: 'Description',
  noneInFilter: (filter) => `No ${filter.toLowerCase()} lines`,
  noneInFilterNote: 'Every statement line with this state will show here.',
  showAll: 'Show all lines',
  reconcile: 'Mark reconciled',
  readyNote: 'Every item is matched and the balances agree.',
  notReadyNote: ({ suggested, unmatched, bookOnly }, difference) => {
    const parts = [
      suggested > 0 &&
        `${String(suggested)} ${suggested === 1 ? 'suggestion' : 'suggestions'} to accept`,
      unmatched > 0 && `${String(unmatched)} unmatched ${unmatched === 1 ? 'line' : 'lines'}`,
      bookOnly > 0 && `${String(bookOnly)} book-only ${bookOnly === 1 ? 'entry' : 'entries'}`,
    ].filter((part): part is string => typeof part === 'string');
    const left =
      parts.length > 1
        ? `${parts.slice(0, -1).join(', ')} and ${String(parts.at(-1))}`
        : parts.join('');
    if (difference === null) return `Still open: ${left}.`;
    if (left === '') return <>A difference of {difference} is left to explain.</>;
    return (
      <>
        Still open: {left}. Difference {difference}.
      </>
    );
  },
  emptyTitle: 'Nothing to reconcile yet',
  emptyNote: 'Import a statement to match its lines with the entries in your books.',
};

/**
 * Narrower blocks fold the book side, then the date, under the statement line: the book side gets
 * its own column from a 48rem block, the date from 42rem.
 */
/** A folded row action: the row's width, and the full touch height on a touch screen. */
// Compact but touch tall on narrow rows, so a column of row actions never outweighs Match all.
const TOUCH_WIDE = 'pointer-coarse:h-(--rx-button-height-touch) pointer-coarse:px-4';
const DATE_COLUMN = 'hidden @2xl:table-cell';
const BOOK_COLUMN = 'hidden @3xl:table-cell';
const ACTION_COLUMN = 'hidden @xl:table-cell';

/**
 * Statement lines beside the book entries of one account and period: each line with its match, a
 * suggested match (same amount close in date, or the same reference) or nothing yet. Match accepts a
 * suggestion, Unmatch undoes a pair, and Mark reconciled waits until the difference is zero and
 * nothing is left over. The app holds the pairs; the block only proposes and calls back.
 */
export function BankReconciliation({
  statement,
  book,
  matches,
  statementBalance,
  bookBalance,
  currency,
  locale: requestedLocale,
  account,
  period,
  title,
  defaultFilter,
  windowDays = 3,
  suggestions: givenSuggestions,
  onMatch,
  onUnmatch,
  onReconcile,
  onCreateEntry,
  emptyAction,
  messages,
  className,
}: BankReconciliationProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(BANK_RECONCILIATION_MESSAGES, messages);
  const { Button, Money, Rows, Row } = useBlockParts();
  // Opens on the work: suggestions to accept, then lines with nothing to match, then everything.
  const [filter, setFilter] = useState<ReconciliationFilter>(() => {
    if (defaultFilter !== undefined) return defaultFilter;
    const open = suggestMatches(statement, book, matches, currency, { windowDays });
    if ((givenSuggestions ?? open).length > 0) return 'suggested';
    const paired = new Set(matches.map((pair) => pair.bankId));
    return statement.some((line) => !paired.has(line.id)) ? 'unmatched' : 'all';
  });
  const hintId = useId();

  const summary = reconciliationSummary({
    statement,
    book,
    matches,
    statementBalance,
    bookBalance,
    currency,
  });
  const suggestions =
    givenSuggestions ?? suggestMatches(statement, book, matches, currency, { windowDays });
  const bookById = new Map(book.map((entry) => [entry.id, entry]));
  const pairOf = new Map(matches.map((pair) => [pair.bankId, pair.bookId]));
  const suggestionOf = new Map(suggestions.map((s) => [s.bankId, s]));
  const rows = statement
    .toSorted((a, b) => a.date.getTime() - b.date.getTime())
    .map((line) => ({ line, state: lineState(line.id, matches, suggestions) }));
  const counts: Record<ReconciliationFilter, number> = {
    unmatched: 0,
    suggested: 0,
    matched: 0,
    all: rows.length,
  };
  for (const row of rows) counts[row.state] += 1;
  const shown = rows.filter((row) => matchesLineFilter(row.state, filter));
  const pairedBook = new Set([
    ...matches.map((p) => p.bookId),
    ...suggestions.map((s) => s.bookId),
  ]);
  const bookOnly = book
    .filter((entry) => !pairedBook.has(entry.id))
    .toSorted((a, b) => a.date.getTime() - b.date.getTime());
  // A suggested pair is one thing to do, not two: count statement lines plus entries with no partner.
  const left = summary.unmatchedBank.count + bookOnly.length;
  const scope = [account, period].filter((part) => part !== undefined).join(', ');

  const differenceNote = summary.reconciled
    ? m.reconciledNote
    : summary.difference === 0
      ? m.toMatch(left)
      : summary.unexplained === 0
        ? m.explained
        : m.notExplained(
            <Money
              amount={summary.unexplained}
              currency={currency}
              locale={locale}
              signDisplay="exceptZero"
            />,
          );

  const action = (line: StatementLine, state: LineState, wide = false) => {
    if (state === 'matched') {
      // Not full width on a narrow row: undoing a pair is the rare move, so it stays out of the way.
      return (
        <Button
          variant="ghost"
          size="sm"
          aria-label={m.unmatchLabel(line.description)}
          className={cn(wide && 'pointer-coarse:h-(--rx-button-height-touch)')}
          onClick={() => {
            onUnmatch(line.id);
          }}
        >
          <LinkBreakIcon aria-hidden weight="bold" className="size-3.5" />
          {m.unmatch}
        </Button>
      );
    }
    const suggestion = suggestionOf.get(line.id);
    const entry = suggestion === undefined ? undefined : bookById.get(suggestion.bookId);
    if (state === 'unmatched') {
      if (onCreateEntry === undefined) return null;
      return (
        <Button
          variant="secondary"
          size="sm"
          aria-label={m.createEntryLabel(line.description)}
          className={cn(wide && TOUCH_WIDE)}
          onClick={() => {
            onCreateEntry(line);
          }}
        >
          <PlusIcon aria-hidden weight="bold" className="size-3.5" />
          {m.createEntry}
        </Button>
      );
    }
    if (suggestion === undefined || entry === undefined) return null;
    return (
      <Button
        variant="secondary"
        size="sm"
        aria-label={m.matchLabel(line.description, entry.description)}
        // Outlined in the accent: the row's main action, without a column of fills.
        className={cn(
          'border-accent text-accent-strong hover:bg-accent-subtle',
          wide && TOUCH_WIDE,
        )}
        onClick={() => {
          onMatch(line.id, suggestion.bookId);
        }}
      >
        <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        {m.match}
      </Button>
    );
  };

  const bookSide = (line: StatementLine, state: LineState) => {
    const pairedId = pairOf.get(line.id);
    const suggestion = suggestionOf.get(line.id);
    const entry =
      state === 'matched' && pairedId !== undefined
        ? bookById.get(pairedId)
        : state === 'suggested' && suggestion !== undefined
          ? bookById.get(suggestion.bookId)
          : undefined;
    return (
      <span className="flex min-w-0 flex-col items-start gap-1">
        {/* The filter already names the state, so the badge only earns its place under All. */}
        {filter === 'all' && <StateBadge state={state} label={m.states[state]} />}
        {entry === undefined ? (
          <span className="text-sm text-fg-muted">{m.noEntry}</span>
        ) : (
          <span className="flex min-w-0 flex-col text-sm">
            <span className="text-fg">{entry.description}</span>
            <span className="text-fg-muted">
              <span className="numeric">{formatShortDate(entry.date, locale)}</span>
              {entry.reference !== undefined && (
                <span className="numeric">, {entry.reference}</span>
              )}
              {state === 'suggested' && suggestion !== undefined && (
                <>, {m.reason(suggestion.reason, suggestion.days).toLowerCase()}</>
              )}
            </span>
          </span>
        )}
      </span>
    );
  };

  return (
    <BlockPanel
      title={title ?? m.title}
      description={
        statement.length === 0
          ? scope === ''
            ? undefined
            : scope
          : m.description(scope === '' ? undefined : scope, summary.matchedCount, statement.length)
      }
      className={className}
      bodyClassName="gap-4"
    >
      {statement.length === 0 && book.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={BankIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              {
                label: m.statementBalance,
                amount: summary.statementBalance,
                note: m.statementLines(statement.length),
              },
              {
                label: m.bookBalance,
                amount: summary.bookBalance,
                note: m.bookEntries(book.length),
              },
              {
                label: m.difference,
                amount: summary.difference,
                note: differenceNote,
                signed: true,
                // Warning while the unmatched items cover it; negative when they do not.
                ...(summary.difference === 0
                  ? {}
                  : {
                      emphasis:
                        summary.unexplained === 0 ? ('warning' as const) : ('negative' as const),
                    }),
              },
            ]}
          />

          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between">
            <Segmented
              label={m.filterLabel}
              value={filter}
              onValueChange={setFilter}
              options={(['unmatched', 'suggested', 'matched', 'all'] as const).map((value) => ({
                value,
                label: m.filters[value],
                hint: counts[value],
              }))}
            />
            {filter === 'suggested' && suggestions.length > 1 && (
              // Filled: the bulk move outweighs the outlined Match on each row.
              <Button
                size="sm"
                className="pointer-coarse:h-(--rx-button-height-touch) @max-2xl:w-full"
                onClick={() => {
                  for (const s of suggestions) onMatch(s.bankId, s.bookId);
                }}
              >
                <CheckIcon aria-hidden weight="bold" className="size-3.5" />
                {m.matchAll(suggestions.length)}
              </Button>
            )}
          </div>

          <Table>
            <TableCaption className="sr-only">
              {m.tableCaption(m.filters[filter], currency)}
            </TableCaption>
            <TableHeader className="@max-xl:sr-only">
              <TableRow>
                <TableHead className={DATE_COLUMN}>{m.date}</TableHead>
                <TableHead>{m.onStatement}</TableHead>
                <TableHead align="end">{m.amount}</TableHead>
                <TableHead className={BOOK_COLUMN}>{m.inBooks}</TableHead>
                <TableHead align="end" className={cn('w-0', ACTION_COLUMN)}>
                  <span className="sr-only">{m.action}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-auto py-10 text-center text-fg-muted">
                    <span className="flex flex-col items-center gap-3">
                      <span role="status" className="flex flex-col items-center gap-1">
                        <span className="font-medium text-fg">
                          {m.noneInFilter(m.filters[filter])}
                        </span>
                        <span>{m.noneInFilterNote}</span>
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setFilter('all');
                        }}
                      >
                        {m.showAll}
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                <Rows>
                  {shown.map(({ line, state }) => (
                    <Row key={line.id} data-state={state}>
                      <TableCell className={cn(DATE_COLUMN, 'align-top whitespace-nowrap')}>
                        <span className="text-fg-muted numeric">
                          {formatShortDate(line.date, locale)}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="block font-medium">{line.description}</span>
                        <span className="block text-sm text-fg-muted">
                          <span className="numeric @2xl:hidden">
                            {formatShortDate(line.date, locale)}
                            {line.reference !== undefined && ', '}
                          </span>
                          {line.reference !== undefined && (
                            <span className="numeric">{line.reference}</span>
                          )}
                        </span>
                        {/* Narrow: the book side and the action fold under the statement line. */}
                        <span className="mt-2 block @3xl:hidden">
                          {/* The column header is gone at this width, so the side names itself. */}
                          <span className="mb-1 block text-xs font-medium text-fg-muted">
                            {m.inBooks}
                          </span>
                          {bookSide(line, state)}
                        </span>
                        <span className="mt-2 flex empty:hidden @xl:hidden">
                          {action(line, state, true)}
                        </span>
                      </TableCell>
                      <TableCell align="end" className="align-top">
                        <Money
                          amount={line.amount}
                          currency={currency}
                          locale={locale}
                          signDisplay="exceptZero"
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell className={cn(BOOK_COLUMN, 'align-top')}>
                        {bookSide(line, state)}
                      </TableCell>
                      <TableCell align="end" className={cn('w-0 align-top', ACTION_COLUMN)}>
                        {action(line, state)}
                      </TableCell>
                    </Row>
                  ))}
                </Rows>
              )}
            </TableBody>
          </Table>

          {bookOnly.length > 0 && (filter === 'unmatched' || filter === 'all') && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium">{m.bookOnly(bookOnly.length)}</h3>
                <p className="text-sm text-fg-muted">{m.bookOnlyNote}</p>
              </div>
              <Table>
                <TableCaption className="sr-only">{m.bookOnlyCaption(currency)}</TableCaption>
                <TableHeader className="sr-only">
                  <TableRow>
                    <TableHead>{m.date}</TableHead>
                    <TableHead>{m.descriptionColumn}</TableHead>
                    <TableHead align="end">{m.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookOnly.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="w-0 whitespace-nowrap text-fg-muted numeric">
                        {formatShortDate(entry.date, locale)}
                      </TableCell>
                      <TableCell>
                        <span className="block">{entry.description}</span>
                        {entry.reference !== undefined && (
                          <span className="block text-sm text-fg-muted numeric">
                            {entry.reference}
                          </span>
                        )}
                      </TableCell>
                      <TableCell align="end">
                        <Money
                          amount={entry.amount}
                          currency={currency}
                          locale={locale}
                          signDisplay="exceptZero"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {onReconcile !== undefined && (
            <div className="flex flex-col gap-3 border-t border-line pt-4 @xl:flex-row @xl:items-center @xl:justify-between">
              <p id={hintId} className="flex items-start gap-2 text-sm text-fg-muted">
                {summary.reconciled && (
                  <SealCheckIcon
                    aria-hidden
                    weight="bold"
                    className="mt-0.5 size-4 shrink-0 text-positive-strong"
                  />
                )}
                <span>
                  {summary.reconciled
                    ? m.readyNote
                    : m.notReadyNote(
                        {
                          suggested: counts.suggested,
                          unmatched: counts.unmatched,
                          bookOnly: bookOnly.length,
                        },
                        summary.difference === 0 ? null : (
                          <Money
                            amount={summary.difference}
                            currency={currency}
                            locale={locale}
                            signDisplay="exceptZero"
                            className="font-medium text-fg"
                          />
                        ),
                      )}
                </span>
              </p>
              <Button
                disabled={!summary.reconciled}
                focusableWhenDisabled
                aria-describedby={hintId}
                className="w-full @xl:w-auto"
                onClick={onReconcile}
              >
                <SealCheckIcon aria-hidden weight="bold" className="size-4" />
                {m.reconcile}
              </Button>
            </div>
          )}
        </>
      )}
    </BlockPanel>
  );
}
