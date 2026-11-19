import {
  ComboboxContent as PlainComboboxContent,
  ComboboxItem as PlainComboboxItem,
  cn,
  type ComboboxContentProps,
  type ComboboxItemProps,
} from '@rectio/ui';

import { usePlainMotion } from '../lib/mode';
import { GLIDING_ITEM, MotionPopup, REPLACES_CSS_MOTION } from '../lib/popup';

export type { ComboboxContentProps, ComboboxItemProps };

/**
 * ComboboxContent with the Select list's motion: a spring out of the input and a highlight that
 * glides between options. Typing never animates: the list filters in place under the caret.
 * Same props as the plain one.
 */
export function ComboboxContent({ className, ...props }: ComboboxContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainComboboxContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainComboboxContent
      {...props}
      data-motion=""
      className={cn(REPLACES_CSS_MOTION, className)}
      render={(popupProps, state) => (
        <MotionPopup {...popupProps} state={state} itemSlot="combobox-item" />
      )}
    />
  );
}

/** ComboboxItem that lets the gliding highlight show through. Use with the motioned content. */
export function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainComboboxItem {...props} {...(className === undefined ? {} : { className })} />;
  return <PlainComboboxItem {...props} className={cn(GLIDING_ITEM, className)} />;
}
