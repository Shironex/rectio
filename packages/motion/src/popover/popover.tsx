import { PopoverContent as PlainPopoverContent, cn, type PopoverContentProps } from '@rectio/ui';

import { AnchoredPopup, REPLACES_POPUP_CSS } from '../lib/anchored';
import { usePlainMotion } from '../lib/mode';

export type { PopoverContentProps };

/**
 * PopoverContent that springs out of the side it opens from and fades away. Same props as the plain
 * one; under reduced motion it is the plain one.
 */
export function PopoverContent({ className, ...props }: PopoverContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainPopoverContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainPopoverContent
      {...props}
      data-motion=""
      className={cn(REPLACES_POPUP_CSS, className)}
      render={(popupProps, state) => <AnchoredPopup {...popupProps} open={state.open} />}
    />
  );
}
