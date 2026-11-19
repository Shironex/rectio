import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { ChoiceSelect } from '../lib/choice-select';
import { EmptyNote } from '../lib/empty-note';
import { formatShortDate, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import {
  journalTotals,
  runningBalances,
  unbalancedEntries,
  type JournalLine,
  type LedgerAccount,
} from './ledger.logic';

export interface LedgerProps {
  accounts: readonly LedgerAccount[];
  lines: readonly JournalLine[];
  currency: string;
  locale?: string;
  /** Balance of each account before the first line, by account code. */
  openingBalances?: Readonly<Record<string, number>>;
  /** Start on one account's ledger instead of the whole journal. */
  defaultAccount?: string;
  title?: string;
  /** The period the lines cover, shown under the title, such as "March 2026". */
  period?: string;
  /** Shown in the empty state under its note, such as a button that adds the first entry. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `LEDGER_MESSAGES`. */
  messages?: Partial<LedgerMessages>;
  className?: string;
}

export interface LedgerMessages extends CommonMessages {
  title: string;
  /** Under the title for the whole journal: the period and the entry count. */
  journalDescription: (period: string | undefined, entries: number) => string;
  /** Under an account's title: "Account ledger, March 2026, debit balance". */
  accountDescription: (period: string | undefined, normal: 'debit' | 'credit') => string;
  accountLabel: string;
  allAccounts: string;
  emptyTitle: string;
  emptyNote: string;
  /** The table's accessible caption; `account` is the account's name, absent for the journal. */
  tableCaption: (account: string | undefined, currency: string) => string;
  date: string;
  reference: string;
  entryAndAccount: string;
  description: string;
  debit: string;
  credit: string;
  amount: string;
  balance: string;
  openingBalance: string;
  noPostings: string;
  doesNotBalance: string;
  /** The short side marks beside an amount on a narrow block (Dr, Cr) and their full words. */
  debitShort: string;
  creditShort: string;
  debitWord: string;
  creditWord: string;
  totals: string;
  closingBalance: string;
  balanced: string;
  balancedNote: string;
  outOfBalance: string;
  /** "Debits exceed credits by €40, in JE-12."; `references` is empty when no entry is named. */
  exceeds: (
    excess: 'debits' | 'credits',
    difference: ReactNode,
    references: readonly string[],
  ) => ReactNode;
}

export const LEDGER_MESSAGES: LedgerMessages = {
  ...COMMON_MESSAGES,
  title: 'General journal',
  journalDescription: (period, entries) =>
    [period, `${String(entries)} entries`].filter(Boolean).join(', '),
  accountDescription: (period, normal) =>
    `Account ledger${period === undefined ? '' : `, ${period}`}, ${normal} balance`,
  accountLabel: 'Account',
  allAccounts: 'All accounts',
  emptyTitle: 'No entries in the period',
  emptyNote: 'Journal entries appear here as they are posted.',
  tableCaption: (account, currency) =>
    `${account === undefined ? 'Journal lines' : `Ledger of ${account}`}, amounts in ${currency}`,
  date: 'Date',
  reference: 'Reference',
  entryAndAccount: 'Entry and account',
  description: 'Description',
  debit: 'Debit',
  credit: 'Credit',
  amount: 'Amount',
  balance: 'Balance',
  openingBalance: 'Opening balance',
  noPostings: '{m.noPostings}',
  doesNotBalance: 'Does not balance',
  debitShort: 'Dr',
  creditShort: 'Cr',
  debitWord: 'debit',
  creditWord: 'credit',
  totals: 'Totals',
  closingBalance: 'Closing balance',
  balanced: 'Balanced',
  balancedNote: 'Debits equal credits for every entry.',
  outOfBalance: 'Out of balance',
  exceeds: (excess, difference, references) => (
    <>
      {excess === 'debits' ? 'Debits exceed credits' : 'Credits exceed debits'} by {difference}
      {references.length > 0 && `, in ${references.join(', ')}`}.
    </>
  ),
};

const ALL = 'all';

/**
 * The general journal: every entry with its debit and credit lines, a check that debits equal
 * credits, and per account a ledger with its running balance from the opening balance.
 */
export function Ledger({
  accounts,
  lines,
  currency,
  locale: requestedLocale,
  openingBalances = {},
  defaultAccount = ALL,
  title,
  period,
  emptyAction,
  messages,
  className,
}: LedgerProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(LEDGER_MESSAGES, messages);
  const { Money } = useBlockParts();
  const [accountCode, setAccountCode] = useState(defaultAccount);
  const account = accounts.find((a) => a.code === accountCode);
  const nameOf = (code: string) => accounts.find((a) => a.code === code)?.name ?? code;
  const shown = account === undefined ? lines : lines.filter((l) => l.accountCode === account.code);
  const totals = journalTotals(shown, currency);
  const broken = unbalancedEntries(lines, currency);
  const opening = account === undefined ? 0 : (openingBalances[account.code] ?? 0);
  const balances = account === undefined ? [] : runningBalances(shown, account, opening, currency);
  const closing = balances.at(-1)?.balance ?? opening;
  // Journal order: by date, entries kept together.
  const ordered =
    account === undefined
      ? [...lines].sort((a, b) => a.date.getTime() - b.date.getTime())
      : balances.map((b) => b.line);

  const money = (amount: number, className?: string) =>
    amount === 0 ? null : (
      <Money amount={amount} currency={currency} locale={locale} className={className} />
    );
  const columns = account === undefined ? 6 : 7;

  return (
    <BlockPanel
      title={account === undefined ? (title ?? m.title) : `${account.code} ${account.name}`}
      description={
        account === undefined
          ? m.journalDescription(period, new Set(lines.map((l) => l.entryId)).size)
          : m.accountDescription(period, account.normal)
      }
      actions={
        <ChoiceSelect
          label={m.accountLabel}
          value={accountCode}
          onValueChange={setAccountCode}
          choices={[
            { value: ALL, label: m.allAccounts },
            ...accounts.map((a) => ({ value: a.code, label: `${a.code} ${a.name}` })),
          ]}
          className="min-w-56"
        />
      }
      className={className}
      bodyClassName="gap-4"
    >
      {account === undefined && ordered.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <Table>
          <TableCaption className="sr-only">{m.tableCaption(account?.name, currency)}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-20 @xl:table-cell">{m.date}</TableHead>
              <TableHead className="hidden w-28 @2xl:table-cell">{m.reference}</TableHead>
              <TableHead>{account === undefined ? m.entryAndAccount : m.description}</TableHead>
              <TableHead align="end" className="hidden @xl:table-cell">
                {m.debit}
              </TableHead>
              <TableHead align="end" className="hidden @xl:table-cell">
                {m.credit}
              </TableHead>
              {/* Narrow: one amount column, each figure marked Dr or Cr. */}
              <TableHead align="end" className="@xl:hidden">
                {m.amount}
              </TableHead>
              {account !== undefined && <TableHead align="end">{m.balance}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {account !== undefined && (
              <TableRow>
                <TableCell className="hidden @xl:table-cell" />
                <TableCell className="hidden @2xl:table-cell" />
                <TableCell className="text-fg-muted">{m.openingBalance}</TableCell>
                <TableCell className="hidden @xl:table-cell" />
                <TableCell className="hidden @xl:table-cell" />
                <TableCell className="@xl:hidden" />
                <TableCell align="end">
                  <Money amount={opening} currency={currency} locale={locale} tone="auto" />
                </TableCell>
              </TableRow>
            )}
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns} className="h-auto py-10 text-center text-fg-muted">
                  No postings to this account in the period.
                </TableCell>
              </TableRow>
            )}
            {ordered.map((line, index) => {
              const firstOfEntry =
                account !== undefined || ordered[index - 1]?.entryId !== line.entryId;
              const lastOfEntry =
                account !== undefined || ordered[index + 1]?.entryId !== line.entryId;
              const unbalanced = broken.some((b) => b.entryId === line.entryId);
              // Hairlines between entries only, so the lines of one entry read as one record, and
              // the lines inside an entry sit close, the rule's gap only between entries.
              const rule = cn(
                account === undefined && 'h-auto',
                account === undefined && !firstOfEntry && 'pt-1',
                !lastOfEntry && 'border-b-0 pb-1',
              );
              return (
                <TableRow key={line.id} data-entry={line.entryId}>
                  <TableCell
                    className={cn('hidden align-top whitespace-nowrap @xl:table-cell', rule)}
                  >
                    {firstOfEntry && (
                      <span className="text-fg-muted numeric">
                        {formatShortDate(line.date, locale)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn('hidden align-top whitespace-nowrap @2xl:table-cell', rule)}
                  >
                    {firstOfEntry && (
                      <span className="text-fg-muted numeric">{line.reference}</span>
                    )}
                  </TableCell>
                  <TableCell className={cn('align-top', rule)}>
                    {account === undefined ? (
                      <>
                        {firstOfEntry && (
                          <span className="mb-1 flex flex-wrap items-baseline gap-x-2">
                            <span className="font-medium">{line.description}</span>
                            <span className="text-sm text-fg-muted numeric @xl:hidden">
                              {formatShortDate(line.date, locale)}
                            </span>
                            {unbalanced && (
                              <Badge tone="negative">
                                <WarningCircleIcon aria-hidden weight="bold" />
                                {m.doesNotBalance}
                              </Badge>
                            )}
                          </span>
                        )}
                        {/* Credit lines indent under the debits, as a journal is written by hand. */}
                        <span
                          className={cn('flex items-baseline gap-2', line.credit > 0 && 'ps-6')}
                        >
                          <span className="text-fg-muted numeric">{line.accountCode}</span>
                          <span>{nameOf(line.accountCode)}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block">{line.description}</span>
                        <span className="block text-sm text-fg-muted @2xl:hidden">
                          <span className="numeric">{formatShortDate(line.date, locale)}</span>,{' '}
                          <span className="numeric">{line.reference}</span>
                        </span>
                      </>
                    )}
                  </TableCell>
                  <TableCell align="end" className={cn('hidden align-bottom @xl:table-cell', rule)}>
                    {money(line.debit)}
                  </TableCell>
                  <TableCell align="end" className={cn('hidden align-bottom @xl:table-cell', rule)}>
                    {money(line.credit)}
                  </TableCell>
                  <TableCell align="end" className={cn('align-bottom @xl:hidden', rule)}>
                    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                      {money(line.debit > 0 ? line.debit : line.credit)}
                      <span className="text-sm text-fg-muted">
                        <span aria-hidden>{line.debit > 0 ? m.debitShort : m.creditShort}</span>
                        <span className="sr-only">
                          {line.debit > 0 ? m.debitWord : m.creditWord}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  {account !== undefined && (
                    <TableCell align="end" className={cn('align-bottom', rule)}>
                      <Money
                        amount={balances[index]?.balance ?? 0}
                        currency={currency}
                        locale={locale}
                        tone="auto"
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
          {ordered.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableHead scope="row" className="hidden @xl:table-cell" />
                <TableHead scope="row" className="hidden @2xl:table-cell" />
                <TableHead scope="row" className="text-fg">
                  {account === undefined ? m.totals : m.closingBalance}
                </TableHead>
                <TableCell align="end" className="hidden @xl:table-cell">
                  <Money
                    amount={totals.debit}
                    currency={currency}
                    locale={locale}
                    className="font-strong"
                  />
                </TableCell>
                <TableCell align="end" className="hidden @xl:table-cell">
                  <Money
                    amount={totals.credit}
                    currency={currency}
                    locale={locale}
                    className="font-strong"
                  />
                </TableCell>
                <TableCell align="end" className="@xl:hidden">
                  <span className="flex flex-col items-end">
                    {(['debit', 'credit'] as const).map((side) => (
                      <span
                        key={side}
                        className="inline-flex items-baseline gap-1.5 whitespace-nowrap"
                      >
                        <Money
                          amount={totals[side]}
                          currency={currency}
                          locale={locale}
                          className="font-strong"
                        />
                        <span className="text-sm text-fg-muted">
                          <span aria-hidden>{side === 'debit' ? m.debitShort : m.creditShort}</span>
                          <span className="sr-only">
                            {side === 'debit' ? m.debitWord : m.creditWord}
                          </span>
                        </span>
                      </span>
                    ))}
                  </span>
                </TableCell>
                {account !== undefined && (
                  <TableCell align="end">
                    <Money
                      amount={closing}
                      currency={currency}
                      locale={locale}
                      tone="auto"
                      className="font-strong"
                    />
                  </TableCell>
                )}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}

      {account === undefined && ordered.length > 0 && (
        <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {totals.balanced ? (
            <>
              <Badge tone="positive">
                <CheckCircleIcon aria-hidden weight="bold" />
                {m.balanced}
              </Badge>
              <span className="text-fg-muted">{m.balancedNote}</span>
            </>
          ) : (
            <>
              <Badge tone="negative">
                <WarningCircleIcon aria-hidden weight="bold" />
                {m.outOfBalance}
              </Badge>
              <span>
                {m.exceeds(
                  totals.difference > 0 ? 'debits' : 'credits',
                  <Money
                    amount={Math.abs(totals.difference)}
                    currency={currency}
                    locale={locale}
                    className="font-medium"
                  />,
                  broken.map((b) => b.reference),
                )}
              </span>
            </>
          )}
        </p>
      )}
    </BlockPanel>
  );
}
