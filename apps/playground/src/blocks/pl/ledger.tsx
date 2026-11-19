import { plural, type LedgerMessages } from '@rectio/blocks';

import { commonPl } from './common';

export const ledgerPl: LedgerMessages = {
  ...commonPl,
  title: 'Dziennik księgowy',
  journalDescription: (period, entries) =>
    [
      period,
      `${String(entries)} ${plural(entries, { one: 'zapis', few: 'zapisy', many: 'zapisów', other: 'zapisu' }, 'pl-PL')}`,
    ]
      .filter(Boolean)
      .join(', '),
  accountDescription: (period, normal) =>
    `Księga konta${period === undefined ? '' : `, ${period}`}, saldo ${normal === 'debit' ? 'Winien' : 'Ma'}`,
  accountLabel: 'Konto',
  allAccounts: 'Wszystkie konta',
  emptyTitle: 'Brak zapisów w tym okresie',
  emptyNote: 'Zapisy księgowe pojawią się tutaj po zaksięgowaniu.',
  tableCaption: (account, currency) =>
    `${account === undefined ? 'Pozycje dziennika' : `Księga konta ${account}`}, kwoty w ${currency}`,
  date: 'Data',
  reference: 'Dokument',
  entryAndAccount: 'Zapis i konto',
  description: 'Opis',
  debit: 'Winien',
  credit: 'Ma',
  amount: 'Kwota',
  balance: 'Saldo',
  openingBalance: 'Saldo początkowe',
  noPostings: 'Brak księgowań na tym koncie w tym okresie.',
  doesNotBalance: 'Zapis się nie bilansuje',
  debitShort: 'Wn',
  creditShort: 'Ma',
  debitWord: 'winien',
  creditWord: 'ma',
  totals: 'Obroty',
  closingBalance: 'Saldo końcowe',
  balanced: 'Zbilansowany',
  balancedNote: 'W każdym zapisie strona Winien równa się stronie Ma.',
  outOfBalance: 'Niezbilansowany',
  exceeds: (excess, difference, references) => (
    <>
      {excess === 'debits'
        ? 'Obroty Winien przewyższają obroty Ma'
        : 'Obroty Ma przewyższają obroty Winien'}{' '}
      o {difference}
      {references.length > 0 && `, w zapisach ${references.join(', ')}`}.
    </>
  ),
};
