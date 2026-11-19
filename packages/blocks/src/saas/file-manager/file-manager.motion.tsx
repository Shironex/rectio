import { SaasMotionParts } from '../lib/saas-motion-parts';
import { FileManager as PlainFileManager, type FileManagerProps } from './file-manager';

export type { FileManagerProps };

/** FileManager with the motion parts: same props, plain under reduced motion. */
export function FileManager(props: FileManagerProps) {
  return (
    <SaasMotionParts>
      <PlainFileManager {...props} />
    </SaasMotionParts>
  );
}
