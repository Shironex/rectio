import { SaasMotionParts } from '../lib/saas-motion-parts';
import { ApiKeys as PlainApiKeys, type ApiKeysProps } from './api-keys';

export type { ApiKeysProps };

/** ApiKeys with the motion parts: same props, plain under reduced motion. */
export function ApiKeys(props: ApiKeysProps) {
  return (
    <SaasMotionParts>
      <PlainApiKeys {...props} />
    </SaasMotionParts>
  );
}
