import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  type InputGroupInputProps,
} from '../input-group/input-group';
import { cn } from '../lib/cn';

type ChangeDetails = Parameters<NonNullable<InputGroupInputProps['onValueChange']>>[1];

export interface SearchInputProps extends Omit<
  InputGroupInputProps,
  'type' | 'value' | 'defaultValue' | 'onValueChange' | 'ref'
> {
  ref?: Ref<HTMLInputElement>;
  value?: string;
  defaultValue?: string;
  /** Called with the new text on every change, and with "" when cleared. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** Called after the clear button or Escape empties the field. */
  onClear?: () => void;
  /** Accessible name of the clear button. */
  clearLabel?: string;
  /**
   * A keyboard shortcut shown as a hint while the field is empty: a single key such as "/", or
   * "mod+k" for Command K on Apple devices and Control K elsewhere.
   */
  shortcut?: string;
  /**
   * Makes `shortcut` focus the field from anywhere on the page. Off by default. It never fires
   * while the user is typing in another field.
   */
  globalShortcut?: boolean;
  /** Class names for the group that draws the border, rather than the bare input inside it. */
  groupClassName?: string;
}

interface Shortcut {
  key: string;
  mod: boolean;
}

function parseShortcut(shortcut: string): Shortcut {
  const parts = shortcut.split('+').map((part) => part.trim());
  const key = parts.at(-1) ?? '';
  return { key: key.toLowerCase(), mod: parts.slice(0, -1).some((p) => p.toLowerCase() === 'mod') };
}

const subscribeNever = () => () => undefined;
const isApple = () => /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);

/** True on Apple platforms, where "mod" is Command. False on the server and before hydration. */
function useApplePlatform() {
  return useSyncExternalStore(subscribeNever, isApple, () => false);
}

/** Text fields, selects and editable regions own their keystrokes; a page shortcut stays out. */
function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, [contenteditable]') !== null
  );
}

/** Sets an input's value the way typing does, so React, Base UI Field and forms all hear it. */
function setNativeValue(input: HTMLInputElement, value: string) {
  // The prototype's setter, not the instance's: React tracks the instance property and would
  // otherwise treat the change as already seen.
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * A search field on InputGroup: a magnifier, the input, and a clear button once there is text.
 * Escape clears the text first (a second Escape reaches the dialog or menu around it), and focus
 * stays in the field either way. It has search semantics without the browser's own cancel button,
 * which would duplicate the clear button. An optional shortcut hint can focus it from anywhere.
 */
export function SearchInput({
  ref,
  value,
  defaultValue,
  onValueChange,
  onClear,
  clearLabel = 'Clear search',
  shortcut,
  globalShortcut = false,
  disabled,
  className,
  groupClassName,
  onKeyDown,
  ...props
}: SearchInputProps) {
  const input = useRef<HTMLInputElement | null>(null);
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
  const current = controlled ? value : uncontrolledValue;
  const apple = useApplePlatform();
  // A disabled Field disables the input without telling this component, so read it from the DOM.
  const [inputDisabled, setInputDisabled] = useState(disabled === true);
  useLayoutEffect(() => {
    const element = input.current;
    if (element === null) return;
    const read = () => {
      setInputDisabled(element.disabled);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(element, { attributes: true, attributeFilter: ['disabled'] });
    return () => {
      observer.disconnect();
    };
  }, []);
  const parsed = shortcut === undefined ? null : parseShortcut(shortcut);

  const shortcutKey = parsed?.key ?? null;
  const shortcutMod = parsed?.mod ?? false;

  useEffect(() => {
    if (!globalShortcut || shortcutKey === null) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey) return;
      if (event.key.toLowerCase() !== shortcutKey) return;
      // "mod" is Command on Apple devices and Control elsewhere; a bare key takes neither.
      const modPressed = apple ? event.metaKey : event.ctrlKey;
      const otherPressed = apple ? event.ctrlKey : event.metaKey;
      if (modPressed !== shortcutMod || otherPressed) return;
      if (isEditable(event.target)) return;
      const element = input.current;
      if (element === null || element.disabled) return;
      event.preventDefault();
      element.focus();
      element.select();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [globalShortcut, shortcutKey, shortcutMod, apple]);

  const clear = () => {
    const element = input.current;
    if (element === null) return;
    setNativeValue(element, '');
    element.focus();
    onClear?.();
  };

  const hint =
    shortcutKey === null
      ? null
      : shortcutMod
        ? `${apple ? '⌘' : 'Ctrl '}${shortcutKey.toUpperCase()}`
        : shortcutKey;
  const clearable = current !== '' && !inputDisabled && props.readOnly !== true;

  return (
    <InputGroup data-slot="search-input" className={cn(groupClassName)}>
      <InputGroupAddon>
        <MagnifyingGlassIcon aria-hidden weight="bold" />
      </InputGroupAddon>
      <InputGroupInput
        {...props}
        ref={(element: HTMLElement | null) => {
          input.current = element as HTMLInputElement | null;
          if (typeof ref === 'function') ref(element as HTMLInputElement | null);
          else if (ref) ref.current = element as HTMLInputElement | null;
        }}
        type="search"
        disabled={disabled}
        aria-keyshortcuts={
          globalShortcut && shortcutKey !== null
            ? shortcutMod
              ? `${apple ? 'Meta' : 'Control'}+${shortcutKey.toUpperCase()}`
              : shortcutKey
            : undefined
        }
        {...(controlled ? { value } : { defaultValue })}
        onValueChange={(next: string, details: ChangeDetails) => {
          if (!controlled) setUncontrolledValue(next);
          onValueChange?.(next, details);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== 'Escape' || !clearable) return;
          // The first Escape empties the field; only an empty field lets Escape close what holds it.
          event.preventDefault();
          event.stopPropagation();
          clear();
        }}
        className={cn(
          // The clear button replaces the browser's own cancel control and decoration.
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          className,
        )}
      />
      {clearable ? (
        <InputGroupAddon align="end">
          <InputGroupButton iconOnly aria-label={clearLabel} onClick={clear}>
            <XIcon aria-hidden weight="bold" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : (
        hint !== null && (
          <InputGroupAddon align="end">
            {/* Decorative: the shortcut is announced through aria-keyshortcuts when it is live. */}
            <kbd
              aria-hidden
              className="rounded-(--rx-badge-radius) border border-line bg-surface-sunken px-1.5 font-sans text-xs text-fg-muted"
            >
              {hint}
            </kbd>
          </InputGroupAddon>
        )
      )}
    </InputGroup>
  );
}
