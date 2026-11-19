import { plural, type VendorsListMessages } from '@rectio/blocks';

import { commonPl } from './common';

/** "3 dostawców" as a count, "dla 3 dostawców" after a preposition. */
const vendors = (count: number) =>
  `${String(count)} ${plural(count, { one: 'dostawca', few: 'dostawcy', many: 'dostawców', other: 'dostawcy' }, 'pl-PL')}`;
const vendorsOf = (count: number) =>
  `${String(count)} ${plural(count, { one: 'dostawcy', few: 'dostawców', many: 'dostawców', other: 'dostawcy' }, 'pl-PL')}`;

export const vendorsListPl: VendorsListMessages = {
  ...commonPl,
  states: {
    ...commonPl.states,
    active: 'Aktywny',
    'on-hold': 'Wstrzymany',
    archived: 'Zarchiwizowany',
  },
  title: 'Dostawcy',
  summary: (count, owed) => (
    <>
      {vendors(count)}, do zapłaty {owed}
    </>
  ),
  owed: 'Do zapłaty',
  owedNote: (count) => (count === 0 ? 'Nic do zapłaty' : `Dla ${vendorsOf(count)}`),
  overdue: 'Po terminie',
  overdueNote: (count) => `Zaległości u ${vendorsOf(count)}`,
  nothingOverdue: 'Brak zaległości',
  dueSoon: (count) => `Płatne w ciągu ${String(count)} dni`,
  dueSoonNote: (count) => `Dla ${vendorsOf(count)}`,
  nothingDueSoon: 'Nic w najbliższych dniach',
  addVendor: 'Dodaj dostawcę',
  searchLabel: 'Szukaj dostawców',
  searchPlaceholder: 'Nazwa lub osoba kontaktowa',
  filterLabel: 'Status',
  filters: {
    all: 'Wszyscy',
    active: 'Aktywni',
    'on-hold': 'Wstrzymani',
    archived: 'Zarchiwizowani',
  },
  tableCaption: (filter, currency) => `Dostawcy: ${filter.toLowerCase()}, kwoty w ${currency}`,
  vendor: 'Dostawca',
  terms: 'Termin',
  termsValue: (days) => `Termin ${String(days)} dni`,
  nextDue: 'Najbliższa płatność',
  dueIn: (days) =>
    days === 0 ? 'Płatne dziś' : days === 1 ? 'Płatne jutro' : `Płatne za ${String(days)} dni`,
  nothingDue: 'Nic do zapłaty',
  allPastDue: 'Wszystko po terminie',
  lastPayment: 'Ostatnia płatność',
  lastPaidLine: (date) => `Ostatnia płatność ${date}`,
  noPayments: 'Jeszcze bez płatności',
  status: 'Status',
  balance: 'Saldo',
  overdueAmount: (amount) => <>{amount} po terminie</>,
  sortBy: 'Sortuj według',
  sortPlaceholder: 'Pierwotna kolejność',
  descending: 'Malejąco',
  totalRow: (count) => `Razem, ${vendors(count)}`,
  emptyTitle: 'Brak dostawców',
  emptyNote: 'Dodani dostawcy pojawią się tutaj z kwotami do zapłaty i terminami płatności.',
  noResults: (query) => `Brak dostawców pasujących do „${query}”`,
  noneInFilter: (filter) => `Brak dostawców w widoku „${filter}”`,
  noResultsNote: 'Sprawdź pisownię albo szukaj we wszystkich statusach.',
  clearSearch: 'Wyczyść wyszukiwanie i filtr',
};
