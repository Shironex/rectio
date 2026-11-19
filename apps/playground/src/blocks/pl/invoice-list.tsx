import { plural, type InvoiceListMessages } from '@rectio/blocks';

import { commonPl } from './common';

const invoices = (count: number) =>
  plural(count, { one: 'faktura', few: 'faktury', many: 'faktur', other: 'faktury' }, 'pl-PL');

export const invoiceListPl: InvoiceListMessages = {
  ...commonPl,
  title: 'Faktury',
  description: (period, count) => `${period}, ${String(count)} ${invoices(count)}`,
  periods: {
    'this-month': 'Ten miesiąc',
    'last-month': 'Poprzedni miesiąc',
    quarter: 'Ten kwartał',
    year: 'Ten rok',
    all: 'Cały okres',
  },
  filters: {
    all: 'Wszystkie',
    outstanding: 'Nieopłacone',
    overdue: 'Po terminie',
    paid: 'Opłacone',
    draft: 'Szkice',
  },
  periodLabel: 'Okres',
  statusLabel: 'Status',
  newInvoice: 'Nowa faktura',
  emptyTitle: 'Brak faktur',
  emptyNote:
    'Wystawione faktury pojawią się tutaj razem z kwotami do zapłaty, po terminie i opłaconymi.',
  outstanding: 'Do zapłaty',
  overdue: 'Po terminie',
  paid: 'Opłacone',
  openNote: (count) => `${String(count)} otwartych`,
  nothingOverdue: 'Nic po terminie',
  pastDueNote: (count) => `${String(count)} po terminie płatności`,
  settledNote: (count) => `${String(count)} rozliczonych`,
  tableCaption: (title, filter) => `${title}, ${filter.toLowerCase()}`,
  invoice: 'Faktura',
  customer: 'Klient',
  issued: 'Wystawiona',
  due: 'Termin',
  status: 'Status',
  amountHeader: (currency) => `Kwota, ${currency}`,
  amount: 'Kwota',
  issuedOn: (date) => <>Wystawiona {date}</>,
  dueText: (info) => {
    switch (info.kind) {
      case 'today':
        return 'Termin dzisiaj';
      case 'tomorrow':
        return 'Termin jutro';
      case 'in':
        return `Termin za ${String(info.days)} ${plural(info.days, { one: 'dzień', other: 'dni' }, 'pl-PL')}`;
      case 'overdue':
        return `${String(info.days)} ${plural(info.days, { one: 'dzień', other: 'dni' }, 'pl-PL')} po terminie`;
    }
  },
  totalRow: (count) => `Razem, ${String(count)} ${invoices(count)}`,
  totalNote: (voided) =>
    `Suma pokazanych kwot${voided > 0 ? `, ${String(voided)} anulowane nie wliczono` : ''}`,
  paidOf: (paid, total) => (
    <>
      {paid} zapłacono z {total}
    </>
  ),
  sortLabel: 'Sortuj według',
  sortPlaceholder: 'Kolejność pierwotna',
  sortDescending: 'Malejąco',
  noneTitle: (filter) =>
    filter === 'overdue'
      ? 'Nic nie jest po terminie'
      : filter === 'all'
        ? 'Brak faktur w tym okresie'
        : `Brak faktur o statusie „${filter === 'outstanding' ? 'nieopłacone' : filter === 'paid' ? 'opłacone' : 'szkice'}” w tym okresie`,
  noneNote: 'Poszerz okres lub pokaż wszystkie statusy.',
  showAll: 'Pokaż wszystkie faktury',
};
