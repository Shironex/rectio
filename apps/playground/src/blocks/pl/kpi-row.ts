import type { KpiRowMessages } from '@rectio/blocks';

export const kpiRowPl: KpiRowMessages = {
  label: 'Kluczowe wskaźniki',
  new: 'Nowe',
  points: (points) => `${points} p.p.`,
  better: 'korzystnie',
  worse: 'niekorzystnie',
  noChange: 'bez zmian',
};
