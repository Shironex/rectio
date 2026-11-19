import { plural, type TaxSummaryMessages } from '@rectio/blocks';

const days = (count: number) =>
  `${String(count)} ${plural(count, { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' }, 'pl-PL')}`;

export const taxSummaryPl: TaxSummaryMessages = {
  title: 'Deklaracja VAT',
  statuses: {
    open: 'Otwarta',
    ready: 'Gotowa do złożenia',
    filed: 'Złożona',
    paid: 'Opłacona',
    overdue: 'Po terminie',
  },
  outputFigure: 'VAT należny',
  inputFigure: 'VAT naliczony',
  payableFigure: 'Do zapłaty',
  refundFigure: 'Do zwrotu',
  nilFigure: 'Brak zobowiązania',
  outputNote: (base) => <>od {base} sprzedaży</>,
  inputNote: (base) => <>od {base} zakupów</>,
  netNote: (position) =>
    position === 'payable'
      ? 'Na rzecz urzędu skarbowego'
      : position === 'refund'
        ? 'Do odzyskania z urzędu skarbowego'
        : 'VAT należny i naliczony się równoważą',
  dueOn: (date) => `Termin ${date}`,
  dueState: (state, count) => {
    switch (state) {
      case 'upcoming':
        return `jeszcze ${days(count)}`;
      case 'today':
        return 'Termin mija dziś';
      case 'overdue':
        return `${days(count)} po terminie`;
      case 'filed':
        return 'Złożona';
      case 'paid':
        return 'Rozliczona';
    }
  },
  rate: 'Stawka',
  exempt: 'Zwolnione',
  taxableSales: 'Sprzedaż netto',
  outputTax: 'VAT należny',
  taxablePurchases: 'Zakupy netto',
  inputTax: 'VAT naliczony',
  net: 'Saldo',
  total: 'Razem',
  foldedOutput: (tax, base) => (
    <>
      <span className="whitespace-nowrap">VAT należny {tax}</span>{' '}
      <span className="whitespace-nowrap text-fg-subtle">podstawa {base}</span>
    </>
  ),
  foldedInput: (tax, base) => (
    <>
      <span className="whitespace-nowrap">VAT naliczony {tax}</span>{' '}
      <span className="whitespace-nowrap text-fg-subtle">podstawa {base}</span>
    </>
  ),
  prepare: 'Przygotuj deklarację',
  file: 'Złóż deklarację',
  export: 'Eksportuj',
  emptyTitle: 'Brak sprzedaży i zakupów z VAT w tym okresie',
  emptyNote: 'Sprzedaż i zakupy z VAT pojawią się tutaj według stawek, gotowe do deklaracji.',
  tableCaption: (currency) => `VAT według stawek, kwoty w ${currency}`,
};
