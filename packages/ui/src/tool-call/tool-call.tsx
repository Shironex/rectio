import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import {
  CaretRightIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { disclosureCaret, disclosurePanelMotion } from '../accordion/accordion';
import { cn } from '../lib/cn';

export type ToolCallStatus = 'running' | 'done' | 'failed';

/** Words the tool call says, for apps that translate or reword them. */
export interface ToolCallMessages {
  running: string;
  done: string;
  failed: string;
  input: string;
  output: string;
  error: string;
}

export const TOOL_CALL_MESSAGES: ToolCallMessages = {
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  input: 'Input',
  output: 'Output',
  error: 'Error',
};

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

/** A value as indented JSON; something JSON cannot hold reads as its string form instead. */
export function formatToolValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    // `undefined` and functions stringify to nothing at all.
    const json: unknown = JSON.stringify(value, null, 2);
    return typeof json === 'string' ? json : String(value);
  } catch {
    return String(value);
  }
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
  'm-0 max-h-72 overflow-auto rounded-control border border-line bg-code-background px-3 py-2 font-mono text-sm text-code-foreground',
  'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
);

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
      className={cn('w-full min-w-0 rounded-panel border border-line bg-surface', className)}
      {...props}
    >
      <BaseCollapsible.Trigger
        className={cn(
          'group/trigger flex w-full cursor-pointer items-center gap-2.5 rounded-panel px-3 py-2 text-start text-sm',
          'pointer-coarse:min-h-(--rx-control-height-touch) hover:bg-surface-hover',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        {STATUS_ICON[status]}
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
          <span className="truncate font-medium text-fg">
            {title ?? <span className="font-mono">{name}</span>}
          </span>
          {title !== undefined && (
            <span className="truncate font-mono text-xs text-fg-subtle max-sm:hidden">{name}</span>
          )}
        </span>
        <span
          className={cn(
            'shrink-0 text-xs',
            status === 'failed' ? 'font-medium text-negative-strong' : 'text-fg-subtle',
          )}
        >
          {word}
          {duration !== undefined && status !== 'running' && (
            <span className="numeric">, {duration}</span>
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
        <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
          {hasArgs && (
            <DisclosureData label={m.input}>
              <pre tabIndex={0} aria-label={`${m.input}: ${name}`} className={codeBox}>
                <code>{formatToolValue(args)}</code>
              </pre>
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
                <pre tabIndex={0} aria-label={`${m.output}: ${name}`} className={codeBox}>
                  <code>{formatToolValue(result)}</code>
                </pre>
              )}
            </DisclosureData>
          )}
        </div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
