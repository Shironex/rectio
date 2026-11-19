import { SaasMotionParts } from '../lib/saas-motion-parts';
import { ResetPassword as PlainResetPassword, type ResetPasswordProps } from './reset-password';

export type { ResetPasswordProps };

/** ResetPassword with the motion parts: same props, plain under reduced motion. */
export function ResetPassword(props: ResetPasswordProps) {
  return (
    <SaasMotionParts>
      <PlainResetPassword {...props} />
    </SaasMotionParts>
  );
}
