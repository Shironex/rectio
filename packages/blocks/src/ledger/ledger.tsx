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
import { useState } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { ChoiceSelect } from '../lib/choice-select';
import { formatShortDate, resolveLocale } from '../lib/finance';
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
  className?: string;
}

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
  title = 'General journal',
  period,
  className,
}: LedgerProps) {
  const locale = resolveLocale(requestedLocale);
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
      title={account === undefined ? title : `${account.code} ${account.name}`}
      description={
        account === undefined
          ? [period, `${String(new Set(lines.map((l) => l.entryId)).size)} entries`]
              .filter(Boolean)
              .join(', ')
          : `Account ledger${period === undefined ? '' : `, ${period}`}, ${account.normal} balance`
      }
      actions={
        <ChoiceSelect
          label="Account"
          value={accountCode}
          onValueChange={setAccountCode}
          choices={[
            { value: ALL, label: 'All accounts' },
            ...accounts.map((a) => ({ value: a.code, label: `${a.code} ${a.name}` })),
          ]}
          className="min-w-56"
        />
      }
      className={className}
      bodyClassName="gap-4"
    >
      <Table>
        <TableCaption className="sr-only">
          {account === undefined ? 'Journal lines' : `Ledger of ${account.name}`}, amounts in{' '}
          {currency}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-20 @xl:table-cell">Date</TableHead>
            <TableHead className="hidden w-28 @2xl:table-cell">Reference</TableHead>
            <TableHead>{account === undefined ? 'Entry and account' : 'Description'}</TableHead>
            <TableHead align="end" className="hidden @xl:table-cell">
              Debit
            </TableHead>
            <TableHead align="end" className="hidden @xl:table-cell">
              Credit
            </TableHead>
            {/* Narrow: one amount column, each figure marked Dr or Cr. */}
            <TableHead align="end" className="@xl:hidden">
              Amount
            </TableHead>
            {account !== undefined && <TableHead align="end">Balance</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {account !== undefined && (
            <TableRow>
              <TableCell className="hidden @xl:table-cell" />
              <TableCell className="hidden @2xl:table-cell" />
              <TableCell className="text-fg-muted">Opening balance</TableCell>
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
                  {firstOfEntry && <span className="text-fg-muted numeric">{line.reference}</span>}
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
                              Does not balance
                            </Badge>
                          )}
                        </span>
                      )}
                      {/* Credit lines indent under the debits, as a journal is written by hand. */}
                      <span className={cn('flex items-baseline gap-2', line.credit > 0 && 'ps-6')}>
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
                      <span aria-hidden>{line.debit > 0 ? 'Dr' : 'Cr'}</span>
                      <span className="sr-only">{line.debit > 0 ? 'debit' : 'credit'}</span>
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
                {account === undefined ? 'Totals' : 'Closing balance'}
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
                        <span aria-hidden>{side === 'debit' ? 'Dr' : 'Cr'}</span>
                        <span className="sr-only">{side}</span>
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

      {account === undefined && (
        <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {totals.balanced ? (
            <>
              <Badge tone="positive">
                <CheckCircleIcon aria-hidden weight="bold" />
                Balanced
              </Badge>
              <span className="text-fg-muted">Debits equal credits for every entry.</span>
            </>
          ) : (
            <>
              <Badge tone="negative">
                <WarningCircleIcon aria-hidden weight="bold" />
                Out of balance
              </Badge>
              <span>
                {totals.difference > 0 ? 'Debits exceed credits' : 'Credits exceed debits'} by{' '}
                <Money
                  amount={Math.abs(totals.difference)}
                  currency={currency}
                  locale={locale}
                  className="font-medium"
                />
                {broken.length > 0 && `, in ${broken.map((b) => b.reference).join(', ')}`}.
              </span>
            </>
          )}
        </p>
      )}
    </BlockPanel>
  );
}
