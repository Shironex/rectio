import { plural, type ArAgingMessages } from '@rectio/blocks';

import { commonPl } from './common';

export const arAgingPl: ArAgingMessages = {
  ...commonPl,
  title: 'Wiekowanie należności',
  summary: (outstanding, pastDueShare) => (
    <>
      {outstanding} do zapłaty, {pastDueShare} po terminie
    </>
  ),
  buckets: {
    current: 'Bieżące',
    '1-30': '1 do 30 dni',
    '31-60': '31 do 60 dni',
    '61-90': '61 do 90 dni',
    '90+': 'Ponad 90 dni',
  },
  bucketsShort: {
    current: 'Bieżące',
    '1-30': '1-30',
    '31-60': '31-60',
    '61-90': '61-90',
    '90+': '90+',
  },
  emptyTitle: 'Brak należności',
  emptyNote: 'Nieopłacone faktury pojawią się tutaj, pogrupowane według opóźnienia.',
  chartSummary: (shares) =>
    `Należności według dni po terminie. ${shares.map((s) => `${s.bucket}: ${s.share}`).join('; ')}.`,
  tooltipTitle: (bucket, share) => `${bucket}, ${share} całości`,
  outstanding: 'Do zapłaty',
  bucket: 'Przedział',
  share: 'Udział',
  bucketTableCaption: (currency) => `Należności według przedziałów, w ${currency}`,
  customer: 'Klient',
  total: 'Razem',
  customerTableCaption: (currency) => `Należności według klientów i przedziałów, w ${currency}`,
  oldestPastDue: (days) =>
    `Najstarsza: ${String(days)} ${plural(days, { one: 'dzień', other: 'dni' }, 'pl-PL')} po terminie`,
  nothingPastDue: 'Nic po terminie',
  none: 'Brak',
  totalRow: (others) =>
    others === 0
      ? 'Razem'
      : `Razem, z ${String(others)} ${plural(others, { one: 'innym klientem', other: 'innymi klientami' }, 'pl-PL')}`,
};
