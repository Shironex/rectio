import { DotsThreeIcon, type Icon } from '@phosphor-icons/react';
import {
  cn,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  touchHitArea,
} from '@rectio/ui';
import type { ReactNode } from 'react';

import { focusRing } from './styles';

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
  /**
   * Replaces the three-dot icon trigger with your own content (still a button). It must carry
   * visible text, which then names the button; `label` names only the icon trigger.
   */
  trigger?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * The actions of one row behind a three-dot button, on the shared Menu: arrow keys move, Enter
 * picks, Escape closes and focus returns to the trigger. Destructive actions sit last, after a
 * separator.
 */
export function ActionMenu({ label, actions, trigger, align = 'end', className }: ActionMenuProps) {
  const safe = actions.filter((action) => action.danger !== true);
  const danger = actions.filter((action) => action.danger === true);
  return (
    <Menu>
      <MenuTrigger
        // The row's own control: focus lands here when a neighbouring row is removed.
        data-row-focus
        aria-label={trigger === undefined ? label : undefined}
        className={cn(
          'relative inline-flex h-(--rx-button-height-sm) min-w-(--rx-button-height-sm) shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-(--rx-button-radius) px-1.5',
          'text-sm text-fg-muted transition-colors duration-fast ease-standard',
          'hover:bg-surface-hover hover:text-fg data-popup-open:bg-surface-hover data-popup-open:text-fg',
          focusRing,
          touchHitArea,
          className,
        )}
      >
        {trigger ?? <DotsThreeIcon aria-hidden weight="bold" className="size-4" />}
      </MenuTrigger>
      <MenuContent align={align} sideOffset={4} className="min-w-44">
        {safe.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
        {safe.length > 0 && danger.length > 0 && <MenuSeparator />}
        {danger.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </MenuContent>
    </Menu>
  );
}

function ActionItem({ action }: { action: MenuAction }) {
  const ActionIcon = action.icon;
  const danger = action.danger === true;
  return (
    <MenuItem
      disabled={action.disabled}
      onClick={action.onSelect}
      tone={danger ? 'danger' : 'default'}
      className="text-sm"
      {...(ActionIcon === undefined
        ? {}
        : { icon: <ActionIcon aria-hidden weight="bold" className="size-4" /> })}
    >
      {action.label}
    </MenuItem>
  );
}
