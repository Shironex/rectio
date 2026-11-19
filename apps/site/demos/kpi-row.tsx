'use client';

import { KpiRow } from '@rectio/blocks';

import { KPIS } from './finance-data';

export default function KpiRowDemo() {
  return (
    <div className="w-full">
      <KpiRow kpis={KPIS} currency="EUR" locale="en-GB" comparison="vs February" />
    </div>
  );
}
