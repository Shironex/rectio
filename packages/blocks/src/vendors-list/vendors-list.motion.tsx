import { MotionParts } from '../lib/motion-parts';
import { VendorsList as PlainVendorsList, type VendorsListProps } from './vendors-list';

export type { VendorsListProps };

/** VendorsList with the motion parts: same props, plain under reduced motion. */
export function VendorsList(props: VendorsListProps) {
  return (
    <MotionParts>
      <PlainVendorsList {...props} />
    </MotionParts>
  );
}
