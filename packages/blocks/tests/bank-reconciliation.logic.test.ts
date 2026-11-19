import { describe, expect, it } from 'vitest';

import {
  reconciliationReducer,
  reconciliationSummary,
  referencesMatch,
  suggestMatches,
  lineState,
  type BookEntry,
  type StatementLine,
} from '../src/index';

const d = (m: number, day: number) => new Date(2026, m - 1, day);

const statement: StatementLine[] = [
  {
    id: 's1',
    date: d(3, 2),
    description: 'Kestrel Analytics',
    reference: 'INV-2026-0121',
    amount: 6_240,
  },
  { id: 's2', date: d(3, 4), description: 'Card fee', amount: -12.5 },
  { id: 's3', date: d(3, 5), description: 'Payroll', amount: -18_400 },
  {
    id: 's4',
    date: d(3, 20),
    description: 'Atelier Lune',
    reference: 'inv 2026 0127',
    amount: 3_915,
  },
];

const book: BookEntry[] = [
  {
    id: 'b1',
    date: d(3, 1),
    description: 'Receipt Kestrel',
    reference: 'INV-2026-0121',
    amount: 6_240,
  },
  { id: 'b2', date: d(3, 4), description: 'Payroll March', amount: -18_400 },
  {
    id: 'b3',
    date: d(3, 9),
    description: 'Receipt Atelier Lune',
    reference: 'INV-2026-0127',
    amount: 3_915,
  },
  { id: 'b4', date: d(3, 28), description: 'Cheque 0042', amount: -760 },
];

describe('bank reconciliation suggestions', () => {
  it('reads references without case, spaces or punctuation', () => {
    expect(
      referencesMatch(
        { reference: 'inv 2026 0127', description: '' },
        { reference: 'INV-2026-0127', description: '' },
      ),
    ).toBe(true);
    expect(referencesMatch({ reference: '12', description: '' }, { description: 'order 12' })).toBe(
      false,
    );
  });

  it('pairs the same amount within the date window, and by reference across it', () => {
    const suggestions = suggestMatches(statement, book, [], 'EUR');
    expect(suggestions).toEqual([
      { bankId: 's1', bookId: 'b1', reason: 'reference', days: 1 },
      { bankId: 's3', bookId: 'b2', reason: 'amount-date', days: 1 },
      { bankId: 's4', bookId: 'b3', reason: 'reference', days: 11 },
    ]);
  });

  it('leaves out an amount match outside the window without a reference', () => {
    const far: BookEntry[] = [{ id: 'x', date: d(3, 15), description: 'Payroll', amount: -18_400 }];
    expect(suggestMatches(statement, far, [], 'EUR')).toEqual([]);
    expect(suggestMatches(statement, far, [], 'EUR', { windowDays: 10 })).toHaveLength(1);
  });

  it('compares amounts in minor units and proposes each entry once', () => {
    const lines: StatementLine[] = [
      { id: 'a', date: d(3, 1), description: 'A', amount: 0.1 + 0.2 },
      { id: 'b', date: d(3, 1), description: 'B', amount: 0.3 },
    ];
    const entries: BookEntry[] = [{ id: 'e', date: d(3, 1), description: 'E', amount: 0.3 }];
    expect(suggestMatches(lines, entries, [], 'EUR')).toEqual([
      { bankId: 'a', bookId: 'e', reason: 'amount-date', days: 0 },
    ]);
  });

  it('skips lines and entries already matched', () => {
    const suggestions = suggestMatches(statement, book, [{ bankId: 's1', bookId: 'b1' }], 'EUR');
    expect(suggestions.map((s) => s.bankId)).toEqual(['s3', 's4']);
    expect(lineState('s1', [{ bankId: 's1', bookId: 'b1' }], suggestions)).toBe('matched');
    expect(lineState('s3', [], suggestions)).toBe('suggested');
    expect(lineState('s2', [], suggestions)).toBe('unmatched');
  });
});

describe('bank reconciliation summary', () => {
  it('splits the difference into unmatched items and what they leave unexplained', () => {
    const summary = reconciliationSummary({
      statement,
      book,
      matches: [{ bankId: 's1', bookId: 'b1' }],
      statementBalance: 41_230.4,
      bookBalance: 42_002.9,
      currency: 'EUR',
    });
    expect(summary.difference).toBe(-772.5);
    expect(summary.unmatchedBank).toEqual({ count: 3, total: -14_497.5 });
    expect(summary.unmatchedBook).toEqual({ count: 3, total: -15_245 });
    expect(summary.unexplained).toBe(-1_520);
    expect(summary.matchedCount).toBe(1);
    expect(summary.reconciled).toBe(false);
  });

  it('is reconciled only with a zero difference and nothing left over', () => {
    const pair = [{ bankId: 'a', bookId: 'b' }];
    const one = { id: 'a', date: d(3, 1), description: 'A', amount: 10 };
    const base = {
      statement: [one],
      book: [{ ...one, id: 'b' }],
      statementBalance: 10,
      bookBalance: 10,
      currency: 'EUR',
    };
    expect(reconciliationSummary({ ...base, matches: pair }).reconciled).toBe(true);
    expect(reconciliationSummary({ ...base, matches: [] }).reconciled).toBe(false);
    expect(reconciliationSummary({ ...base, matches: pair, bookBalance: 9.99 }).reconciled).toBe(
      false,
    );
  });

  it('ignores pairs whose line or entry is gone', () => {
    const summary = reconciliationSummary({
      statement: [],
      book: [],
      matches: [{ bankId: 'gone', bookId: 'too' }],
      statementBalance: 0,
      bookBalance: 0,
      currency: 'EUR',
    });
    expect(summary.matchedCount).toBe(0);
    expect(summary.reconciled).toBe(true);
  });
});

describe('reconciliation reducer', () => {
  it('matches one to one, replacing an old pair on either side', () => {
    let pairs = reconciliationReducer([], { type: 'match', bankId: 's1', bookId: 'b1' });
    pairs = reconciliationReducer(pairs, { type: 'match', bankId: 's2', bookId: 'b1' });
    expect(pairs).toEqual([{ bankId: 's2', bookId: 'b1' }]);
  });

  it('unmatches, and returns the same list when nothing changes', () => {
    const pairs = [{ bankId: 's1', bookId: 'b1' }];
    expect(reconciliationReducer(pairs, { type: 'match', bankId: 's1', bookId: 'b1' })).toBe(pairs);
    expect(reconciliationReducer(pairs, { type: 'unmatch', bankId: 'nope' })).toBe(pairs);
    expect(reconciliationReducer(pairs, { type: 'unmatch', bankId: 's1' })).toEqual([]);
  });
});
