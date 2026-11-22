'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { XIcon } from '@phosphor-icons/react';
import {
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { controlSurface } from '../field/control-styles';
import { FieldError } from '../field/field';
import { cn } from '../lib/cn';
import { tagRemoveButton } from './tag-input-styles';

export { tagRemoveButton } from './tag-input-styles';

export type TagProps = Omit<ComponentProps<'span'>, 'className'> & {
  /** Undefined is accepted so a primitive's render props can be spread straight in. */
  className?: string | undefined;
  /** Shows a remove button that calls this. Without it the tag is a plain label. */
  onRemove?: () => void;
  /**
   * The remove button's accessible name. Defaults to "Remove" and the tag's text, such as
   * "Remove design", so a list of buttons never reads as "Remove, Remove, Remove".
   */
  removeLabel?: string;
  /** Replaces the default remove button, for a chip whose primitive brings its own. */
  action?: ReactNode;
  disabled?: boolean;
};

/**
 * A token styled chip for one value: a tag, a recipient, a chosen option. Removable when given
 * `onRemove`. Tag input and Multi select draw their values with it.
 */
export function Tag({
  className,
  children,
  onRemove,
  removeLabel,
  action,
  disabled = false,
  ...props
}: TagProps) {
  const name = removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove');
  return (
    <span
      data-slot="tag"
      data-disabled={disabled || undefined}
      className={cn(
        'inline-flex h-6 max-w-full min-w-0 shrink-0 items-center gap-1 ps-1.5 pe-1',
        // On touch screens a tag is as tall as a small button, so rows of tags spaced by the touch
        // gap give every remove button its whole hit area.
        'pointer-coarse:h-(--rx-control-height-sm)',
        'rounded-(--rx-badge-radius) border border-line-strong bg-surface-sunken text-sm text-fg',
        'transition-colors duration-fast ease-standard select-none outline-none',
        // Selected by keyboard before Backspace removes it: filled like selected text, a change
        // in lightness as well as hue. The control around it carries the focus ring.
        'focus-visible:border-accent focus-visible:bg-accent focus-visible:text-accent-contrast',
        'data-disabled:text-fg-disabled',
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      {action ??
        (onRemove !== undefined && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={name}
            className={tagRemoveButton}
            onClick={onRemove}
          >
            <XIcon aria-hidden weight="bold" className="size-3" />
          </button>
        ))}
    </span>
  );
}

/** Why a tag was turned away, for custom wording. */
export type TagRejection = 'duplicate' | 'max' | 'invalid';

export interface TagInputProps {
  /** The tags. Use with `onValueChange` when controlled. */
  value?: string[];
  /** The starting tags when uncontrolled. */
  defaultValue?: string[];
  /** Called with the whole new list whenever a tag is added or removed. */
  onValueChange?: (tags: string[]) => void;
  /**
   * Characters that end a tag as they are typed or pasted, besides Enter. Pasted text also splits
   * on new lines and tabs, so a column copied from a spreadsheet becomes one tag per row.
   */
  delimiters?: string[];
  /** Treat "Design" and "design" as different tags. Off by default. */
  caseSensitive?: boolean;
  /** The most tags the field takes. */
  max?: number;
  /**
   * Checks one tag before it is added. Return a message to reject it: the text stays in the input
   * for the user to fix, and the message shows as the field's error.
   */
  validate?: (tag: string) => string | null | undefined;
  /** Wording for the built-in rejections. */
  messages?: {
    duplicate?: (tag: string) => string;
    max?: (max: number) => string;
  };
  /** Submits one form value per tag under this name. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Only when no FieldLabel names the input. */
  'aria-label'?: string;
  className?: string;
}

const DEFAULT_MESSAGES = {
  duplicate: (tag: string) => `"${tag}" is already added.`,
  max: (max: number) => `Up to ${max} tags.`,
};

const PASTE_BREAKS = /[\n\r\t]/;

function escapeForClass(text: string) {
  return text.replace(/[\\\]^-]/g, '\\$&');
}

/**
 * Free text tags inside a field: labels on a record, email domains, cost codes. Enter or a
 * delimiter adds the typed text as a tag, pasting a list adds each entry, and Backspace in the
 * empty input selects the last tag, then removes it. Arrow keys move between tags; Delete or
 * Backspace removes the one in focus. Wrap it in a Field for the label, description and error.
 */
export function TagInput({
  value,
  defaultValue,
  onValueChange,
  delimiters = [','],
  caseSensitive = false,
  max,
  validate,
  messages,
  name,
  placeholder,
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: TagInputProps) {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue ?? []);
  const tags = value ?? uncontrolled;
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const errorId = useId();

  const wording = { ...DEFAULT_MESSAGES, ...messages };
  const split = new RegExp(`[${escapeForClass(delimiters.join(''))}]`);
  // Field disabled sets the native attribute on the input; read it so a disabled field's tags
  // cannot be removed by keyboard either.
  const isDisabled = () => disabled || inputRef.current?.disabled === true;
  const key = (tag: string) => (caseSensitive ? tag : tag.toLocaleLowerCase());

  const commitTags = (next: string[]) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  /**
   * Adds every entry it can and returns the ones it turned away, with the first reason. Entries
   * are trimmed; empty ones are dropped silently.
   */
  const add = (entries: string[]) => {
    const next = [...tags];
    const seen = new Set(next.map(key));
    const rejected: string[] = [];
    let message: string | null = null;
    for (const raw of entries) {
      const tag = raw.trim();
      if (tag === '') continue;
      const reason = seen.has(key(tag))
        ? wording.duplicate(tag)
        : max !== undefined && next.length >= max
          ? wording.max(max)
          : (validate?.(tag) ?? null);
      if (reason !== null && reason !== '') {
        rejected.push(tag);
        message ??= reason;
        continue;
      }
      next.push(tag);
      seen.add(key(tag));
    }
    if (next.length !== tags.length) commitTags(next);
    setError(message);
    return rejected;
  };

  const remove = (index: number) => {
    if (isDisabled()) return;
    commitTags(tags.filter((_, i) => i !== index));
    setError(null);
  };

  const focusTag = (index: number) => {
    if (index >= tags.length) inputRef.current?.focus();
    else tagRefs.current[index]?.focus();
  };

  const onTextChange = (nextText: string) => {
    setError(null);
    if (!split.test(nextText)) {
      setText(nextText);
      return;
    }
    // A delimiter was typed: everything before the last one becomes tags, the rest keeps typing.
    const parts = nextText.split(split);
    const rest = parts.pop() ?? '';
    const rejected = add(parts);
    setText([...rejected, rest].filter((part) => part !== '').join(delimiters[0] ?? ' '));
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    if (event.key === 'Enter') {
      // An empty input lets Enter submit the form, as in any field.
      if (text.trim() === '') return;
      event.preventDefault();
      const rejected = add([text]);
      if (rejected.length === 0) setText('');
    } else if (event.key === 'Backspace' && text === '' && tags.length > 0) {
      // First press selects the last tag; a second press, now on the tag, removes it.
      event.preventDefault();
      focusTag(tags.length - 1);
    } else if (event.key === 'ArrowLeft' && atStart && tags.length > 0) {
      event.preventDefault();
      focusTag(tags.length - 1);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!PASTE_BREAKS.test(pasted) && !split.test(pasted)) return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const combined = text.slice(0, start) + pasted + text.slice(end);
    const rejected = add(combined.split(PASTE_BREAKS).flatMap((line) => line.split(split)));
    setText(rejected.join(delimiters[0] ?? ' '));
  };

  const onTagKeyDown = (event: KeyboardEvent<HTMLSpanElement>, index: number) => {
    switch (event.key) {
      case 'Backspace':
      case 'Delete': {
        event.preventDefault();
        if (isDisabled()) return;
        remove(index);
        // Backspace walks left like text does; Delete keeps the place and takes the next tag.
        // With no tag left on that side, focus goes back to the input.
        const remaining = tags.length - 1;
        const target = event.key === 'Backspace' ? index - 1 : index;
        requestAnimationFrame(() => {
          if (target < 0 || target >= remaining) inputRef.current?.focus();
          else tagRefs.current[target]?.focus();
        });
        break;
      }
      case 'ArrowLeft':
        event.preventDefault();
        focusTag(Math.max(0, index - 1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusTag(index + 1);
        break;
      case 'Escape':
        event.preventDefault();
        inputRef.current?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div data-slot="tag-input" className={cn('flex w-full flex-col gap-1.5', className)}>
      <div
        data-disabled={disabled || undefined}
        data-invalid={error !== null || undefined}
        className={cn(
          controlSurface,
          'flex h-auto min-h-(--rx-field-height) cursor-text flex-wrap items-center gap-1 px-1 py-0.5',
          'pointer-coarse:h-auto pointer-coarse:min-h-(--rx-field-height-touch) pointer-coarse:gap-touch-gap',
          // Focus is somewhere inside: on the input, or on a tag selected for removal.
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
          // The app marked the whole field invalid (a server error): show it on the surface.
          'has-data-invalid:border-negative has-data-invalid:ring-1 has-data-invalid:ring-negative has-data-invalid:ring-inset',
          'has-data-disabled:cursor-not-allowed has-data-disabled:border-line has-data-disabled:bg-surface-sunken',
        )}
        onPointerDown={(event) => {
          // A press on the surface around the tags types into the field, as on any input.
          if (event.target === event.currentTarget) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {tags.map((tag, index) => (
          <Tag
            key={key(tag)}
            ref={(node) => {
              tagRefs.current[index] = node;
            }}
            tabIndex={-1}
            disabled={disabled}
            onRemove={() => {
              remove(index);
              inputRef.current?.focus();
            }}
            onKeyDown={(event) => {
              onTagKeyDown(event, index);
            }}
          >
            {tag}
          </Tag>
        ))}
        <BaseField.Control
          ref={inputRef}
          value={text}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-errormessage={error === null ? undefined : errorId}
          {...(error === null ? {} : { 'aria-invalid': true })}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="enter"
          onValueChange={onTextChange}
          onKeyDown={onInputKeyDown}
          onPaste={onPaste}
          className={cn(
            'h-6 min-w-16 flex-1 bg-transparent ps-1 text-base text-fg outline-none placeholder:text-fg-subtle',
            'pointer-coarse:h-9',
            'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
          )}
        />
        {name !== undefined &&
          tags.map((tag) => <input key={key(tag)} type="hidden" name={name} value={tag} />)}
      </div>
      {error !== null && (
        <FieldError id={errorId} match role="alert">
          {error}
        </FieldError>
      )}
    </div>
  );
}
