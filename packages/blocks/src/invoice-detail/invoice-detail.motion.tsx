import { MotionParts } from '../lib/motion-parts';
import { InvoiceDetail as PlainInvoiceDetail, type InvoiceDetailProps } from './invoice-detail';

export type { InvoiceDetailProps };

/** InvoiceDetail with the motion parts: same props, plain under reduced motion. */
export function InvoiceDetail(props: InvoiceDetailProps) {
  return (
    <MotionParts>
      <PlainInvoiceDetail {...props} />
    </MotionParts>
  );
}
