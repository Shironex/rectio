import { SaasMotionParts } from '../lib/saas-motion-parts';
import { SignIn as PlainSignIn, type SignInProps } from './sign-in';

export type { SignInProps };

/** SignIn with the motion parts: same props, plain under reduced motion. */
export function SignIn(props: SignInProps) {
  return (
    <SaasMotionParts>
      <PlainSignIn {...props} />
    </SaasMotionParts>
  );
}
