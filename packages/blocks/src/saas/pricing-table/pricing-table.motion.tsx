import { SaasMotionParts } from '../lib/saas-motion-parts';
import { PricingTable as PlainPricingTable, type PricingTableProps } from './pricing-table';

export type { PricingTableProps };

/** PricingTable with the motion parts: same props, plain under reduced motion. */
export function PricingTable(props: PricingTableProps) {
  return (
    <SaasMotionParts>
      <PlainPricingTable {...props} />
    </SaasMotionParts>
  );
}
