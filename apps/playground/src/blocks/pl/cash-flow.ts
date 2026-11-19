import type { CashFlowMessages } from '@rectio/blocks';

import { commonPl } from './common';

const ROMAN = ['I', 'II', 'III', 'IV'] as const;

export const cashFlowPl: CashFlowMessages = {
  ...commonPl,
  title: 'Przepływy pieniężne',
  noData: 'Brak danych',
  range: (from, to) => `${from} do ${to}`,
  quarter: (quarter, year, short) =>
    short
      ? `${ROMAN[quarter - 1] ?? ''} kw. ${String(year).slice(2)}`
      : `${ROMAN[quarter - 1] ?? ''} kwartał ${String(year)}`,
  groupBy: 'Grupuj według',
  monthly: 'Miesiące',
  quarterly: 'Kwartały',
  emptyTitle: 'Brak przepływów pieniężnych',
  emptyNote: 'Wpływy i wydatki pojawią się tutaj po zaksięgowaniu płatności.',
  inflow: 'Wpływy',
  outflow: 'Wydatki',
  net: 'Saldo',
  positiveNote: (positive, total, granularity) =>
    `Dodatnie w ${String(positive)} z ${String(total)} ${
      granularity === 'month' ? 'miesięcy' : 'kwartałów'
    }`,
  chartSummary: ({ granularity, range, netNegative, positive, total }) =>
    `Przepływy pieniężne według ${granularity === 'month' ? 'miesięcy' : 'kwartałów'}, ${range}. Saldo ${
      netNegative ? 'ujemne' : 'dodatnie'
    } w całym okresie, dodatnie w ${String(positive)} z ${String(total)} ${
      granularity === 'month' ? 'miesięcy' : 'kwartałów'
    }. Strzałkami na wykresie przejdziesz po ${granularity === 'month' ? 'miesiącach' : 'kwartałach'}, albo pokaż tabelę.`,
  tableCaption: (granularity, currency) =>
    `Przepływy pieniężne według ${granularity === 'month' ? 'miesięcy' : 'kwartałów'}, w ${currency}`,
  periodHeader: (granularity) => (granularity === 'month' ? 'Miesiąc' : 'Kwartał'),
};
