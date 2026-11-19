import { MenuContent as PlainMenuContent, cn, type MenuContentProps } from '@rectio/ui';
import { useRef, type ComponentProps, type ReactNode } from 'react';

import { REPLACES_POPUP_CSS, useAnchoredEntrance } from '../lib/anchored';
import { useGlidingHighlight } from '../lib/glide';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';

export type { MenuContentProps };

function MotionMenuPopup({
  open,
  ref,
  children,
  ...props
}: ComponentProps<'div'> & { open: boolean; children?: ReactNode }) {
  const node = useRef<HTMLDivElement | null>(null);
  useAnchoredEntrance(node, open);
  const highlight = useGlidingHighlight(node, open, 'menu-item');
  return (
    <div
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      {...props}
    >
      <span
        ref={highlight}
        aria-hidden
        data-part="highlight"
        className="pointer-events-none absolute inset-x-1 top-0 rounded-(--rx-field-radius) bg-accent-subtle opacity-0"
      />
      {children}
    </div>
  );
}

/**
 * MenuContent that springs out of its trigger, with one highlight that glides between rows as the
 * keyboard or pointer moves. Same props as the plain one, and the same rows (`MenuItem`,
 * `MenuCheckboxItem`, ...) from `@rectio/ui`. Under reduced motion it is the plain one.
 */
export function MenuContent({ className, ...props }: MenuContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainMenuContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainMenuContent
      {...props}
      data-motion=""
      data-glide=""
      className={cn('relative', REPLACES_POPUP_CSS, className)}
      render={(popupProps, state) => <MotionMenuPopup {...popupProps} open={state.open} />}
    />
  );
}

/** A submenu's list with the same motion. */
export function MenuSubContent({
  side = 'inline-end',
  sideOffset = 2,
  alignOffset = -5,
  ...props
}: MenuContentProps) {
  return <MenuContent side={side} sideOffset={sideOffset} alignOffset={alignOffset} {...props} />;
}
