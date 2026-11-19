import { Select as BaseSelect } from '@base-ui/react/select';
import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { controlFocus, controlSurface } from '../field/field';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** Shared by Select popups and future menus: enters from the trigger, leaves as a fade. */
export const popupMotion = cn(
  'origin-(--transform-origin) transition-[opacity,scale,translate] ease-enter duration-base',
  'data-starting-style:scale-(--rx-motion-scale-from) data-starting-style:opacity-0',
  'data-starting-style:-translate-y-(--rx-motion-distance-shift)',
  'data-ending-style:opacity-0 data-ending-style:ease-exit data-ending-style:duration-fast',
);

/**
 * The surface of a list popup: Select, Combobox and Multi select share it, so every list in a
 * theme scope reads as the same object.
 */
export const popupSurface = cn(
  'rounded-(--rx-popover-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-popover-shadow)',
  'outline-none',
);

/** One option row in a list popup, highlighted by keyboard or pointer, check mark on the left. */
export const popupItem = cn(
  'flex cursor-default scroll-my-1 items-center gap-2',
  'rounded-(--rx-field-radius) py-1.5 ps-2 pe-3 text-base outline-none select-none',
  'pointer-coarse:min-h-(--rx-field-height-touch)',
  'data-highlighted:bg-accent-subtle data-highlighted:text-fg data-selected:font-medium',
  'data-disabled:text-fg-disabled',
);

/** The small caps heading of a group of options. */
export const popupGroupLabel =
  'px-2 pt-2 pb-1 text-xs font-medium tracking-caps text-fg-subtle uppercase';

export const Select = BaseSelect.Root;

export type SelectTriggerProps = WithClassName<ComponentProps<typeof BaseSelect.Trigger>> & {
  placeholder?: ReactNode;
};

/** The closed control. Shows the selected item's label, or the placeholder. */
export function SelectTrigger({ className, placeholder, children, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      data-slot="select-trigger"
      className={cn(
        controlSurface,
        controlFocus,
        'flex cursor-pointer items-center justify-between gap-2 px-(--rx-field-padding-x) text-start',
        // While the list is open the user is fixing the field: show it neutral, not still wrong.
        'data-popup-open:border-fg-subtle data-popup-open:data-invalid:border-fg-subtle data-popup-open:data-invalid:ring-0',
        className,
      )}
      {...props}
    >
      {children ?? (
        <BaseSelect.Value
          placeholder={placeholder}
          className="truncate data-placeholder:text-fg-subtle"
        />
      )}
      <BaseSelect.Icon className="flex shrink-0 text-fg-subtle">
        <CaretUpDownIcon aria-hidden weight="bold" className="size-3.5" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export type SelectContentProps = WithClassName<ComponentProps<typeof BaseSelect.Popup>> & {
  /** Set false to open the list below the trigger instead of over the selected item. */
  alignItemWithTrigger?: boolean;
};

/** The list. Portals into the nearest ThemeScope so it keeps that scope's tokens. */
export function SelectContent({
  className,
  children,
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  const container = usePortalContainer();
  return (
    <BaseSelect.Portal container={container}>
      <BaseSelect.Positioner
        alignItemWithTrigger={alignItemWithTrigger}
        sideOffset={6}
        className="z-50 outline-none"
      >
        <BaseSelect.Popup
          data-slot="select-content"
          className={cn(
            'max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto p-1',
            popupSurface,
            popupMotion,
            className,
          )}
          {...props}
        >
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export type SelectItemProps = WithClassName<ComponentProps<typeof BaseSelect.Item>> & {
  /** Secondary text on the right, such as a code or a count. */
  hint?: ReactNode;
};

export function SelectItem({ className, children, hint, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item data-slot="select-item" className={cn(popupItem, className)} {...props}>
      <span className="flex size-4 shrink-0 items-center justify-center">
        <BaseSelect.ItemIndicator className="flex text-accent-strong">
          <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText className="min-w-0 flex-1 truncate">{children}</BaseSelect.ItemText>
      {hint !== undefined && <span className="text-sm text-fg-subtle numeric">{hint}</span>}
    </BaseSelect.Item>
  );
}

export type SelectGroupProps = WithClassName<ComponentProps<typeof BaseSelect.Group>> & {
  label: ReactNode;
};

export function SelectGroup({ className, label, children, ...props }: SelectGroupProps) {
  return (
    <BaseSelect.Group className={cn('not-first:mt-1', className)} {...props}>
      <BaseSelect.GroupLabel className={popupGroupLabel}>{label}</BaseSelect.GroupLabel>
      {children}
    </BaseSelect.Group>
  );
}
