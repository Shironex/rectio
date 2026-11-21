import {
  AlertDialogContent as PlainAlertDialogContent,
  cn,
  type AlertDialogContentProps,
} from '@rectio/ui';

import { MotionPopup, REPLACES_CSS_MOTION } from '../dialog/dialog';
import { usePlainMotion } from '../lib/mode';

export type { AlertDialogContentProps };

/**
 * AlertDialogContent that opens centred on the dialog's short spring and closes on a faster tween,
 * interruptible like the motion Dialog. Same props as the plain one; under reduced motion it is
 * the plain one (a fade in place). The other parts are the plain ones.
 */
export function AlertDialogContent({ className, ...props }: AlertDialogContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return (
      <PlainAlertDialogContent {...props} {...(className === undefined ? {} : { className })} />
    );
  return (
    <PlainAlertDialogContent
      {...props}
      data-motion=""
      className={cn(REPLACES_CSS_MOTION, className)}
      render={(popupProps, state) => <MotionPopup {...popupProps} state={state} />}
    />
  );
}
