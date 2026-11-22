'use client';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import {
  CaretRightIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { disclosureCaret, disclosurePanelMotion } from '../accordion/accordion';
import { cn } from '../lib/cn';
import {
  type ToolCallStatus,
  type ToolCallMessages,
  TOOL_CALL_MESSAGES,
  formatToolValue,
} from './tool-call-messages';

export interface ToolCallProps extends Omit<
  ComponentProps<typeof BaseCollapsible.Root>,
  'className' | 'children' | 'title'
> {
  /** The tool's name as the model called it, such as `search_invoices`. */
  name: string;
  /** What it did in words, such as "Searched unpaid invoices". The name shows when omitted. */
  title?: ReactNode;
  status: ToolCallStatus;
  /** The arguments, shown as formatted JSON. */
  args?: unknown;
  /** What the tool returned: any value is shown as JSON, a React element as it is (a table, a card). */
  result?: unknown;
  /** Why it failed. Shown with `status: 'failed'`. */
  error?: ReactNode;
  /** How long it took, already in words, such as "1.2 s". */
  duration?: ReactNode;
  messages?: Partial<ToolCallMessages> | undefined;
  className?: string | undefined;
}

const STATUS_ICON = {
  running: (
    <CircleNotchIcon
      aria-hidden
      weight="bold"
      className="size-4 shrink-0 animate-spin text-fg-subtle motion-reduce:animate-breathe"
    />
  ),
  done: (
    <CheckCircleIcon aria-hidden weight="fill" className="size-4 shrink-0 text-positive-strong" />
  ),
  failed: (
    <WarningCircleIcon aria-hidden weight="fill" className="size-4 shrink-0 text-negative-strong" />
  ),
} as const;

/** A labelled block of monospaced data inside a disclosure. */
export function DisclosureData({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-1.5">
      <h4 className="text-xs font-medium tracking-caps text-fg-subtle uppercase">{label}</h4>
      {children}
    </section>
  );
}

const codeBox = cn(
  'm-0 max-h-72 overflow-auto rounded-control bg-code-background px-3 py-2 font-mono text-sm text-code-foreground',
  'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus',
);

/** Code in a box that takes a tab stop only when it scrolls, so a short value adds no stop. */
function ScrollingPre({ label, children }: { label: string; children: string }) {
  const box = useRef<HTMLPreElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useLayoutEffect(() => {
    const element = box.current;
    if (element === null) return;
    const check = () => {
      setScrolls(
        element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1,
      );
    };
    check();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [children]);
  return (
    <pre ref={box} tabIndex={scrolls ? 0 : undefined} aria-label={label} className={codeBox}>
      <code>{children}</code>
    </pre>
  );
}

/**
 * One call the assistant made to a tool, folded into a row: an icon and a word for its status
 * (running, done, failed), what it did, and how long it took. Open, it shows the arguments and the
 * result as formatted JSON, or the result as any element the app renders, such as an invoice
 * table. Status is in words and shape, never colour alone.
 */
export function ToolCall({
  name,
  title,
  status,
  args,
  result,
  error,
  duration,
  messages: overrides,
  className,
  ...props
}: ToolCallProps) {
  const m = { ...TOOL_CALL_MESSAGES, ...overrides };
  const hasArgs = args !== undefined;
  const hasResult = result !== undefined && status !== 'running';
  const word = m[status];
  return (
    <BaseCollapsible.Root
      data-slot="tool-call"
      data-status={status}
      className={cn('flex w-full min-w-0 flex-col gap-2', className)}
      {...props}
    >
      <BaseCollapsible.Trigger
        className={cn(
          'group/trigger flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-control py-1 text-start text-sm text-fg-muted',
          // A full touch-height row on touch screens, as a Collapsible trigger: rows stacked in a reply
          // then never share a target.
          'pointer-coarse:min-h-(--rx-control-height-touch) hover:text-fg',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        {STATUS_ICON[status]}
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="text-pretty">{title ?? <span className="font-mono">{name}</span>}</span>
        </span>
        <span
          className={cn(
            'shrink-0 text-xs',
            status === 'failed' ? 'font-medium text-negative-strong' : 'text-fg-subtle',
          )}
        >
          {/* Done is already the check; it stays in words for a screen reader. */}
          <span className={cn(status === 'done' && duration !== undefined && 'sr-only')}>
            {word}
          </span>
          {duration !== undefined && status !== 'running' && (
            <span className="numeric">
              <span className="sr-only">, </span>
              {status === 'done' ? '' : ', '}
              {duration}
            </span>
          )}
        </span>
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
        <div className="flex flex-col gap-3 rounded-control bg-surface-sunken p-3">
          {title !== undefined && <p className="font-mono text-xs text-fg-subtle">{name}</p>}
          {hasArgs && (
            <DisclosureData label={m.input}>
              <ScrollingPre label={`${m.input}: ${name}`}>{formatToolValue(args)}</ScrollingPre>
            </DisclosureData>
          )}
          {status === 'failed' && error !== undefined && (
            <DisclosureData label={m.error}>
              <p className="text-sm text-negative-strong">{error}</p>
            </DisclosureData>
          )}
          {hasResult && (
            <DisclosureData label={m.output}>
              {isValidElement(result) ? (
                <div className="min-w-0">{result}</div>
              ) : (
                <ScrollingPre label={`${m.output}: ${name}`}>
                  {formatToolValue(result)}
                </ScrollingPre>
              )}
            </DisclosureData>
          )}
        </div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}

export {
  type ToolCallStatus,
  type ToolCallMessages,
  TOOL_CALL_MESSAGES,
  formatToolValue,
} from './tool-call-messages';
