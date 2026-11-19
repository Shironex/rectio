'use client';

import { VendorsList } from '@rectio/blocks/motion';

import { OPS_TODAY, VENDORS } from './operations-data';

export default function VendorsListMotionDemo() {
  return (
    <div className="w-full">
      <VendorsList
        vendors={VENDORS}
        today={OPS_TODAY}
        currency="EUR"
        locale="en-GB"
        onOpenVendor={() => undefined}
        onAddVendor={() => undefined}
      />
    </div>
  );
}
