import type { BudgetVsActualMessages } from '@rectio/blocks';

import { commonPl } from './common';

export const budgetVsActualPl: BudgetVsActualMessages = {
  ...commonPl,
  title: 'Budżet i wykonanie',
  noBudgetSet: 'brak budżetu',
  allOnTrack: 'wszystkie kategorie zgodnie z planem',
  offTrack: (count, total, kind) =>
    `${String(count)} z ${String(total)} ${kind === 'expense' ? 'powyżej budżetu' : 'poniżej celu'}`,
  emptyTitle: 'Brak budżetu na ten okres',
  emptyNote: 'Ustaw budżet dla każdej kategorii, aby porównać z nim wydatki.',
  legendBudget: 'Budżet',
  legendActual: 'Wykonanie',
  legendOver: 'Powyżej budżetu',
  tableCaption: (currency) => `Budżet i wykonanie według kategorii, w ${currency}`,
  category: 'Kategoria',
  spentOfBudget: 'Wykorzystanie budżetu',
  budget: 'Budżet',
  actual: 'Wykonanie',
  variance: 'Odchylenie',
  actualOfBudget: (actual, budget) => (
    <>
      {actual} z {budget}
    </>
  ),
  total: 'Razem',
  varianceWords: (position, percent) =>
    `${percent === null ? '' : `${percent} `}${position === 'over' ? 'powyżej' : 'poniżej'}`,
  onBudget: 'Zgodnie z budżetem',
};
