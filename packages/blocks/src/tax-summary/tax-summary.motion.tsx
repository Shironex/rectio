import { MotionParts } from '../lib/motion-parts';
import { TaxSummary as PlainTaxSummary, type TaxSummaryProps } from './tax-summary';

export type { TaxSummaryProps };

/** TaxSummary with the motion parts: same props, plain under reduced motion. */
export function TaxSummary(props: TaxSummaryProps) {
  return (
    <MotionParts>
      <PlainTaxSummary {...props} />
    </MotionParts>
  );
}
