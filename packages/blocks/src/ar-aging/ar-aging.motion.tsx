import { MotionParts } from '../lib/motion-parts';
import { ArAging as PlainArAging, type ArAgingProps } from './ar-aging';

export type { ArAgingProps };

/** ArAging with the motion parts: same props, plain under reduced motion. */
export function ArAging(props: ArAgingProps) {
  return (
    <MotionParts>
      <PlainArAging {...props} />
    </MotionParts>
  );
}
