import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
  CaretUpDownIcon,
  CheckIcon,
  CircleNotchIcon,
  MinusIcon,
  XIcon,
} from '@phosphor-icons/react';
import { createContext, use, useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { comboboxIconButton, comboboxSurface } from '../combobox/combobox';
import { cn } from '../lib/cn';
import { popupGroupLabel, popupItem, popupMotion, popupSurface } from '../select/select';
import { Tag, tagRemoveButton } from '../tag-input/tag-input';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** Marks the "Select all" option the multi select adds at the top of the list. */
const SELECT_ALL = Symbol('rectio.multi-select.all');

interface SelectAllOption {
  [SELECT_ALL]: true;
  value: string;
  label: string;
}

const SELECT_ALL_OPTION: SelectAllOption = {
  [SELECT_ALL]: true,
  value: 'rectio:select-all',
  label: 'Select all',
};

function isSelectAll(item: unknown): item is SelectAllOption {
  return typeof item === 'object' && item !== null && SELECT_ALL in item;
}

/** Label of an item the way Base UI reads it: `label` on `{ value, label }` objects, else text. */
function defaultLabel(item: unknown): string {
  if (typeof item === 'object' && item !== null && 'label' in item) {
    const { label } = item;
    if (typeof label === 'string') return label;
  }
  return typeof item === 'string' || typeof item === 'number' ? String(item) : '';
}

/** A stable key for an item: its `value` on `{ value, label }` objects, else its label. */
function defaultKey(item: unknown, label: string): string {
  if (typeof item === 'object' && item !== null && 'value' in item) {
    const { value } = item;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return label;
}

interface MultiSelectContextValue {
  labelOf: (item: unknown) => string;
  keyOf: (item: unknown) => string;
  allSelected: boolean;
  someSelected: boolean;
  selectAllLabel: string;
  clearAllLabel: string;
}

const MultiSelectContext = createContext<MultiSelectContextValue>({
  labelOf: defaultLabel,
  keyOf: (item) => defaultKey(item, defaultLabel(item)),
  allSelected: false,
  someSelected: false,
  selectAllLabel: 'Select all',
  clearAllLabel: 'Clear all',
});

export type MultiSelectProps<Value> = Omit<BaseCombobox.Root.Props<Value, true>, 'multiple'> & {
  /**
   * Adds a "Select all" option at the top of the list while nothing is typed. Once every item is
   * chosen it reads "Clear all" and empties the selection. Works with a flat list of items.
   */
  selectAll?: boolean;
  selectAllLabel?: string;
  clearAllLabel?: string;
  /**
   * Close the list after each pick. Off by default: the list stays open, with the typed filter, so
   * several matches can be picked in a row.
   */
  closeOnSelect?: boolean;
};

/**
 * Several choices from a list, shown as removable chips in the field: approvers, cost centres,
 * notification channels. Base UI's Combobox in multiple mode with a search input among the chips,
 * checkbox indicators in the list and an optional "Select all". Wrap it in a Field.
 */
export function MultiSelect<Value>({
  items,
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  filter,
  itemToStringLabel,
  isItemEqualToValue,
  selectAll = false,
  selectAllLabel = 'Select all',
  clearAllLabel = 'Clear all',
  closeOnSelect = false,
  locale,
  children,
  ...props
}: MultiSelectProps<Value>) {
  const [uncontrolled, setUncontrolled] = useState<readonly Value[]>(defaultValue ?? []);
  const selected = value ?? uncontrolled;
  const { contains } = BaseCombobox.useFilter({ multiple: true, locale });

  const labelOf = (item: unknown) =>
    itemToStringLabel === undefined ? defaultLabel(item) : itemToStringLabel(item as Value);
  const equal = (a: Value, b: Value) =>
    isItemEqualToValue === undefined ? Object.is(a, b) : isItemEqualToValue(a, b);
  const list = Array.isArray(items) ? (items as readonly Value[]) : null;
  const choosable = list ?? [];
  const isChosen = (item: Value) => selected.some((chosen) => equal(item, chosen));
  const allSelected = choosable.length > 0 && choosable.every(isChosen);
  const someSelected = !allSelected && selected.length > 0;
  const shown: typeof items = selectAll && list !== null ? [SELECT_ALL_OPTION, ...list] : items;

  const commit = (next: Value[], details: BaseCombobox.Root.ChangeEventDetails) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next, details);
  };

  // "Select all" is an option only while nothing is typed: a filtered list says what matched.
  const wrappedFilter: MultiSelectProps<Value>['filter'] = (item, text, toString) => {
    if (isSelectAll(item)) return text.trim() === '';
    if (filter === null) return true;
    return (filter ?? contains)(item, text, toString);
  };

  const context: MultiSelectContextValue = {
    labelOf,
    keyOf: (item) => defaultKey(item, labelOf(item)),
    allSelected,
    someSelected,
    selectAllLabel,
    clearAllLabel,
  };

  return (
    <MultiSelectContext value={context}>
      <BaseCombobox.Root<Value, true>
        {...props}
        multiple
        locale={locale}
        items={shown}
        value={selected}
        filter={wrappedFilter}
        itemToStringLabel={(item) => (isSelectAll(item) ? item.label : labelOf(item))}
        isItemEqualToValue={(a, b) => (isSelectAll(a) || isSelectAll(b) ? a === b : equal(a, b))}
        onOpenChange={(open, details) => {
          if (!open && !closeOnSelect && details.reason === 'item-press') details.cancel();
          onOpenChange?.(open, details);
        }}
        onValueChange={(next, details) => {
          if (next.some(isSelectAll)) {
            commit(
              allSelected ? [] : [...selected, ...choosable.filter((i) => !isChosen(i))],
              details,
            );
            return;
          }
          commit(next, details);
        }}
      >
        {children}
      </BaseCombobox.Root>
    </MultiSelectContext>
  );
}

export type MultiSelectInputProps = WithClassName<ComponentProps<typeof BaseCombobox.Input>> & {
  /**
   * At rest, show this many chips and a "+N" chip for the rest, so the field keeps one line. All
   * chips show while the field has focus, so every one can be reached and removed.
   */
  maxChips?: number;
  /** Shows a button that clears every choice. */
  showClear?: boolean;
  clearLabel?: string;
  triggerLabel?: string;
  /** Accessible name of the overflow chip. Defaults to "3 more selected". */
  overflowLabel?: (count: number) => string;
};

/**
 * The field: one chip per choice, then the search input. Arrow Left from the start of the input
 * walks into the chips; Backspace or Delete removes the chip in focus, and Backspace in the empty
 * input removes the last one.
 */
export function MultiSelectInput({
  className,
  placeholder,
  maxChips,
  showClear = true,
  clearLabel = 'Clear all',
  triggerLabel = 'Show options',
  overflowLabel = (count) => `${count} more selected`,
  ...props
}: MultiSelectInputProps) {
  const { labelOf, keyOf } = use(MultiSelectContext);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <BaseCombobox.InputGroup
      data-slot="multi-select-input"
      className={cn(
        comboboxSurface,
        'flex h-auto min-h-(--rx-field-height) cursor-text items-center gap-1 py-0.5 ps-1 pe-0.5',
        'pointer-coarse:h-auto pointer-coarse:min-h-(--rx-field-height-touch)',
        className,
      )}
      onFocus={() => {
        setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <BaseCombobox.Value>
        {(value: unknown[]) => {
          const collapsed = maxChips !== undefined && !focused && value.length > maxChips;
          const visible = collapsed ? value.slice(0, maxChips) : value;
          const hidden = value.length - visible.length;
          return (
            <BaseCombobox.Chips
              data-slot="multi-select-chips"
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1 pointer-coarse:gap-x-3"
            >
              {visible.map((item) => {
                const label = labelOf(item);
                return (
                  <BaseCombobox.Chip
                    key={keyOf(item)}
                    data-slot="multi-select-chip"
                    render={(chipProps) => (
                      <Tag
                        {...chipProps}
                        action={
                          <BaseCombobox.ChipRemove
                            aria-label={`Remove ${label}`}
                            className={tagRemoveButton}
                          >
                            <XIcon aria-hidden weight="bold" className="size-3" />
                          </BaseCombobox.ChipRemove>
                        }
                      />
                    )}
                  >
                    {label}
                  </BaseCombobox.Chip>
                );
              })}
              {hidden > 0 && (
                <button
                  type="button"
                  tabIndex={-1}
                  data-slot="multi-select-overflow"
                  aria-label={overflowLabel(hidden)}
                  className={cn(
                    'inline-flex h-6 shrink-0 cursor-pointer items-center px-1.5 numeric',
                    'rounded-(--rx-badge-radius) border border-line bg-surface text-sm text-fg-muted',
                    'hover:border-line-strong hover:text-fg',
                  )}
                  // Keep focus off the chip itself: it disappears as the field takes focus.
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => inputRef.current?.focus()}
                >
                  +{hidden}
                </button>
              )}
              <BaseCombobox.Input
                ref={inputRef}
                placeholder={value.length === 0 ? placeholder : undefined}
                className={cn(
                  'h-6 min-w-16 flex-1 bg-transparent ps-1 text-base text-fg outline-none placeholder:text-fg-subtle',
                  'pointer-coarse:h-9',
                  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
                )}
                {...props}
              />
            </BaseCombobox.Chips>
          );
        }}
      </BaseCombobox.Value>
      {showClear && (
        <BaseCombobox.Clear aria-label={clearLabel} className={comboboxIconButton}>
          <XIcon aria-hidden weight="bold" className="size-3.5" />
        </BaseCombobox.Clear>
      )}
      <BaseCombobox.Trigger aria-label={triggerLabel} className={comboboxIconButton}>
        <CaretUpDownIcon aria-hidden weight="bold" className="size-3.5" />
      </BaseCombobox.Trigger>
    </BaseCombobox.InputGroup>
  );
}

type ListChildren = ReactNode | ((item: never, index: number) => ReactNode);

export type MultiSelectContentProps = WithClassName<
  Omit<ComponentProps<typeof BaseCombobox.Popup>, 'children'>
> & {
  /** One `MultiSelectItem` per item, usually as a function of the item. */
  children?: ListChildren;
  emptyMessage?: ReactNode;
  /** Results are on their way: shows `loadingMessage` and marks the list busy. */
  loading?: boolean;
  loadingMessage?: ReactNode;
};

const listNote = 'flex items-center gap-2 px-2 py-1.5 text-sm text-fg-subtle';

/** The list, portalled into the nearest ThemeScope like SelectContent. */
export function MultiSelectContent({
  className,
  children,
  emptyMessage = 'No results',
  loading = false,
  loadingMessage = 'Searching…',
  ...props
}: MultiSelectContentProps) {
  const container = usePortalContainer();
  const render =
    typeof children === 'function'
      ? (item: unknown, index: number) =>
          isSelectAll(item) ? (
            <SelectAllItem key={item.value} option={item} />
          ) : (
            (children as (item: unknown, index: number) => ReactNode)(item, index)
          )
      : children;
  return (
    <BaseCombobox.Portal container={container}>
      <BaseCombobox.Positioner sideOffset={6} className="z-50 outline-none">
        <BaseCombobox.Popup
          data-slot="multi-select-content"
          aria-busy={loading || undefined}
          className={cn(
            'max-h-(--available-height) max-w-(--available-width) min-w-(--anchor-width)',
            'overflow-y-auto overscroll-contain p-1',
            popupSurface,
            popupMotion,
            className,
          )}
          {...props}
        >
          <BaseCombobox.Status>
            {loading ? (
              <div className={listNote}>
                <CircleNotchIcon aria-hidden weight="bold" className="size-3.5 animate-spin" />
                {loadingMessage}
              </div>
            ) : null}
          </BaseCombobox.Status>
          <BaseCombobox.Empty>
            {loading ? null : <div className={listNote}>{emptyMessage}</div>}
          </BaseCombobox.Empty>
          <BaseCombobox.List>{render}</BaseCombobox.List>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

/** A checkbox drawn in the list: a box that fills when chosen, a bar when partly chosen. */
function CheckBox({ state }: { state: 'on' | 'off' | 'mixed' }) {
  return (
    <span
      aria-hidden
      data-state={state}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-(--rx-badge-radius) border',
        'border-(--rx-field-border) bg-(--rx-field-background) text-accent-contrast',
        'transition-[background-color,border-color] duration-fast ease-standard',
        'data-[state=on]:border-accent data-[state=on]:bg-accent',
        'data-[state=mixed]:border-accent data-[state=mixed]:bg-accent',
      )}
    >
      {state === 'on' && <CheckIcon weight="bold" className="size-3" />}
      {state === 'mixed' && <MinusIcon weight="bold" className="size-3" />}
    </span>
  );
}

export type MultiSelectItemProps = WithClassName<ComponentProps<typeof BaseCombobox.Item>> & {
  /** Secondary text on the right, such as a code or a count. */
  hint?: ReactNode;
};

/** One option with a checkbox: pressing it adds or removes the item and keeps the list open. */
export function MultiSelectItem({ className, children, hint, ...props }: MultiSelectItemProps) {
  return (
    <BaseCombobox.Item
      data-slot="multi-select-item"
      className={cn(popupItem, 'data-selected:font-regular', className)}
      render={(itemProps, state) => (
        <div {...itemProps}>
          <CheckBox state={state.selected ? 'on' : 'off'} />
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {hint !== undefined && <span className="text-sm text-fg-subtle numeric">{hint}</span>}
        </div>
      )}
      {...props}
    />
  );
}

/** "Select all", or "Clear all" once everything is chosen, with a box for the overall state. */
function SelectAllItem({ option }: { option: SelectAllOption }) {
  const { allSelected, someSelected, selectAllLabel, clearAllLabel } = use(MultiSelectContext);
  return (
    <>
      <BaseCombobox.Item
        data-slot="multi-select-item"
        data-select-all=""
        value={option}
        className={cn(popupItem, 'data-selected:font-regular')}
      >
        <CheckBox state={allSelected ? 'on' : someSelected ? 'mixed' : 'off'} />
        <span className="min-w-0 flex-1 truncate">
          {allSelected ? clearAllLabel : selectAllLabel}
        </span>
      </BaseCombobox.Item>
      <BaseCombobox.Separator className="-mx-1 my-1 h-px bg-line" />
    </>
  );
}

export type MultiSelectGroupProps = WithClassName<
  Omit<ComponentProps<typeof BaseCombobox.Group>, 'children'>
> & {
  label: ReactNode;
  children?: ListChildren;
};

/** A titled group of options; pass the group's `items` and a function child. */
export function MultiSelectGroup({ className, label, children, ...props }: MultiSelectGroupProps) {
  return (
    <BaseCombobox.Group className={cn('not-first:mt-1', className)} {...props}>
      <BaseCombobox.GroupLabel className={popupGroupLabel}>{label}</BaseCombobox.GroupLabel>
      {typeof children === 'function' ? (
        <BaseCombobox.Collection>
          {children as (item: unknown, index: number) => ReactNode}
        </BaseCombobox.Collection>
      ) : (
        children
      )}
    </BaseCombobox.Group>
  );
}
