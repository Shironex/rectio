import {
  HoverCardContent as PlainHoverCardContent,
  cn,
  type HoverCardContentProps,
} from '@rectio/ui';

import { AnchoredPopup, REPLACES_POPUP_CSS } from '../lib/anchored';
import { usePlainMotion } from '../lib/mode';

export type { HoverCardContentProps };

/**
 * HoverCardContent that springs out of the link it previews and fades away. Same props as the plain
 * one; under reduced motion it is the plain one.
 */
export function HoverCardContent({ className, ...props }: HoverCardContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainHoverCardContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainHoverCardContent
      {...props}
      data-motion=""
      className={cn(REPLACES_POPUP_CSS, className)}
      render={(popupProps, state) => <AnchoredPopup {...popupProps} open={state.open} />}
    />
  );
}
