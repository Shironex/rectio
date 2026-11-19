'use client';

import { ArAging } from '@rectio/blocks';

import { RECEIVABLES, TODAY } from './finance-data';

export default function ArAgingDemo() {
  return (
    <div className="w-full">
      <ArAging receivables={RECEIVABLES} today={TODAY} currency="EUR" locale="en-GB" />
    </div>
  );
}
