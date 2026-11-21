import { Menu as BaseMenu } from '@base-ui/react/menu';
import { CaretRightIcon, CheckIcon, DotOutlineIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { ariaKeyShortcut, shortcutKeys, useIsMac } from '../kbd/shortcut';
import { cn } from '../lib/cn';
import { anchorRender } from '../link/link';
import { popoverSurface } from '../popover/popover';
import { popupMotion } from '../select/select';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };
type PositionerProps = ComponentProps<typeof BaseMenu.Positioner>;

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuSub = BaseMenu.SubmenuRoot;
export const MenuRadioGroup = BaseMenu.RadioGroup;

/** The popup of a menu, a submenu or a context menu. */
export const menuPopup = cn(
  'max-h-(--available-height) min-w-48 overflow-y-auto p-1',
  popoverSurface,
  popupMotion,
);

/** A row in a menu. Shared with the context menu and the motioned menu. */
export const menuItem = cn(
  'relative flex cursor-default items-center gap-2 scroll-my-1',
  'rounded-(--rx-field-radius) py-1.5 ps-2 pe-2 text-base text-fg outline-none select-none',
  'pointer-coarse:min-h-(--rx-field-height-touch)',
  'data-highlighted:bg-accent-subtle data-disabled:text-fg-disabled',
  // Under a popup with one gliding highlight of its own (the motion add-on), rows let it show.
  'in-data-glide:data-highlighted:bg-transparent',
  '[&_svg]:shrink-0',
);

export type MenuContentProps = WithClassName<ComponentProps<typeof BaseMenu.Popup>> & {
  side?: PositionerProps['side'];
  align?: PositionerProps['align'];
  sideOffset?: number;
  alignOffset?: number;
};

/**
 * The list of actions. Arrow keys move, typing a letter jumps to the item that starts with it,
 * Enter or Space activates and Escape closes, returning focus to the trigger.
 */
export function MenuContent({
  className,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
  alignOffset = 0,
  ...props
}: MenuContentProps) {
  const container = usePortalContainer();
  return (
    <BaseMenu.Portal container={container}>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={8}
        className="z-50 outline-none"
      >
        <BaseMenu.Popup data-slot="menu" className={cn(menuPopup, className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

/** A submenu's list: opens beside its trigger, aligned with the trigger's row. */
export function MenuSubContent({
  side = 'inline-end',
  sideOffset = 2,
  alignOffset = -5,
  ...props
}: MenuContentProps) {
  return <MenuContent side={side} sideOffset={sideOffset} alignOffset={alignOffset} {...props} />;
}

export interface MenuShortcutProps {
  /** Such as `mod+d`. Drawn for the user's platform and announced through `aria-keyshortcuts`. */
  shortcut: string;
  className?: string;
}

/** A shortcut hint at the end of a row. Use the `shortcut` prop of the item instead where you can. */
export function MenuShortcut({ shortcut, className }: MenuShortcutProps) {
  const mac = useIsMac();
  return (
    <span
      aria-hidden
      data-slot="menu-shortcut"
      className={cn(
        'ms-auto ps-4 text-sm tracking-normal text-fg-subtle in-data-highlighted:text-fg-muted',
        className,
      )}
    >
      {shortcutKeys(shortcut, mac).join(mac ? '' : '+')}
    </span>
  );
}

function useAriaShortcut(shortcut: string | undefined) {
  const mac = useIsMac();
  return shortcut === undefined ? undefined : ariaKeyShortcut(shortcut, mac);
}

export type MenuItemProps = WithClassName<ComponentProps<typeof BaseMenu.Item>> & {
  /** An icon before the label, 16px. */
  icon?: ReactNode;
  /** A shortcut hint at the end, such as `mod+d`. The menu does not bind it; the app does. */
  shortcut?: string;
  /** `danger` for an action that destroys or cannot be undone. */
  tone?: 'default' | 'danger';
};

export function MenuItem({ className, icon, shortcut, tone, children, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      data-slot="menu-item"
      data-tone={tone === 'danger' ? 'danger' : undefined}
      aria-keyshortcuts={useAriaShortcut(shortcut)}
      className={cn(
        menuItem,
        tone === 'danger' &&
          'text-negative-strong data-highlighted:bg-negative-subtle data-highlighted:text-negative-strong',
        className,
      )}
      {...props}
    >
      {icon !== undefined && (
        <span aria-hidden className="flex size-4 items-center justify-center text-fg-subtle">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut !== undefined && <MenuShortcut shortcut={shortcut} />}
    </BaseMenu.Item>
  );
}

export type MenuLinkItemProps = WithClassName<ComponentProps<typeof BaseMenu.LinkItem>> & {
  icon?: ReactNode;
  /** A count or note at the end of the row, such as items waiting. */
  hint?: ReactNode;
};

/**
 * A row that navigates. With an `href` it renders the kit's `Anchor`, so it follows a
 * `LinkProvider`; pass `render` for a link of your own.
 */
export function MenuLinkItem({
  className,
  icon,
  hint,
  children,
  render,
  ...props
}: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem
      data-slot="menu-item"
      className={cn(menuItem, 'cursor-pointer', className)}
      {...anchorRender(render, props.href)}
      {...props}
    >
      {icon !== undefined && (
        <span aria-hidden className="flex size-4 items-center justify-center text-fg-subtle">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint !== undefined && (
        <span className="ms-auto ps-4 text-sm text-fg-subtle numeric">{hint}</span>
      )}
    </BaseMenu.LinkItem>
  );
}

export type MenuCheckboxItemProps = WithClassName<ComponentProps<typeof BaseMenu.CheckboxItem>> & {
  shortcut?: string;
};

/** A setting that is on or off, such as a visible column. Stays open when toggled. */
export function MenuCheckboxItem({
  className,
  shortcut,
  children,
  closeOnClick = false,
  ...props
}: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      data-slot="menu-item"
      closeOnClick={closeOnClick}
      aria-keyshortcuts={useAriaShortcut(shortcut)}
      className={cn(menuItem, className)}
      {...props}
    >
      <span className="flex size-4 items-center justify-center">
        <BaseMenu.CheckboxItemIndicator className="flex text-accent-strong">
          <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut !== undefined && <MenuShortcut shortcut={shortcut} />}
    </BaseMenu.CheckboxItem>
  );
}

export type MenuRadioItemProps = WithClassName<ComponentProps<typeof BaseMenu.RadioItem>>;

/** One choice of a `MenuRadioGroup`, such as a sort order. Stays open when chosen. */
export function MenuRadioItem({
  className,
  children,
  closeOnClick = false,
  ...props
}: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem
      data-slot="menu-item"
      closeOnClick={closeOnClick}
      className={cn(menuItem, className)}
      {...props}
    >
      <span className="flex size-4 items-center justify-center">
        <BaseMenu.RadioItemIndicator className="flex text-accent-strong">
          <DotOutlineIcon aria-hidden weight="fill" className="size-5" />
        </BaseMenu.RadioItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </BaseMenu.RadioItem>
  );
}

export type MenuSubTriggerProps = WithClassName<ComponentProps<typeof BaseMenu.SubmenuTrigger>> & {
  icon?: ReactNode;
};

/** The row that opens a submenu: on hover, ArrowRight, Enter or Space. ArrowLeft comes back. */
export function MenuSubTrigger({ className, icon, children, ...props }: MenuSubTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      data-slot="menu-item"
      className={cn(menuItem, 'data-popup-open:bg-surface-hover', className)}
      {...props}
    >
      {icon !== undefined && (
        <span aria-hidden className="flex size-4 items-center justify-center text-fg-subtle">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <CaretRightIcon
        aria-hidden
        weight="bold"
        className="size-3.5 text-fg-subtle rtl:rotate-180"
      />
    </BaseMenu.SubmenuTrigger>
  );
}

export type MenuGroupProps = WithClassName<ComponentProps<typeof BaseMenu.Group>> & {
  /** Names the group for everyone: drawn above it and announced with it. */
  label?: ReactNode;
};

export function MenuGroup({ className, label, children, ...props }: MenuGroupProps) {
  return (
    <BaseMenu.Group className={cn('not-first:mt-1', className)} {...props}>
      {label !== undefined && <MenuLabel>{label}</MenuLabel>}
      {children}
    </BaseMenu.Group>
  );
}

export type MenuLabelProps = WithClassName<ComponentProps<typeof BaseMenu.GroupLabel>>;

/** A group's heading. Inside a `MenuGroup` or `MenuRadioGroup`. */
export function MenuLabel({ className, ...props }: MenuLabelProps) {
  return (
    <BaseMenu.GroupLabel
      className={cn(
        'px-2 pt-2 pb-1 text-xs font-medium tracking-caps text-fg-subtle uppercase select-none',
        className,
      )}
      {...props}
    />
  );
}

export type MenuSeparatorProps = WithClassName<ComponentProps<typeof BaseMenu.Separator>>;

export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return <BaseMenu.Separator className={cn('-mx-1 my-1 h-px bg-line', className)} {...props} />;
}
