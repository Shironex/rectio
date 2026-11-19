import { fromMinor, toMinor } from '../lib/finance';

export interface LedgerAccount {
  code: string;
  name: string;
  /** The side that increases the account: debit for assets and expenses, credit for the rest. */
  normal: 'debit' | 'credit';
}

/** One posting: a line of a journal entry against one account. */
export interface JournalLine {
  id: string;
  /** Lines of the same entry share it; an entry must balance on its own. */
  entryId: string;
  date: Date;
  /** The document behind the entry, such as INV-0142 or a bank statement line. */
  reference: string;
  description: string;
  accountCode: string;
  /** Major units; one of debit and credit is zero. */
  debit: number;
  credit: number;
}

export interface JournalTotals {
  debit: number;
  credit: number;
  /** Debits minus credits. Zero when the journal balances. */
  difference: number;
  balanced: boolean;
}

export function journalTotals(lines: readonly JournalLine[], currency: string): JournalTotals {
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    debit += toMinor(line.debit, currency);
    credit += toMinor(line.credit, currency);
  }
  return {
    debit: fromMinor(debit, currency),
    credit: fromMinor(credit, currency),
    difference: fromMinor(debit - credit, currency),
    balanced: debit === credit,
  };
}

/** Entries whose debits and credits differ, with the difference (debits minus credits). */
export function unbalancedEntries(
  lines: readonly JournalLine[],
  currency: string,
): { entryId: string; reference: string; difference: number }[] {
  const entries = new Map<string, { reference: string; minor: number }>();
  for (const line of lines) {
    const entry = entries.get(line.entryId) ?? { reference: line.reference, minor: 0 };
    entry.minor += toMinor(line.debit, currency) - toMinor(line.credit, currency);
    entries.set(line.entryId, entry);
  }
  return [...entries]
    .filter(([, entry]) => entry.minor !== 0)
    .map(([entryId, entry]) => ({
      entryId,
      reference: entry.reference,
      difference: fromMinor(entry.minor, currency),
    }));
}

/**
 * The balance after each line, on the account's normal side: a debit raises a debit-normal account
 * and lowers a credit-normal one. Lines are taken in date order (stable for equal dates).
 */
export function runningBalances(
  lines: readonly JournalLine[],
  account: Pick<LedgerAccount, 'normal'>,
  opening: number,
  currency: string,
): { line: JournalLine; balance: number }[] {
  const sign = account.normal === 'debit' ? 1 : -1;
  let balance = toMinor(opening, currency);
  return [...lines]
    .map((line, index) => ({ line, index }))
    .sort((a, b) => a.line.date.getTime() - b.line.date.getTime() || a.index - b.index)
    .map(({ line }) => {
      balance += sign * (toMinor(line.debit, currency) - toMinor(line.credit, currency));
      return { line, balance: fromMinor(balance, currency) };
    });
}
