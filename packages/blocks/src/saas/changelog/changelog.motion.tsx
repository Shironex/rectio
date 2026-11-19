import { SaasMotionParts } from '../lib/saas-motion-parts';
import { Changelog as PlainChangelog, type ChangelogProps } from './changelog';

export type { ChangelogProps };

/** Changelog with the motion parts: same props, plain under reduced motion. */
export function Changelog(props: ChangelogProps) {
  return (
    <SaasMotionParts>
      <PlainChangelog {...props} />
    </SaasMotionParts>
  );
}
