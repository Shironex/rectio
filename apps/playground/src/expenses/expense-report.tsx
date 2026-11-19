import { ArrowLeftIcon } from '@phosphor-icons/react';
import { Money, ThemeScope, formatMoney } from '@rectio/ui';
import { useState } from 'react';

import type { Mode, ThemeId } from '../themes';
import { AddExpenseDialog } from './add-expense-dialog';
import { EXPENSES, categoryLabel, type Expense } from './data';

const CURRENCY = 'EUR';
const LOCALE = 'en-IE';

/** The finance composition: an expense report with the add expense dialog. */
export function ExpenseReport({ theme, mode }: { theme: ThemeId; mode: Mode }) {
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [status, setStatus] = useState('');
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ThemeScope theme={theme} mode={mode} className="min-h-dvh">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
        <a
          href="?"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-fg-muted underline decoration-line-strong underline-offset-4 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5" />
          All components
        </a>
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg-muted">Report 2041 · Anna Kowalska · In draft</p>
            <h1 className="font-display text-3xl font-heading tracking-tight">
              March travel and tools
            </h1>
          </div>
          <AddExpenseDialog
            onAdd={(expense) => {
              setExpenses((list) => [...list, expense]);
              setLastAdded(expense.id);
              setStatus(
                `Added ${expense.merchant}, ${formatMoney(expense.amount, CURRENCY, { locale: LOCALE })}.`,
              );
            }}
          />
        </header>
        <p role="status" className="-mt-4 min-h-5 text-sm text-positive-strong">
          {status}
        </p>

        {/* On phones Date and Category fold under the merchant, so the amount never leaves the screen. */}
        <div>
          <table className="w-full border-collapse text-base">
            <caption className="sr-only">Expenses in this report</caption>
            <thead>
              <tr className="border-b border-line-strong text-start text-sm text-fg-muted">
                <th
                  scope="col"
                  className="hidden w-20 py-2 pe-4 text-start font-medium sm:table-cell"
                >
                  Date
                </th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">
                  Merchant
                </th>
                <th scope="col" className="hidden py-2 pe-4 text-start font-medium sm:table-cell">
                  Category
                </th>
                <th scope="col" className="py-2 text-end font-medium">
                  Amount, {CURRENCY}
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  data-new={e.id === lastAdded || undefined}
                  className="border-b border-line transition-colors duration-slow ease-standard data-new:bg-surface-hover"
                >
                  <td className="hidden py-3 pe-4 align-top whitespace-nowrap text-fg-muted numeric sm:table-cell">
                    {e.date}
                  </td>
                  <td className="py-3 pe-4 align-top">
                    <span className="block">{e.merchant}</span>
                    <span className="block text-sm text-fg-muted sm:hidden">
                      <span className="numeric">{e.date}</span>, {categoryLabel(e.category)}
                    </span>
                    {e.note !== undefined && (
                      <span className="block text-sm text-fg-subtle">{e.note}</span>
                    )}
                  </td>
                  <td className="hidden py-3 pe-4 align-top text-fg-muted sm:table-cell">
                    {categoryLabel(e.category)}
                  </td>
                  <td className="py-3 text-end align-top">
                    <Money
                      amount={e.amount}
                      currency={CURRENCY}
                      locale={LOCALE}
                      tone={e.amount < 0 ? 'auto' : 'neutral'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line-strong">
                {/* Two headers, one per layout: a colSpan that counts hidden columns would leave an
                    empty third column on phones. */}
                <th
                  scope="row"
                  className="pt-4 pe-4 text-start text-sm font-medium text-fg-muted sm:hidden"
                >
                  Total, {expenses.length} expenses
                </th>
                <th
                  scope="row"
                  colSpan={3}
                  className="hidden pt-4 pe-4 text-start text-sm font-medium text-fg-muted sm:table-cell"
                >
                  Total, {expenses.length} expenses
                </th>
                <td className="pt-4 text-end text-xl font-strong">
                  <Money amount={total} currency={CURRENCY} locale={LOCALE} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ThemeScope>
  );
}
