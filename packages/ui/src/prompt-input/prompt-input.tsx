'use client';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from '@phosphor-icons/react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { Button } from '../button/button';
import {
  FileItem,
  FileList,
  FileUpload,
  FileUploadTrigger,
  type FileRejection,
  type FileUploadEntry,
} from '../file-upload/file-upload';
import { cn } from '../lib/cn';
import { Textarea, type TextareaProps } from '../textarea/textarea';
import { type PromptInputMessages, PROMPT_INPUT_MESSAGES } from './prompt-input-messages';

export type PromptInputStatus = 'idle' | 'submitting' | 'streaming';

export interface PromptInputProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'children'> {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /**
   * Send. Called with the trimmed text and the attachments. The field empties afterwards unless
   * this returns `false`; a controlled field empties when the app sets `value`.
   */
  onSubmit: (value: string, attachments: readonly FileUploadEntry[]) => unknown;
  /** Offers Stop in place of Send while `status` is `submitting` or `streaming`. */
  onStop?: (() => void) | undefined;
  /**
   * `submitting` while the message is on its way, `streaming` while the reply arrives. Send waits
   * in both; the field stays editable, so the next message can be drafted.
   */
  status?: PromptInputStatus | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  /** The limit in characters. The count shows, and is said, near it. */
  maxLength?: number | undefined;
  /** Height at rest, in lines. Default 1. */
  minRows?: number | undefined;
  /** The field grows to this many lines, then scrolls. Default 8. */
  maxRows?: number | undefined;
  /**
   * When Enter sends. `auto` (default): Enter sends with a mouse and keyboard, and on touch
   * screens it adds a line, since their keyboards have no Shift; Send is always there. `enter`:
   * always. `mod-enter`: only with Ctrl or Cmd held.
   */
  submitKey?: 'auto' | 'enter' | 'mod-enter' | undefined;
  /** The attached files with their upload status. Passing it with `onAttach` turns attaching on. */
  attachments?: readonly FileUploadEntry[] | undefined;
  /** Files the user picked or dropped that passed the rules. The app uploads them. */
  onAttach?: ((files: File[]) => void) | undefined;
  onRemoveAttachment?: ((file: FileUploadEntry) => void) | undefined;
  onRetryAttachment?: ((file: FileUploadEntry) => void) | undefined;
  onRejectAttachment?: ((rejections: FileRejection[]) => void) | undefined;
  /** The native `accept` string for attachments, such as `.pdf,.csv,image/*`. */
  accept?: string | undefined;
  /** Largest attachment, in bytes. */
  maxSize?: number | undefined;
  /** Most attachments at once. */
  maxFiles?: number | undefined;
  /** Controls before the send button: a model picker, a tools menu. */
  tools?: ReactNode;
  /** A short note under the field, such as what the assistant can see. */
  hint?: ReactNode;
  /** Beside the send button, before it: a running count, a status. */
  meta?: ReactNode;
  /**
   * Holds Send back for a reason the field does not know, such as a token limit the app counts.
   * The field stays editable and Enter does nothing.
   */
  submitDisabled?: boolean | undefined;
  /**
   * More props for the text field, such as the ARIA attributes of a suggestion list. Its
   * `onKeyDown` runs first; calling `preventDefault` there keeps Enter from sending.
   */
  textareaProps?:
    | Omit<
        TextareaProps,
        'value' | 'defaultValue' | 'onValueChange' | 'ref' | 'disabled' | 'maxLength' | 'className'
      >
    | undefined;
  messages?: Partial<PromptInputMessages> | undefined;
  textareaRef?: Ref<HTMLTextAreaElement> | undefined;
  textareaClassName?: string | undefined;
}

/** Announces the characters left, settled for a moment so a fast typist hears one number. */
function useSettled(text: string) {
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(text);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);
  return settled;
}

/** Hands a node to a ref the caller passed, whatever its shape. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null && ref !== undefined) ref.current = value;
}

const coarsePointer = () =>
  typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/**
 * Where the user writes to the assistant: a field that grows with the text, attachments through
 * the file upload parts, and one button that is Send at rest and Stop while a reply arrives. Enter
 * sends and Shift and Enter adds a line (on touch screens Enter adds a line and the button sends);
 * typing in an input method editor never sends mid-word. Send waits while a message is on its way,
 * while attachments upload and while the field is empty. After sending, focus stays in the field,
 * ready for the next message.
 */
export function PromptInput({
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onStop,
  status = 'idle',
  disabled = false,
  placeholder,
  maxLength,
  minRows = 1,
  maxRows = 8,
  submitKey = 'auto',
  attachments,
  onAttach,
  onRemoveAttachment,
  onRetryAttachment,
  onRejectAttachment,
  accept,
  maxSize,
  maxFiles,
  tools,
  hint,
  meta,
  submitDisabled = false,
  textareaProps,
  messages: overrides,
  textareaRef,
  textareaClassName,
  className,
  ...props
}: PromptInputProps) {
  const m = { ...PROMPT_INPUT_MESSAGES, ...overrides };
  const controlled = value !== undefined;
  const [draft, setDraft] = useState(defaultValue);
  const text = controlled ? value : draft;
  const field = useRef<HTMLTextAreaElement | null>(null);
  const hintId = useId();
  const hasHint = hint !== undefined && hint !== null;

  const busy = status !== 'idle';
  const files = attachments ?? [];
  const uploading = files.some((file) => file.status === 'queued' || file.status === 'uploading');
  const empty = text.trim() === '' && files.length === 0;
  const canSend = !disabled && !busy && !empty && !uploading && !submitDisabled;
  const canStop = busy && onStop !== undefined;

  const length = text.length;
  const left = maxLength === undefined ? null : maxLength - length;
  const near =
    left !== null && maxLength !== undefined && left <= Math.max(10, Math.ceil(maxLength / 10));
  const countText = left === null ? '' : left < 0 ? m.over(-left) : m.left(left);
  const announcement = useSettled(near ? countText : '');

  const setText = (next: string) => {
    if (!controlled) setDraft(next);
    onValueChange?.(next);
  };

  const submit = () => {
    if (!canSend) return;
    const kept = onSubmit(text.trim(), files) === false;
    if (!kept) setText('');
    field.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    textareaProps?.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    const mod = event.metaKey || event.ctrlKey;
    const sends =
      submitKey === 'mod-enter'
        ? mod
        : !event.shiftKey && !event.altKey && (submitKey === 'enter' || mod || !coarsePointer());
    if (!sends) return;
    event.preventDefault();
    submit();
  };

  const attaching = onAttach !== undefined;

  const form = (
    <form
      data-slot="prompt-input"
      data-status={status}
      data-disabled={disabled || undefined}
      aria-busy={status === 'submitting' || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={cn(
        'flex w-full min-w-0 flex-col rounded-panel border border-line bg-surface shadow-raised',
        'transition-[border-color] duration-fast ease-standard hover:border-fg-subtle',
        // One focus ring for the whole box while the field inside holds focus.
        'has-[textarea:focus-visible]:border-fg-subtle has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-focus',
        'data-disabled:border-line-disabled data-disabled:bg-surface-sunken',
        className,
      )}
      {...props}
    >
      {files.length > 0 && (
        <FileList aria-label={m.attachments} className="px-2 pt-2">
          {files.map((file) => (
            <FileItem key={file.id} file={file} className="py-1.5" />
          ))}
        </FileList>
      )}
      <Textarea
        {...textareaProps}
        ref={(node) => {
          field.current = node;
          assignRef(textareaRef, node);
        }}
        aria-label={m.label}
        // The note under the field is its description, so a reason such as being offline is read.
        aria-describedby={hasHint ? hintId : undefined}
        placeholder={placeholder ?? m.placeholder}
        value={text}
        onValueChange={setText}
        onKeyDown={onKeyDown}
        disabled={disabled}
        maxLength={maxLength}
        minRows={minRows}
        maxRows={maxRows}
        enterKeyHint="send"
        className={cn(
          'border-0 bg-transparent px-3.5 pt-3 pb-1 hover:border-0 pointer-coarse:min-h-(--rx-control-height-touch)',
          'focus-visible:outline-0 data-disabled:bg-transparent',
          textareaClassName,
        )}
      />
      <div className="flex items-center gap-2 px-2 pb-2">
        {attaching && (
          <FileUploadTrigger
            variant="ghost"
            size="md"
            iconOnly
            aria-label={m.attach}
            disabled={disabled}
            className="text-fg-muted hover:text-fg"
          >
            <PaperclipIcon aria-hidden weight="bold" className="size-4.5" />
          </FileUploadTrigger>
        )}
        {tools}
        <div className="ms-auto flex min-w-0 items-center gap-3">
          {uploading && !busy && (
            <span className="truncate text-sm text-fg-subtle">{m.waitingForUploads}</span>
          )}
          {meta}
          {near && (
            <span
              aria-hidden
              data-part="count"
              data-tone={left <= 0 ? 'limit' : 'near'}
              className="text-sm text-warning-strong numeric data-[tone=limit]:text-negative-strong"
            >
              {countText}
            </span>
          )}
          {canStop ? (
            <Button
              // The same footprint as Send, so the button under the thumb never jumps.
              variant="ghost"
              iconOnly
              aria-label={m.stop}
              data-part="stop"
              onClick={() => {
                onStop();
                field.current?.focus();
              }}
            >
              <StopIcon aria-hidden weight="fill" className="size-4 text-fg" />
            </Button>
          ) : (
            <Button
              type="submit"
              // A filled button only once there is something to send; the quiet one reads as waiting.
              variant={canSend ? 'primary' : 'ghost'}
              className={cn(!canSend && 'text-fg-muted')}
              iconOnly
              aria-label={m.send}
              data-part="send"
              disabled={!canSend}
              // Keeps the button focusable while it waits, so a keyboard user is never dropped.
              focusableWhenDisabled
            >
              <ArrowUpIcon aria-hidden weight="bold" className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </form>
  );

  const body = attaching ? (
    <FileUpload
      {...(accept === undefined ? {} : { accept })}
      {...(maxSize === undefined ? {} : { maxSize })}
      {...(maxFiles === undefined ? {} : { maxFiles })}
      {...(onRejectAttachment === undefined ? {} : { onRejected: onRejectAttachment })}
      {...(onRemoveAttachment === undefined ? {} : { onRemove: onRemoveAttachment })}
      {...(onRetryAttachment === undefined ? {} : { onRetry: onRetryAttachment })}
      disabled={disabled}
      files={files}
      onFilesAdded={onAttach}
      className="w-full"
    >
      {form}
    </FileUpload>
  ) : (
    form
  );

  return (
    <div data-slot="prompt-input-root" className="flex w-full min-w-0 flex-col gap-1.5">
      {body}
      {hasHint && (
        <p id={hintId} className="px-1 text-center text-xs text-fg-subtle text-pretty">
          {hint}
        </p>
      )}
    </div>
  );
}

export { type PromptInputMessages, PROMPT_INPUT_MESSAGES } from './prompt-input-messages';
