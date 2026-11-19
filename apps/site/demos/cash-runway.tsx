'use client';

import { CashRunway } from '@rectio/blocks';

import { RUNWAY_HISTORY, RUNWAY_PLANNED } from './reporting-data';

export default function CashRunwayDemo() {
  return (
    <div className="w-full">
      <CashRunway
        history={RUNWAY_HISTORY}
        balance={412_600}
        planned={RUNWAY_PLANNED}
        threshold={100_000}
        currency="EUR"
        locale="en-GB"
      />
    </div>
  );
}
