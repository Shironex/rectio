import { Menu } from '@base-ui/react/menu';
import { DotsThreeIcon, type Icon } from '@phosphor-icons/react';
import { cn, usePortalContainer } from '@rectio/ui';
import type { ReactNode } from 'react';

import { focusRing, popupItem, popupMotion, popupSurface, touchTarget } from './styles';

export interface MenuAction {
  id: string;
  label: string;
  icon?: Icon;
  /** Drawn in the negative tone and set apart below a separator: remove, revoke, delete. */
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface ActionMenuProps {
  /** Names the trigger, such as "Actions for Ines Duarte". */
  label: string;
  actions: readonly MenuAction[];
  /** Replaces the three-dot icon trigger with your own content (still a button). */
  trigger?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * The actions of one row behind a three-dot button: arrow keys move, Enter picks, Escape closes
 * and focus returns to the trigger. Destructive actions sit last, after a separator. The
 * block-local piece stands in for a shared Menu component.
 */
export function ActionMenu({ label, actions, trigger, align = 'end', className }: ActionMenuProps) {
  const container = usePortalContainer();
  const safe = actions.filter((action) => action.danger !== true);
  const danger = actions.filter((action) => action.danger === true);
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={trigger === undefined ? label : undefined}
        className={cn(
          'relative inline-flex h-(--rx-button-height-sm) min-w-(--rx-button-height-sm) shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-(--rx-button-radius) px-1.5',
          'text-sm text-fg-muted transition-colors duration-fast ease-standard',
          'hover:bg-surface-hover hover:text-fg data-popup-open:bg-surface-hover data-popup-open:text-fg',
          focusRing,
          touchTarget,
          className,
        )}
      >
        {trigger ?? <DotsThreeIcon aria-hidden weight="bold" className="size-4" />}
      </Menu.Trigger>
      <Menu.Portal container={container}>
        <Menu.Positioner sideOffset={4} align={align} className="z-50 outline-none">
          <Menu.Popup className={cn('min-w-44 p-1', popupSurface, popupMotion)}>
            {safe.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
            {safe.length > 0 && danger.length > 0 && (
              <Menu.Separator className="mx-1 my-1 h-px bg-line" />
            )}
            {danger.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ActionItem({ action }: { action: MenuAction }) {
  const ActionIcon = action.icon;
  return (
    <Menu.Item
      disabled={action.disabled}
      onClick={action.onSelect}
      className={cn(
        popupItem,
        action.danger === true &&
          'text-negative-strong data-highlighted:bg-negative-subtle data-highlighted:text-negative-strong',
      )}
    >
      {ActionIcon !== undefined && (
        <ActionIcon aria-hidden weight="bold" className="size-4 shrink-0 opacity-80" />
      )}
      {action.label}
    </Menu.Item>
  );
}
