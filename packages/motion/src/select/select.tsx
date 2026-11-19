import {
  SelectContent as PlainSelectContent,
  SelectItem as PlainSelectItem,
  cn,
  type SelectContentProps,
  type SelectItemProps,
} from '@rectio/ui';

import { usePlainMotion } from '../lib/mode';
import { GLIDING_ITEM, MotionPopup, REPLACES_CSS_MOTION } from '../lib/popup';

export type { SelectContentProps, SelectItemProps };

/**
 * SelectContent with a spring entrance from its trigger (Base UI's `--transform-origin`), a fast
 * fade on close and a highlight that glides under the pointer. Same props as the plain one.
 */
export function SelectContent({ className, ...props }: SelectContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainSelectContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainSelectContent
      {...props}
      data-motion=""
      className={cn(REPLACES_CSS_MOTION, className)}
      render={(popupProps, state) => (
        <MotionPopup {...popupProps} state={state} itemSlot="select-item" />
      )}
    />
  );
}

/**
 * SelectItem that lets the list's gliding highlight show through. Use it with the motioned
 * SelectContent; under reduced motion it is the plain item with its own highlight.
 */
export function SelectItem({ className, ...props }: SelectItemProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainSelectItem {...props} {...(className === undefined ? {} : { className })} />;
  return <PlainSelectItem {...props} className={cn(GLIDING_ITEM, className)} />;
}
