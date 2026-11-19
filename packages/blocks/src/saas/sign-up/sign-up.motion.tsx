import { SaasMotionParts } from '../lib/saas-motion-parts';
import { SignUp as PlainSignUp, type SignUpProps } from './sign-up';

export type { SignUpProps };

/** SignUp with the motion parts: same props, plain under reduced motion. */
export function SignUp(props: SignUpProps) {
  return (
    <SaasMotionParts>
      <PlainSignUp {...props} />
    </SaasMotionParts>
  );
}
