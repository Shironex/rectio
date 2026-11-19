import { daysBetween, fromMinor, sumMoney, toMinor } from '../lib/finance';

/** One line of the bank statement. Money in is positive, money out negative, in major units. */
export interface StatementLine {
  id: string;
  date: Date;
  description: string;
  /** The payment reference the bank printed, such as an invoice number. */
  reference?: string;
  amount: number;
}

/** One entry in the books for the same account. Same sign convention as the statement. */
export interface BookEntry {
  id: string;
  date: Date;
  description: string;
  reference?: string;
  amount: number;
}

/** A statement line paired with the book entry it is. Each side is matched at most once. */
export interface ReconciliationMatch {
  bankId: string;
  bookId: string;
}

/** Why a pair is suggested: the same amount close in date, or the same amount and reference. */
export type SuggestionReason = 'reference' | 'amount-date';

export interface MatchSuggestion extends ReconciliationMatch {
  reason: SuggestionReason;
  /** Calendar days between the two dates, always zero or more. */
  days: number;
}

/** Where a statement line stands: paired, with a proposed pair, or with nothing to pair it with. */
export type LineState = 'matched' | 'suggested' | 'unmatched';

export type ReconciliationFilter = 'unmatched' | 'suggested' | 'matched' | 'all';

const normalize = (text: string | undefined) =>
  (text ?? '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** References shorter than this never count as a match: "12" is in too many descriptions. */
const MIN_REFERENCE_LENGTH = 4;

/**
 * True when either side's reference appears in the other side's reference or description,
 * ignoring case, spaces and punctuation: "INV-2026-0142" matches "inv 2026 0142".
 */
export function referencesMatch(
  a: Pick<StatementLine, 'reference' | 'description'>,
  b: Pick<BookEntry, 'reference' | 'description'>,
): boolean {
  const check = (reference: string | undefined, other: typeof a) => {
    const ref = normalize(reference);
    if (ref.length < MIN_REFERENCE_LENGTH) return false;
    return normalize(other.reference).includes(ref) || normalize(other.description).includes(ref);
  };
  return check(a.reference, b) || check(b.reference, a);
}

/**
 * Proposes a book entry for every statement line that has none yet. A candidate has exactly the
 * same amount, to the minor unit, and either a matching reference (any date) or a date within
 * `windowDays`. A matching reference wins over a closer date; among equals the closer date wins,
 * then the earlier entry. Each book entry is proposed once, so suggestions never collide.
 */
export function suggestMatches(
  statement: readonly StatementLine[],
  book: readonly BookEntry[],
  matches: readonly ReconciliationMatch[],
  currency: string,
  { windowDays = 3 }: { windowDays?: number } = {},
): MatchSuggestion[] {
  const matchedBank = new Set(matches.map((m) => m.bankId));
  const taken = new Set(matches.map((m) => m.bookId));
  const open = book.filter((entry) => !taken.has(entry.id));
  const lines = statement
    .filter((line) => !matchedBank.has(line.id))
    .toSorted((a, b) => a.date.getTime() - b.date.getTime());
  const suggestions: MatchSuggestion[] = [];
  for (const line of lines) {
    const minor = toMinor(line.amount, currency);
    let best: MatchSuggestion | undefined;
    let bestDate = Infinity;
    for (const entry of open) {
      if (taken.has(entry.id) || toMinor(entry.amount, currency) !== minor) continue;
      const days = Math.abs(daysBetween(line.date, entry.date));
      const reason: SuggestionReason | null = referencesMatch(line, entry)
        ? 'reference'
        : days <= windowDays
          ? 'amount-date'
          : null;
      if (reason === null) continue;
      const better =
        best === undefined ||
        (reason === 'reference' && best.reason !== 'reference') ||
        (reason === best.reason &&
          (days < best.days || (days === best.days && entry.date.getTime() < bestDate)));
      if (better) {
        best = { bankId: line.id, bookId: entry.id, reason, days };
        bestDate = entry.date.getTime();
      }
    }
    if (best !== undefined) {
      taken.add(best.bookId);
      suggestions.push(best);
    }
  }
  return suggestions;
}

export function lineState(
  bankId: string,
  matches: readonly ReconciliationMatch[],
  suggestions: readonly MatchSuggestion[],
): LineState {
  if (matches.some((m) => m.bankId === bankId)) return 'matched';
  if (suggestions.some((s) => s.bankId === bankId)) return 'suggested';
  return 'unmatched';
}

export function matchesLineFilter(state: LineState, filter: ReconciliationFilter): boolean {
  return filter === 'all' || state === filter;
}

export interface SideTotal {
  count: number;
  total: number;
}

export interface ReconciliationSummary {
  statementBalance: number;
  bookBalance: number;
  /** Statement balance less book balance. */
  difference: number;
  /** Statement lines with no book entry yet. */
  unmatchedBank: SideTotal;
  /** Book entries with no statement line yet. */
  unmatchedBook: SideTotal;
  /**
   * What the unmatched items on both sides do not account for: the difference less the unmatched
   * statement lines plus the unmatched book entries. Not zero means a figure is wrong somewhere.
   */
  unexplained: number;
  matchedCount: number;
  /** The difference is zero and nothing is left unmatched on either side. */
  reconciled: boolean;
}

/** The reconciliation's figures, every sum exact to the minor unit. */
export function reconciliationSummary({
  statement,
  book,
  matches,
  statementBalance,
  bookBalance,
  currency,
}: {
  statement: readonly StatementLine[];
  book: readonly BookEntry[];
  matches: readonly ReconciliationMatch[];
  statementBalance: number;
  bookBalance: number;
  currency: string;
}): ReconciliationSummary {
  const bankIds = new Set(statement.map((line) => line.id));
  const bookIds = new Set(book.map((entry) => entry.id));
  // A pair whose line or entry is gone no longer counts.
  const live = matches.filter((m) => bankIds.has(m.bankId) && bookIds.has(m.bookId));
  const matchedBank = new Set(live.map((m) => m.bankId));
  const matchedBook = new Set(live.map((m) => m.bookId));
  const bankLeft = statement.filter((line) => !matchedBank.has(line.id));
  const bookLeft = book.filter((entry) => !matchedBook.has(entry.id));
  const unmatchedBank = {
    count: bankLeft.length,
    total: sumMoney(
      bankLeft.map((l) => l.amount),
      currency,
    ),
  };
  const unmatchedBook = {
    count: bookLeft.length,
    total: sumMoney(
      bookLeft.map((e) => e.amount),
      currency,
    ),
  };
  const differenceMinor = toMinor(statementBalance, currency) - toMinor(bookBalance, currency);
  const unexplainedMinor =
    differenceMinor -
    toMinor(unmatchedBank.total, currency) +
    toMinor(unmatchedBook.total, currency);
  return {
    statementBalance: fromMinor(toMinor(statementBalance, currency), currency),
    bookBalance: fromMinor(toMinor(bookBalance, currency), currency),
    difference: fromMinor(differenceMinor, currency),
    unmatchedBank,
    unmatchedBook,
    unexplained: fromMinor(unexplainedMinor, currency),
    matchedCount: live.length,
    reconciled: differenceMinor === 0 && unmatchedBank.count === 0 && unmatchedBook.count === 0,
  };
}

export type ReconciliationCommand =
  { type: 'match'; bankId: string; bookId: string } | { type: 'unmatch'; bankId: string };

/**
 * Applies a match or an unmatch to the list of pairs, keeping it one to one: matching a line or an
 * entry that is already paired replaces its old pair. Returns the same array when nothing changed.
 */
export function reconciliationReducer(
  matches: readonly ReconciliationMatch[],
  command: ReconciliationCommand,
): readonly ReconciliationMatch[] {
  if (command.type === 'unmatch') {
    const next = matches.filter((m) => m.bankId !== command.bankId);
    return next.length === matches.length ? matches : next;
  }
  if (matches.some((m) => m.bankId === command.bankId && m.bookId === command.bookId)) {
    return matches;
  }
  return [
    ...matches.filter((m) => m.bankId !== command.bankId && m.bookId !== command.bookId),
    { bankId: command.bankId, bookId: command.bookId },
  ];
}
