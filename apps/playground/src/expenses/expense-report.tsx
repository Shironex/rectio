import { Money, ThemeScope } from '@rectio/ui';
import { useState } from 'react';

import type { Mode, ThemeId } from '../themes';
import { AddExpenseDialog } from './add-expense-dialog';
import { EXPENSES, categoryLabel, type Expense } from './data';

const CURRENCY = 'EUR';
const LOCALE = 'en-IE';

/** The finance composition: an expense report with the add expense dialog. */
export function ExpenseReport({ theme, mode }: { theme: ThemeId; mode: Mode }) {
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ThemeScope theme={theme} mode={mode} className="min-h-dvh">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
        <a
          href="?"
          className="w-fit text-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
        >
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
            }}
          />
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-xl border-collapse text-base">
            <caption className="sr-only">Expenses in this report</caption>
            <thead>
              <tr className="border-b border-line-strong text-start text-sm text-fg-muted">
                <th scope="col" className="w-20 py-2 pe-4 text-start font-medium">
                  Date
                </th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">
                  Merchant
                </th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">
                  Category
                </th>
                <th scope="col" className="py-2 text-end font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-line">
                  <td className="py-3 pe-4 align-top whitespace-nowrap text-fg-muted numeric">
                    {e.date}
                  </td>
                  <td className="py-3 pe-4 align-top">
                    <span className="block">{e.merchant}</span>
                    {e.note !== undefined && (
                      <span className="block text-sm text-fg-subtle">{e.note}</span>
                    )}
                  </td>
                  <td className="py-3 pe-4 align-top text-fg-muted">{categoryLabel(e.category)}</td>
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
                <th
                  scope="row"
                  colSpan={3}
                  className="pt-4 pe-4 text-start text-sm font-medium text-fg-muted"
                >
                  Total, {expenses.length} expenses
                </th>
                <td className="pt-4 text-end font-display text-xl font-heading">
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
