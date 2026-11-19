import { plural, type BankReconciliationMessages } from '@rectio/blocks';

import { commonPl } from './common';

const lines = (count: number) =>
  `${String(count)} ${plural(count, { one: 'pozycja', few: 'pozycje', many: 'pozycji', other: 'pozycji' }, 'pl-PL')}`;
const entries = (count: number) =>
  `${String(count)} ${plural(count, { one: 'zapis', few: 'zapisy', many: 'zapisów', other: 'zapisu' }, 'pl-PL')}`;
const days = (count: number) =>
  `${String(count)} ${plural(count, { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' }, 'pl-PL')}`;

export const bankReconciliationPl: BankReconciliationMessages = {
  ...commonPl,
  states: {
    ...commonPl.states,
    matched: 'Dopasowana',
    suggested: 'Propozycja',
    unmatched: 'Niedopasowana',
  },
  title: 'Uzgodnienie bankowe',
  description: (scope, matched, total) =>
    `${scope === undefined ? '' : `${scope}. `}Dopasowano ${String(matched)} z ${String(total)} pozycji wyciągu`,
  statementBalance: 'Saldo wg wyciągu',
  bookBalance: 'Saldo wg ksiąg',
  difference: 'Różnica',
  statementLines: (count) => `${lines(count)} na wyciągu`,
  bookEntries: (count) => `${entries(count)} w księgach`,
  reconciledNote: 'Uzgodnione',
  toMatch: (count) => `Zero, do dopasowania: ${String(count)}`,
  explained: 'Wynika z niedopasowanych pozycji',
  notExplained: (amount) => <>{amount} nie wynika z niedopasowanych pozycji</>,
  filterLabel: 'Pokaż',
  filters: {
    unmatched: 'Niedopasowane',
    suggested: 'Propozycje',
    matched: 'Dopasowane',
    all: 'Wszystkie',
  },
  tableCaption: (filter, currency) =>
    `Pozycje wyciągu: ${filter.toLowerCase()}, z zapisami w księgach, kwoty w ${currency}`,
  date: 'Data',
  onStatement: 'Na wyciągu',
  inBooks: 'W księgach',
  amount: 'Kwota',
  action: 'Działanie',
  reason: (reason, count) =>
    reason === 'reference'
      ? 'Ta sama kwota i tytuł płatności'
      : count === 0
        ? 'Ta sama kwota, ten sam dzień'
        : `Ta sama kwota, ${days(count)} różnicy`,
  noEntry: 'Brak zapisu z tą kwotą',
  match: 'Dopasuj',
  matchLabel: (line, entry) => `Dopasuj ${line} do ${entry}`,
  unmatch: 'Rozłącz',
  unmatchLabel: (line) => `Rozłącz ${line}`,
  matchAll: (count) => `Dopasuj wszystkie (${String(count)})`,
  createEntry: 'Zaksięguj',
  createEntryLabel: (line) => `Zaksięguj ${line}`,
  bookOnly: (count) => `W księgach, brak na wyciągu (${String(count)})`,
  bookOnlyCaption: (currency) => `Zapisy w księgach bez pozycji na wyciągu, kwoty w ${currency}`,
  bookOnlyNote: 'Płatności, które jeszcze nie dotarły do banku, albo zapisy do poprawienia.',
  descriptionColumn: 'Opis',
  noneInFilter: (filter) => `Brak pozycji w widoku „${filter}”`,
  noneInFilterNote: 'Pojawią się tu wszystkie pozycje wyciągu w tym stanie.',
  showAll: 'Pokaż wszystkie pozycje',
  reconcile: 'Oznacz jako uzgodnione',
  readyNote: 'Wszystko dopasowane, salda się zgadzają.',
  notReadyNote: ({ suggested, unmatched, bookOnly }, difference) => {
    const parts = [
      suggested > 0 &&
        `${String(suggested)} ${plural(suggested, { one: 'propozycja', few: 'propozycje', many: 'propozycji', other: 'propozycji' }, 'pl-PL')} do zatwierdzenia`,
      unmatched > 0 && `niedopasowane: ${lines(unmatched)}`,
      bookOnly > 0 && `tylko w księgach: ${entries(bookOnly)}`,
    ].filter((part): part is string => typeof part === 'string');
    const left = parts.join(', ');
    if (difference === null) return `Zostało: ${left}.`;
    if (left === '') return <>Do wyjaśnienia zostaje różnica {difference}.</>;
    return (
      <>
        Zostało: {left}. Różnica {difference}.
      </>
    );
  },
  emptyTitle: 'Nic do uzgodnienia',
  emptyNote: 'Zaimportuj wyciąg, aby dopasować jego pozycje do zapisów w księgach.',
};
