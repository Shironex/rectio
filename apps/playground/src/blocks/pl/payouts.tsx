import { plural, type PayoutsMessages } from '@rectio/blocks';

import { commonPl } from './common';

const payouts = (count: number) =>
  `${String(count)} ${plural(count, { one: 'wypłata', few: 'wypłaty', many: 'wypłat', other: 'wypłaty' }, 'pl-PL')}`;

const DATE_WORDS = {
  scheduled: 'Wyjdzie',
  'in-transit': 'Dotrze',
  paid: 'Dotarła',
  failed: 'Próba',
  cancelled: 'Planowana na',
} as const;

export const payoutsPl: PayoutsMessages = {
  ...commonPl,
  states: { ...commonPl.states, paid: 'Wypłacona' },
  title: 'Wypłaty',
  next: (payee, amount, date, status) => (
    <>
      Następna: {amount} dla {payee}, {status === 'scheduled' ? 'wyjdzie' : 'dotrze'} {date}
    </>
  ),
  nothingUpcoming: 'Nic zaplanowanego ani w drodze',
  scheduledSoon: (count) => `Zaplanowane, najbliższe ${String(count)} dni`,
  inTransit: 'W drodze',
  paidInPeriod: 'Wypłacone w tym miesiącu',
  failed: 'Nieudane',
  payoutCount: payouts,
  nothingScheduled: 'Nic nie zaplanowano',
  nothingInTransit: 'Nic w drodze',
  nothingFailed: 'Brak nieudanych',
  toRetry: (count) => `Do ponowienia: ${payouts(count)}`,
  filterLabel: 'Status',
  filters: {
    all: 'Wszystkie',
    scheduled: 'Zaplanowane',
    'in-transit': 'W drodze',
    paid: 'Wypłacone',
    failed: 'Nieudane',
    cancelled: 'Anulowane',
  },
  methods: {
    'bank-transfer': 'Przelew bankowy',
    instant: 'Przelew natychmiastowy',
    card: 'Karta',
    wallet: 'Portfel',
    cheque: 'Czek',
  },
  tableCaption: (filter, currency) => `Wypłaty: ${filter.toLowerCase()}, kwoty w ${currency}`,
  payee: 'Odbiorca',
  date: 'Data',
  status: 'Status',
  amount: 'Kwota',
  action: 'Działanie',
  dateLine: (status, date) => `${DATE_WORDS[status]} ${date}`,
  failureLine: (reason) => `Odpowiedź banku: ${reason}`,
  retry: 'Ponów',
  retryLabel: (payee, amount) => `Ponów ${amount} dla ${payee}`,
  emptyTitle: 'Brak wypłat',
  emptyNote: 'Zaplanowane wypłaty pojawią się tutaj, od zlecenia do wpływu u odbiorcy.',
  noneInFilter: (filter) => `Brak wypłat w widoku „${filter}”`,
  noneInFilterNote: 'Pojawią się tu wszystkie wypłaty z tym statusem.',
  showAll: 'Pokaż wszystkie wypłaty',
  totalRow: (count) => `Razem, ${payouts(count)}`,
  totalNote: (excluded) =>
    excluded === 0
      ? 'Suma pokazanych kwot'
      : `Suma pokazanych kwot, bez nieudanych i anulowanych (${String(excluded)})`,
};
