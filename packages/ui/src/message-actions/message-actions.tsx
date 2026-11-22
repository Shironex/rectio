'use client';

import {
  ArrowClockwiseIcon,
  CheckIcon,
  CopyIcon,
  PencilSimpleIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@phosphor-icons/react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { Button, type ButtonProps } from '../button/button';
import { copyToClipboard } from '../copy-button/clipboard';
import { cn } from '../lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';
import { type MessageActionsMessages, MESSAGE_ACTIONS_MESSAGES } from './message-actions-messages';

export interface MessageActionsProps extends ComponentProps<'div'> {
  /** Names the toolbar for assistive technology. Default "Message actions". */
  label?: string | undefined;
}

/**
 * The row of small actions under a message. It is a toolbar: Tab reaches it once and the arrow
 * keys, Home and End move between its buttons.
 */
export function MessageActions({
  label = MESSAGE_ACTIONS_MESSAGES.toolbar,
  className,
  onKeyDown,
  ...props
}: MessageActionsProps) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // One tab stop: the remembered button is in the tab order, the others are reached by arrows.
  useEffect(() => {
    const buttons = [...(ref.current?.querySelectorAll<HTMLElement>('button') ?? [])];
    buttons.forEach((button, index) => {
      button.tabIndex = index === Math.min(active, buttons.length - 1) ? 0 : -1;
    });
  });

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const buttons = [
      ...(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []),
    ];
    const current = buttons.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next: number;
    if (event.key === forward) next = (current + 1) % buttons.length;
    else if (event.key === back) next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next]?.focus();
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label}
      data-slot="message-actions"
      className={cn('flex items-center gap-0.5 pointer-coarse:gap-5', className)}
      onKeyDown={move}
      onFocus={(event) => {
        const buttons = [...(ref.current?.querySelectorAll<HTMLElement>('button') ?? [])];
        const index = buttons.indexOf(event.target);
        if (index !== -1) setActive(index);
      }}
      {...props}
    />
  );
}

export interface MessageActionProps extends Omit<
  ButtonProps,
  'children' | 'iconOnly' | 'size' | 'variant'
> {
  /** The action in words: the accessible name and the tooltip. */
  label: string;
  /** The icon. */
  children: ReactNode;
}

/** One icon action with its name in a tooltip. Use for anything the built-in actions do not cover. */
export function MessageAction({ label, children, className, ...props }: MessageActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={label}
            className={cn('text-fg-muted hover:text-fg', className)}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export interface MessageCopyActionProps extends Omit<
  MessageActionProps,
  'label' | 'children' | 'value'
> {
  /** The text to copy, or a function that reads it at the moment of the press. */
  value: string | (() => string);
  /** Called after the text is on the clipboard. */
  onCopied?: (() => void) | undefined;
  messages?: Partial<Pick<MessageActionsMessages, 'copy' | 'copied'>> | undefined;
}

/**
 * Copies the message. The icon turns into a check for two seconds and a polite status says
 * Copied; a browser that refuses the clipboard leaves it as it was.
 */
export function MessageCopyAction({
  value,
  onCopied,
  messages,
  onClick,
  ...props
}: MessageCopyActionProps) {
  const m = { ...MESSAGE_ACTIONS_MESSAGES, ...messages };
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    try {
      // The kit's clipboard helper: the Clipboard API, or the copy command where it is blocked.
      await copyToClipboard(typeof value === 'function' ? value() : value);
      setCopied(true);
      onCopied?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <MessageAction
        label={copied ? m.copied : m.copy}
        data-copied={copied || undefined}
        className="data-copied:text-positive-strong"
        onClick={(event) => {
          onClick?.(event);
          void copy();
        }}
        {...props}
      >
        {copied ? (
          <CheckIcon aria-hidden weight="bold" className="size-4" />
        ) : (
          <CopyIcon aria-hidden weight="bold" className="size-4" />
        )}
      </MessageAction>
      <span role="status" className="sr-only">
        {copied ? m.copied : ''}
      </span>
    </>
  );
}

export interface MessageRegenerateActionProps extends Omit<
  MessageActionProps,
  'label' | 'children'
> {
  label?: string | undefined;
}

/** Asks for the reply again. */
export function MessageRegenerateAction({
  label = MESSAGE_ACTIONS_MESSAGES.regenerate,
  ...props
}: MessageRegenerateActionProps) {
  return (
    <MessageAction label={label} {...props}>
      <ArrowClockwiseIcon aria-hidden weight="bold" className="size-4" />
    </MessageAction>
  );
}

/** Opens the user's message for editing; pair with `ChatMessageEditor`. */
export function MessageEditAction({
  label = MESSAGE_ACTIONS_MESSAGES.edit,
  ...props
}: MessageRegenerateActionProps) {
  return (
    <MessageAction label={label} {...props}>
      <PencilSimpleIcon aria-hidden weight="bold" className="size-4" />
    </MessageAction>
  );
}

export type MessageFeedbackValue = 'good' | 'bad' | null;

export interface MessageFeedbackProps {
  value: MessageFeedbackValue;
  /** Called with the new rating; pressing the chosen one again clears it. */
  onValueChange: (value: MessageFeedbackValue) => void;
  messages?: Partial<Pick<MessageActionsMessages, 'good' | 'bad'>> | undefined;
  disabled?: boolean | undefined;
}

/**
 * A thumbs up and a thumbs down that toggle. The chosen one is pressed (`aria-pressed`) and filled,
 * so the rating reads from shape as well as colour.
 */
export function MessageFeedback({
  value,
  onValueChange,
  messages,
  disabled,
}: MessageFeedbackProps) {
  const m = { ...MESSAGE_ACTIONS_MESSAGES, ...messages };
  const options = [
    { rating: 'good' as const, label: m.good, Icon: ThumbsUpIcon },
    { rating: 'bad' as const, label: m.bad, Icon: ThumbsDownIcon },
  ];
  return (
    <>
      {options.map(({ rating, label, Icon }) => {
        const pressed = value === rating;
        return (
          <MessageAction
            key={rating}
            label={label}
            aria-pressed={pressed}
            disabled={disabled}
            className="aria-pressed:text-fg"
            onClick={() => {
              onValueChange(pressed ? null : rating);
            }}
          >
            <Icon aria-hidden weight={pressed ? 'fill' : 'bold'} className="size-4" />
          </MessageAction>
        );
      })}
    </>
  );
}

export { type MessageActionsMessages, MESSAGE_ACTIONS_MESSAGES } from './message-actions-messages';
