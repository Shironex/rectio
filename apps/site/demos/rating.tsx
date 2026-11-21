'use client';

import { Rating, RatingDisplay } from '@rectio/ui';
import { useState } from 'react';

const VENDORS = [
  { name: 'Nordlicht GmbH', score: 4.6 },
  { name: 'Kestrel Logistics', score: 3.8 },
  { name: 'Halden Print Works', score: 2.4 },
] as const;

/** Rating a vendor after a delivery, beside the scores other buyers gave. */
export default function RatingDemo() {
  const [score, setScore] = useState<number | null>(4);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span id="rating-delivery" className="text-sm font-medium text-fg">
          How was the delivery?
        </span>
        <div className="flex items-center gap-3">
          <Rating
            aria-labelledby="rating-delivery"
            value={score}
            onValueChange={setScore}
            allowHalf
          />
          <span className="text-sm text-fg-muted numeric">
            {score === null ? 'Not rated' : `${String(score)} of 5`}
          </span>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-line text-sm">
        {VENDORS.map((vendor) => (
          <li key={vendor.name} className="flex items-center justify-between gap-4 py-2">
            <span className="text-fg">{vendor.name}</span>
            <RatingDisplay value={vendor.score} size="sm" showValue />
          </li>
        ))}
      </ul>
    </div>
  );
}
