import type { ProfitAndLossMessages } from '@rectio/blocks';

export const profitAndLossPl: ProfitAndLossMessages = {
  title: 'Rachunek zysków i strat',
  summary: (period, comparison) =>
    period === undefined
      ? (comparison ?? '')
      : comparison === undefined
        ? period
        : `${period} wobec ${comparison}`,
  sections: {
    revenue: 'Przychody ze sprzedaży',
    costOfSales: 'Koszt własny sprzedaży',
    operatingExpenses: 'Koszty operacyjne',
    otherIncome: 'Pozostałe przychody',
    otherExpenses: 'Pozostałe koszty',
    tax: 'Podatek dochodowy',
  },
  sectionTotals: {
    revenue: 'Przychody razem',
    costOfSales: 'Koszt własny sprzedaży razem',
    operatingExpenses: 'Koszty operacyjne razem',
    otherIncome: 'Pozostałe przychody razem',
    otherExpenses: 'Pozostałe koszty razem',
    tax: 'Podatek dochodowy razem',
  },
  results: {
    grossProfit: 'Zysk brutto ze sprzedaży',
    operatingProfit: 'Zysk operacyjny',
    profitBeforeTax: 'Zysk przed opodatkowaniem',
    netProfit: 'Zysk netto',
  },
  netLoss: 'Strata netto',
  account: 'Konto',
  current: 'Bieżący okres',
  comparison: 'Okres porównawczy',
  change: 'Zmiana',
  revenueFigure: 'Przychody',
  grossMarginFigure: 'Marża brutto',
  grossProfitNote: (amount) => <>{amount} zysku brutto</>,
  pointsOn: (points, comparison) => `${points} pkt proc. wobec ${comparison}`,
  netMarginNote: (margin) => `marża netto ${margin}`,
  changeOn: (change, comparison) => `${change} wobec ${comparison}`,
  margin: (margin) => `marża ${margin}`,
  changeWords: (direction, share) =>
    share === null
      ? direction === 'up'
        ? 'Wzrost'
        : 'Spadek'
      : `${direction === 'up' ? 'wzrost' : 'spadek'} o ${share}`,
  noChange: 'Bez zmian',
  from: (amount) => <>wcześniej {amount}</>,
  collapseAll: 'Zwiń wszystko',
  expandAll: 'Rozwiń wszystko',
  emptyTitle: 'Brak księgowań w tym okresie',
  emptyNote:
    'Przychody i koszty pojawią się tutaj jako rachunek wyników, gdy okres będzie miał zapisy.',
  tableCaption: (currency) => `Rachunek zysków i strat, kwoty w ${currency}`,
};
