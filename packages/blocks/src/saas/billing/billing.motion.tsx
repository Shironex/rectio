import { SaasMotionParts } from '../lib/saas-motion-parts';
import { Billing as PlainBilling, type BillingProps } from './billing';

export type { BillingProps };

/** Billing with the motion parts: same props, plain under reduced motion. */
export function Billing(props: BillingProps) {
  return (
    <SaasMotionParts>
      <PlainBilling {...props} />
    </SaasMotionParts>
  );
}
