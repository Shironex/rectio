import { SaasMotionParts } from '../lib/saas-motion-parts';
import { TwoFactor as PlainTwoFactor, type TwoFactorProps } from './two-factor';

export type { TwoFactorProps };

/** TwoFactor with the motion parts: same props, plain under reduced motion. */
export function TwoFactor(props: TwoFactorProps) {
  return (
    <SaasMotionParts>
      <PlainTwoFactor {...props} />
    </SaasMotionParts>
  );
}
