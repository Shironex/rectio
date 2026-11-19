import { MotionParts } from '../lib/motion-parts';
import { InvoiceList as PlainInvoiceList, type InvoiceListProps } from './invoice-list';

export type { InvoiceListProps };

/** InvoiceList with the motion parts: same props, plain under reduced motion. */
export function InvoiceList(props: InvoiceListProps) {
  return (
    <MotionParts>
      <PlainInvoiceList {...props} />
    </MotionParts>
  );
}
