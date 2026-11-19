import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
  CaretUpDownIcon,
  CheckIcon,
  CircleNotchIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { controlSurface } from '../field/field';
import { cn } from '../lib/cn';
import { popupGroupLabel, popupItem, popupMotion, popupSurface } from '../select/select';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** Marks the extra "Create" option the combobox adds after the matches. */
const CREATE = Symbol('rectio.combobox.create');

interface CreateOption {
  [CREATE]: string;
  value: string;
  label: string;
}

function isCreateOption(item: unknown): item is CreateOption {
  return typeof item === 'object' && item !== null && CREATE in item;
}

/** Label of an item the way Base UI reads it: `label` on `{ value, label }` objects, else text. */
function defaultLabel(item: unknown): string {
  if (typeof item === 'object' && item !== null && 'label' in item) {
    const { label } = item;
    if (typeof label === 'string') return label;
  }
  return typeof item === 'string' || typeof item === 'number' ? String(item) : '';
}

/** The surface of a combobox-like control: the field look, a ring while anything inside has focus. */
export const comboboxSurface = cn(
  controlSurface,
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
  // While the list is open the user is fixing the field: show it neutral, not still wrong.
  'data-popup-open:border-fg-subtle data-popup-open:data-invalid:border-fg-subtle data-popup-open:data-invalid:ring-0',
);

/** The small buttons at the end of a combobox: clear and open. 44px wide on touch screens. */
export const comboboxIconButton = cn(
  'flex h-full w-7 shrink-0 cursor-pointer items-center justify-center text-fg-subtle',
  'rounded-(--rx-badge-radius) transition-colors duration-fast ease-standard hover:text-fg',
  'outline-none pointer-coarse:w-(--rx-field-height-touch)',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
);

export type ComboboxProps<Value> = Omit<BaseCombobox.Root.Props<Value>, 'multiple'> & {
  /**
   * Offers a "Create" option after the matches when the typed text matches no item exactly, and
   * calls this with the text when it is chosen. Add the new item to `items` and select it (the
   * value must be controlled). Works with a flat list of items.
   */
  onCreate?: (query: string) => void;
  /** Wording of the create option. Defaults to `Create "acme"`. */
  createLabel?: (query: string) => string;
};

/**
 * One choice from a long list, found by typing: a customer, a vendor, an account. Base UI's
 * Combobox with the field look, groups, an empty state, a loading state for results fetched as
 * the user types, and an optional "Create" option. Wrap it in a Field for the label and error.
 */
export function Combobox<Value>({
  items,
  onCreate,
  createLabel = (query) => `Create "${query}"`,
  filter,
  itemToStringLabel,
  itemToStringValue,
  isItemEqualToValue,
  onValueChange,
  onInputValueChange,
  inputValue,
  actionsRef,
  locale,
  ...props
}: ComboboxProps<Value>) {
  const [typed, setTyped] = useState('');
  const ownActions = useRef<BaseCombobox.Root.Actions | null>(null);
  const actions = actionsRef ?? ownActions;
  const { contains } = BaseCombobox.useFilter({ multiple: true, locale });

  const query = (inputValue === undefined ? typed : String(inputValue)).trim();
  const labelOf = (item: unknown) =>
    itemToStringLabel === undefined ? defaultLabel(item) : itemToStringLabel(item as Value);
  const list = Array.isArray(items) ? (items as readonly unknown[]) : null;
  const creatable =
    onCreate !== undefined &&
    query !== '' &&
    list !== null &&
    !list.some((item) => labelOf(item).toLocaleLowerCase() === query.toLocaleLowerCase());
  const shown: typeof items = creatable
    ? [...list, { [CREATE]: query, value: `create:${query}`, label: createLabel(query) }]
    : items;

  // Hooks Base UI calls with every item: the create option answers for itself.
  const wrappedFilter: ComboboxProps<Value>['filter'] =
    filter === null
      ? null
      : (item, text, toString) =>
          isCreateOption(item) || (filter ?? contains)(item, text, toString);

  return (
    <BaseCombobox.Root<Value>
      // The first match is highlighted as the user types, so Enter always has a visible target.
      autoHighlight
      {...props}
      locale={locale}
      items={shown}
      filter={wrappedFilter}
      actionsRef={actions}
      {...(inputValue === undefined ? {} : { inputValue })}
      itemToStringLabel={(item) => (isCreateOption(item) ? item.label : labelOf(item))}
      {...(itemToStringValue === undefined
        ? {}
        : {
            itemToStringValue: (item: Value) =>
              isCreateOption(item) ? item.value : itemToStringValue(item),
          })}
      {...(isItemEqualToValue === undefined
        ? {}
        : {
            isItemEqualToValue: (a: Value, b: Value) =>
              isCreateOption(a) || isCreateOption(b) ? a === b : isItemEqualToValue(a, b),
          })}
      onInputValueChange={(next, details) => {
        setTyped(next);
        onInputValueChange?.(next, details);
      }}
      onValueChange={(next, details) => {
        if (isCreateOption(next)) {
          // Never select the option itself: hand the text to the app and close the list.
          details.cancel();
          onCreate?.(next[CREATE]);
          actions.current?.close();
          return;
        }
        onValueChange?.(next, details);
      }}
    />
  );
}

export type ComboboxInputProps = WithClassName<ComponentProps<typeof BaseCombobox.Input>> & {
  /** Shows a clear button while a value is chosen. */
  showClear?: boolean;
  /** Accessible name of the clear button. */
  clearLabel?: string;
  /** Accessible name of the button that opens the list. */
  triggerLabel?: string;
};

/** The text input with the field look, a clear button and a button that opens the list. */
export function ComboboxInput({
  className,
  showClear = true,
  clearLabel = 'Clear selection',
  triggerLabel = 'Show options',
  ...props
}: ComboboxInputProps) {
  return (
    <BaseCombobox.InputGroup
      data-slot="combobox-input"
      className={cn(
        comboboxSurface,
        'flex items-center gap-0.5 ps-(--rx-field-padding-x) pe-0.5',
        className,
      )}
    >
      <BaseCombobox.Input
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle',
          'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
        )}
        {...props}
      />
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

export type ComboboxContentProps = WithClassName<
  Omit<ComponentProps<typeof BaseCombobox.Popup>, 'children'>
> & {
  /** One `ComboboxItem` per item, usually as a function of the item. */
  children?: ListChildren;
  /** Shown when no item matches the typed text. */
  emptyMessage?: ReactNode;
  /** Results are on their way: shows `loadingMessage` and marks the list busy. */
  loading?: boolean;
  loadingMessage?: ReactNode;
  /** A line above the results, such as "Type two letters to search". Announced politely. */
  status?: ReactNode;
};

/** A muted line in the list: the empty state, the loading state, a hint. */
const listNote = 'flex items-center gap-2 px-2 py-1.5 text-sm text-fg-subtle';

/**
 * The list. Portals into the nearest ThemeScope, like SelectContent, and announces its loading and
 * empty states to screen readers.
 */
export function ComboboxContent({
  className,
  children,
  emptyMessage = 'No results',
  loading = false,
  loadingMessage = 'Searching…',
  status,
  ...props
}: ComboboxContentProps) {
  const container = usePortalContainer();
  const render =
    typeof children === 'function'
      ? (item: unknown, index: number) =>
          isCreateOption(item) ? (
            <ComboboxCreateItem key={item.value} option={item} />
          ) : (
            (children as (item: unknown, index: number) => ReactNode)(item, index)
          )
      : children;
  return (
    <BaseCombobox.Portal container={container}>
      <BaseCombobox.Positioner sideOffset={6} className="z-50 outline-none">
        <BaseCombobox.Popup
          data-slot="combobox-content"
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
          {/* Stays mounted so screen readers hear each change; only its content comes and goes. */}
          <BaseCombobox.Status>
            {loading ? (
              <div className={listNote}>
                <CircleNotchIcon aria-hidden weight="bold" className="size-3.5 animate-spin" />
                {loadingMessage}
              </div>
            ) : status !== undefined && status !== null ? (
              <div className={listNote}>{status}</div>
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

export type ComboboxItemProps = WithClassName<ComponentProps<typeof BaseCombobox.Item>> & {
  /** Secondary text on the right, such as a code or a count. */
  hint?: ReactNode;
};

/** One option. The chosen one carries a check mark as well as a heavier weight. */
export function ComboboxItem({ className, children, hint, ...props }: ComboboxItemProps) {
  return (
    <BaseCombobox.Item data-slot="combobox-item" className={cn(popupItem, className)} {...props}>
      <span className="flex size-4 shrink-0 items-center justify-center">
        <BaseCombobox.ItemIndicator className="flex text-accent-strong">
          <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        </BaseCombobox.ItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint !== undefined && <span className="text-sm text-fg-subtle numeric">{hint}</span>}
    </BaseCombobox.Item>
  );
}

/** The "Create" option, last in the list, with a plus where the check mark would be. */
function ComboboxCreateItem({ option }: { option: CreateOption }) {
  return (
    <BaseCombobox.Item
      data-slot="combobox-item"
      data-create=""
      value={option}
      className={cn(
        popupItem,
        'text-accent-strong data-highlighted:text-accent-strong',
        // Set apart from the matches by a rule, so it reads as an action, not a result.
        'relative not-first:mt-1.5 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-1 not-first:before:h-px not-first:before:bg-line',
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        <PlusIcon aria-hidden weight="bold" className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
    </BaseCombobox.Item>
  );
}

export type ComboboxGroupProps = WithClassName<
  Omit<ComponentProps<typeof BaseCombobox.Group>, 'children'>
> & {
  label: ReactNode;
  /** The group's options, usually as a function of each item in the group's `items`. */
  children?: ListChildren;
};

/**
 * A titled group of options. Pass the group's `items` and a function child to render them; Base UI
 * filters inside each group and hides a group with no match.
 */
export function ComboboxGroup({ className, label, children, ...props }: ComboboxGroupProps) {
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
