import { plural, type ExpenseApprovalMessages } from '@rectio/blocks';

import { commonPl } from './common';

const expenses = (count: number) =>
  plural(count, { one: 'wydatek', few: 'wydatki', many: 'wydatków', other: 'wydatku' }, 'pl-PL');

const PAST = {
  submitted: 'przesłał(a)',
  approved: 'zatwierdził(a)',
  rejected: 'odrzucił(a)',
  reopened: 'wznowił(a)',
} as const;

export const expenseApprovalPl: ExpenseApprovalMessages = {
  ...commonPl,
  title: 'Akceptacja wydatków',
  summary: (count, total) => (
    <>
      Oczekuje: {count}, łącznie {total}
    </>
  ),
  nothingWaiting: 'Nic nie czeka na Twoją decyzję',
  selectAll: 'Zaznacz wszystkie oczekujące wydatki',
  selectHint: 'Zaznacz, aby zdecydować o kilku naraz',
  selected: (count, total) => (
    <>
      {count} zaznaczone, {total}
    </>
  ),
  rejectMany: (count) => `Odrzuć (${String(count)})`,
  approveMany: (count) => `Zatwierdź (${String(count)})`,
  emptyTitle: 'Wszystko załatwione',
  emptyNote: 'Nowe wydatki pojawią się tutaj po przesłaniu.',
  tableCaption: (currency) => `Oczekujące wydatki, kwoty w ${currency}`,
  select: 'Zaznacz',
  expense: 'Wydatek',
  category: 'Kategoria',
  amount: 'Kwota',
  decision: 'Decyzja',
  selectOne: (merchant, employee) => `Zaznacz ${merchant}, ${employee}`,
  approve: 'Zatwierdź',
  reject: 'Odrzuć',
  approveOne: (merchant, employee) => `Zatwierdź ${merchant}, ${employee}`,
  rejectOne: (merchant, employee) => `Odrzuć ${merchant}, ${employee}`,
  recentDecisions: 'Ostatnie decyzje',
  actions: {
    submitted: 'przesłany',
    approved: 'zatwierdzony',
    rejected: 'odrzucony',
    reopened: 'wznowiony',
  },
  trailLine: (actor, action, merchant, amount) => (
    <>
      <span className="font-medium">{actor}</span> {PAST[action]} {merchant ?? 'wydatek'}
      {amount !== undefined && <>, {amount}</>}
    </>
  ),
  reasonLine: (reason) => `Powód: ${reason}`,
  undo: 'Cofnij',
  undoLabel: (merchant) => `Cofnij, przywróć ${merchant} do oczekujących`,
  rejectManyTitle: (count) => `Odrzuć ${String(count)} ${expenses(count)}`,
  rejectOneTitle: (merchant) => `Odrzuć ${merchant}`,
  rejectManyNote: (total) => <>Łącznie {total}. Każdy pracownik dostanie ten sam powód.</>,
  rejectOneNote: (employee, amount) => (
    <>
      {employee}, {amount}. Pracownik zobaczy Twój powód.
    </>
  ),
  reasonLabel: 'Powód',
  reasonPlaceholder: 'Na przykład: brak paragonu, prześlij ponownie z załącznikiem',
  reasonHint: 'Zapisany w historii zmian razem z Twoim imieniem i nazwiskiem.',
  reasonMissing: 'Napisz dlaczego, aby pracownik wiedział, co poprawić.',
  reasonTooShort: (minimum) => `Napisz co najmniej ${String(minimum)} znaków.`,
  cancel: 'Anuluj',
  confirmReject: 'Odrzuć',
  close: 'Zamknij',
};
