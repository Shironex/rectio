'use client';

import { Ledger } from '@rectio/blocks/motion';

import { ACCOUNTS, JOURNAL, OPENING } from './finance-data';

export default function LedgerMotionDemo() {
  return (
    <div className="w-full">
      <Ledger
        accounts={ACCOUNTS}
        lines={JOURNAL}
        openingBalances={OPENING}
        period="March 2026"
        currency="EUR"
        locale="en-GB"
      />
    </div>
  );
}
