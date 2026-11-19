import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';
import { menuPopup } from '../menu/menu';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export const ContextMenu = BaseContextMenu.Root;

export type ContextMenuTriggerProps = WithClassName<ComponentProps<typeof BaseContextMenu.Trigger>>;

/**
 * The area that opens the menu on right click or long press. A context menu is a shortcut, never
 * the only way to an action: put the same actions in a visible menu button too.
 */
export function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps) {
  return (
    <BaseContextMenu.Trigger
      data-slot="context-menu-trigger"
      className={cn('select-none', className)}
      {...props}
    />
  );
}

export type ContextMenuContentProps = WithClassName<ComponentProps<typeof BaseContextMenu.Popup>>;

/**
 * Opens at the pointer. Fill it with the menu parts (`MenuItem`, `MenuCheckboxItem`,
 * `MenuRadioGroup`, `MenuSub`, `MenuSeparator`, `MenuGroup`): they work in both.
 */
export function ContextMenuContent({ className, ...props }: ContextMenuContentProps) {
  const container = usePortalContainer();
  return (
    <BaseContextMenu.Portal container={container}>
      <BaseContextMenu.Positioner collisionPadding={8} className="z-50 outline-none">
        <BaseContextMenu.Popup
          data-slot="context-menu"
          className={cn(menuPopup, className)}
          {...props}
        />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
