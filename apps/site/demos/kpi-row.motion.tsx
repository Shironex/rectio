'use client';

import { KpiRow } from '@rectio/blocks/motion';

import { KPIS } from './finance-data';

export default function KpiRowMotionDemo() {
  return (
    <div className="w-full">
      <KpiRow kpis={KPIS} currency="EUR" locale="en-GB" comparison="vs February" />
    </div>
  );
}
