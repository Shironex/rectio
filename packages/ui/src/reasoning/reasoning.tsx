import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { BrainIcon, CaretRightIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useState, type ComponentProps, type ReactNode } from 'react';

import { disclosureCaret, disclosurePanelMotion } from '../accordion/accordion';
import { cn } from '../lib/cn';

export type ReasoningStatus = 'thinking' | 'done' | 'failed';

/** Words the reasoning disclosure says, for apps that translate or reword them. */
export interface ReasoningMessages {
  thinking: string;
  /** The summary once done; `seconds` is undefined when no duration is known. */
  done: (seconds: number | undefined) => string;
  failed: string;
}

export const REASONING_MESSAGES: ReasoningMessages = {
  thinking: 'Thinking',
  done: (seconds) =>
    seconds === undefined
      ? 'Reasoning'
      : `Thought for ${String(Math.max(1, Math.round(seconds)))} ${Math.round(seconds) === 1 ? 'second' : 'seconds'}`,
  failed: 'Stopped thinking',
};

export interface ReasoningProps extends Omit<
  ComponentProps<typeof BaseCollapsible.Root>,
  'className' | 'children' | 'defaultOpen'
> {
  status: ReasoningStatus;
  /** How long the model thought, in seconds, for the summary. */
  duration?: number | undefined;
  /**
   * Open while thinking and fold away when done, unless the reader opened or closed it. Default
   * true; ignored when `open` is controlled.
   */
  followStatus?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  messages?: Partial<ReasoningMessages> | undefined;
  /** The model's reasoning, normally `Markdown` at `size="sm"`. */
  children?: ReactNode;
  className?: string | undefined;
}

/**
 * The model's reasoning behind a reply, as a quiet disclosure. While it thinks, the summary says
 * so and the text shows as it arrives; when it is done it folds to "Thought for 12 seconds" so the
 * answer leads. A reader who opens or closes it keeps their choice. The text sits behind a
 * hairline at the start edge in a muted colour, clearly apart from the answer itself.
 */
export function Reasoning({
  status,
  duration,
  followStatus = true,
  defaultOpen,
  open: openProp,
  onOpenChange,
  messages: overrides,
  className,
  children,
  ...props
}: ReasoningProps) {
  const m = { ...REASONING_MESSAGES, ...overrides };
  const [chosen, setChosen] = useState<boolean | null>(defaultOpen ?? null);
  const open = openProp ?? chosen ?? (followStatus && status === 'thinking');
  const summary =
    status === 'thinking' ? m.thinking : status === 'failed' ? m.failed : m.done(duration);
  return (
    <BaseCollapsible.Root
      data-slot="reasoning"
      data-status={status}
      open={open}
      onOpenChange={(next, details) => {
        setChosen(next);
        onOpenChange?.(next, details);
      }}
      className={cn('flex min-w-0 flex-col gap-2', className)}
      {...props}
    >
      <BaseCollapsible.Trigger
        className={cn(
          'group/trigger inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-control py-1 text-sm font-medium text-fg-muted',
          'relative pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2 hover:text-fg',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        {status === 'failed' ? (
          <WarningCircleIcon aria-hidden weight="bold" className="size-4 shrink-0" />
        ) : (
          <BrainIcon
            aria-hidden
            weight="bold"
            className={cn(
              'size-4 shrink-0',
              status === 'thinking' && 'animate-breathe text-accent-strong',
            )}
          />
        )}
        <span>{summary}</span>
        <CaretRightIcon
          aria-hidden
          weight="bold"
          className={cn(
            disclosureCaret,
            'size-3.5 group-data-panel-open/trigger:rotate-90 rtl:-scale-x-100',
          )}
        />
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className={disclosurePanelMotion}>
        <div className="rounded-control bg-surface-sunken px-3 py-2.5 text-sm text-fg-muted">
          {children}
        </div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
