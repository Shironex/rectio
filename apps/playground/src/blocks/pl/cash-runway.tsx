import { plural, type CashRunwayMessages, type MonthWords } from '@rectio/blocks';

import { commonPl } from './common';

/** "listopada 2026": the month in the genitive, as "do" and "od" take it. */
function genitive(month: MonthWords) {
  const parts = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(month.date);
  const name = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  return `${name} ${year}`;
}

export const cashRunwayPl: CashRunwayMessages = {
  ...commonPl,
  title: 'Zapas gotówki',
  summary: (status, zeroMonth, threshold) => (
    <>
      {status === 'burning' && threshold !== undefined ? (
        <>
          Przy obecnym tempie od{' '}
          <strong className="font-medium text-fg">{genitive(threshold.month)}</strong> saldo będzie
          poniżej minimum {threshold.amount}, a gotówki wystarczy do{' '}
          <strong className="font-medium text-fg">
            {zeroMonth === undefined ? '' : genitive(zeroMonth)}
          </strong>
        </>
      ) : (
        <>
          {status === 'burning' ? (
            <>
              Przy obecnym tempie gotówki wystarczy do{' '}
              <strong className="font-medium text-fg">
                {zeroMonth === undefined ? '' : genitive(zeroMonth)}
              </strong>
            </>
          ) : status === 'beyond-horizon' ? (
            'Przy obecnym tempie gotówki wystarczy na dłużej niż prognoza'
          ) : (
            'Gotówki przybywa: wpływy przewyższają wydatki'
          )}
          {threshold !== undefined && (
            <>
              , a od <strong className="font-medium text-fg">{genitive(threshold.month)}</strong>{' '}
              saldo będzie poniżej minimum {threshold.amount}
            </>
          )}
        </>
      )}
    </>
  ),
  window: 'Średnia z',
  windowOption: (months) => `${String(months)} mies.`,
  cashNow: 'Gotówka teraz',
  asOf: (month) => `na koniec ${genitive(month)}`,
  averageBurn: 'Średnie spalanie',
  averageInflow: 'Średni przyrost netto',
  burnNote: (months) =>
    months === 1
      ? 'miesięcznie, z ostatniego miesiąca'
      : `miesięcznie, średnia z ${String(months)} miesięcy`,
  runway: 'Zapas',
  runwayMonths: (months, count) =>
    `${months} ${plural(count, { one: 'miesiąc', few: 'miesiące', many: 'miesięcy', other: 'miesiąca' }, 'pl-PL')}`,
  notBurning: 'Bez spalania',
  runwayNote: (status, zeroMonth, horizonMonth) =>
    status === 'burning'
      ? `Wystarczy do ${zeroMonth === undefined ? '' : genitive(zeroMonth)}`
      : status === 'beyond-horizon'
        ? `Wystarczy dłużej niż do ${horizonMonth === undefined ? '' : genitive(horizonMonth)}`
        : 'Gotówki co miesiąc przybywa',
  actual: 'Rzeczywiste',
  projected: 'Prognoza',
  minimumCash: 'Minimum gotówki',
  cashOut: 'Koniec gotówki',
  includesPlanned: (count) =>
    `Uwzględnia ${String(count)} ${plural(count, { one: 'zaplanowaną zmianę', few: 'zaplanowane zmiany', many: 'zaplanowanych zmian', other: 'zaplanowanej zmiany' }, 'pl-PL')}`,
  runwayShort: (months) =>
    `Mniej niż ${String(months)} ${plural(months, { one: 'miesiąc', few: 'miesiące', many: 'miesięcy', other: 'miesiąca' }, 'pl-PL')}`,
  balance: 'Saldo',
  month: 'Miesiąc',
  note: 'Uwagi',
  plannedLine: (label, amount) => (
    <>
      {label}, {amount}
    </>
  ),
  chartSummary: (summary) =>
    `Saldo gotówki na koniec miesiąca, rzeczywiste, a potem prognozowane przy średnim spalaniu. ${summary}. Strzałkami na wykresie przejdziesz po miesiącach, albo pokaż tabelę.`,
  emptyTitle: 'Brak historii gotówki',
  emptyNote: 'Zapas gotówki pojawi się, gdy zaksięgujesz co najmniej miesiąc wpływów i wydatków.',
  tableCaption: (currency) => `Saldo gotówki na koniec miesiąca, w ${currency}`,
};
