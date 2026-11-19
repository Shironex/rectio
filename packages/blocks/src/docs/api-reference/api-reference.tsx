import { Tabs, TabsPanel, TabsTab, cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { CodeBlock } from '../code-block/code-block';
import type { CodeLine } from '../code-block/code-block.logic';
import { DocsBadge } from '../lib/badge';
import { slugify } from '../lib/docs';
import { useDocsParts } from '../lib/parts';

export interface PropRow {
  name: string;
  /** The TypeScript type as written, such as `'line' | 'bar'` or `(job: Job) => Promise<void>`. */
  type: string;
  default?: string | undefined;
  description?: ReactNode;
  required?: boolean | undefined;
  deprecated?: boolean | undefined;
}

export interface PropsTableProps {
  rows: readonly PropRow[];
  /** Names the table for assistive technology, such as "createQueue options". */
  label?: string;
  /** Column headings, for translation. */
  labels?: Partial<Record<'name' | 'type' | 'default' | 'description' | 'required', string>>;
  className?: string;
}

const DEFAULT_LABELS = {
  name: 'Prop',
  type: 'Type',
  default: 'Default',
  description: 'Description',
  required: 'Required',
};

function TypeText({ children }: { children: string }) {
  return <code className="font-mono text-sm break-words text-code-token-function">{children}</code>;
}

/**
 * Props or options as a table: name, type, default, description, with required and deprecated
 * marked in words. In a narrow column it becomes a stacked list, one entry per prop, so nothing
 * scrolls sideways.
 */
export function PropsTable({ rows, label, labels, className }: PropsTableProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  return (
    <div data-slot="props-table" className={cn('@container min-w-0', className)}>
      <div className="hidden overflow-hidden rounded-panel border border-line @2xl:block">
        <table aria-label={label} className="w-full border-collapse text-sm">
          <thead className="bg-surface-sunken text-start">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start font-medium text-fg">
                {text.name}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium text-fg">
                {text.type}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium text-fg">
                {text.default}
              </th>
              <th scope="col" className="w-2/5 px-4 py-2.5 text-start font-medium text-fg">
                {text.description}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-line align-top">
                <th scope="row" className="px-4 py-3 text-start font-regular">
                  <PropName row={row} required={text.required} />
                </th>
                <td className="px-4 py-3">
                  <TypeText>{row.type}</TypeText>
                </td>
                <td className="px-4 py-3">
                  {row.default === undefined ? (
                    <span className="text-fg-subtle">
                      <span aria-hidden>-</span>
                      <span className="sr-only">None</span>
                    </span>
                  ) : (
                    <code className="font-mono text-sm text-fg">{row.default}</code>
                  )}
                </td>
                <td className="px-4 py-3 text-pretty text-fg-muted">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl aria-label={label} className="flex flex-col rounded-panel border border-line @2xl:hidden">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex flex-col gap-1.5 border-line px-4 py-3 not-first:border-t"
          >
            <dt>
              <PropName row={row} required={text.required} />
            </dt>
            <dd className="flex flex-col gap-1.5">
              <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="sr-only">{text.type}:</span>
                <TypeText>{row.type}</TypeText>
                {row.default !== undefined && (
                  <span className="text-fg-subtle">
                    {text.default} <code className="font-mono text-fg">{row.default}</code>
                  </span>
                )}
              </span>
              {row.description !== undefined && (
                <span className="text-sm text-pretty text-fg-muted">{row.description}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PropName({ row, required }: { row: PropRow; required: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <code
        className={cn(
          'font-mono text-sm font-strong text-fg',
          row.deprecated === true && 'font-regular text-fg-muted line-through',
        )}
      >
        {row.name}
      </code>
      {row.required === true && <DocsBadge tone="neutral">{required}</DocsBadge>}
      {row.deprecated === true && <DocsBadge tone="deprecated">Deprecated</DocsBadge>}
    </span>
  );
}

export interface SignatureParam {
  name: string;
  type: string;
  description?: ReactNode;
  optional?: boolean | undefined;
}

export interface SignatureCardProps {
  /** The function or method name, also the anchor id. */
  name: string;
  /** The signature as code, such as `queue.add(name, payload, options?)`. */
  signature: string;
  /** Highlighted tokens of the signature, from the same highlighter as the code blocks. */
  tokens?: readonly CodeLine[] | undefined;
  kind?: 'function' | 'method' | 'class' | 'hook' | 'type' | undefined;
  description?: ReactNode;
  params?: readonly SignatureParam[] | undefined;
  returns?: { type: string; description?: ReactNode } | undefined;
  /** The version that introduced it, such as "1.4". */
  since?: string | undefined;
  deprecated?: boolean | undefined;
  /** Heading level of the name: 3 under a page section. */
  level?: 2 | 3 | 4;
  /** Example code under the parameters. */
  children?: ReactNode;
  className?: string;
}

/**
 * One function, method or class: its signature as code, what it does, its parameters and what it
 * returns. The name is a heading with an anchor, so the page's table of contents and links reach
 * each entry.
 */
export function SignatureCard({
  name,
  signature,
  tokens,
  kind = 'function',
  description,
  params,
  returns,
  since,
  deprecated = false,
  level = 3,
  children,
  className,
}: SignatureCardProps) {
  const Heading = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
  const id = slugify(name);
  return (
    <section
      aria-labelledby={id}
      data-slot="signature-card"
      className={cn(
        '@container flex flex-col gap-4 rounded-panel border border-line bg-surface p-5',
        className,
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Heading id={id} className="scroll-mt-24 font-mono text-lg font-strong text-fg">
          <a
            href={`#${id}`}
            className="rounded-control outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
          >
            {name}
          </a>
        </Heading>
        <span className="text-xs font-medium tracking-caps text-fg-muted uppercase">{kind}</span>
        {since !== undefined && <DocsBadge tone="neutral">Since {since}</DocsBadge>}
        {deprecated && <DocsBadge tone="deprecated">Deprecated</DocsBadge>}
      </header>
      <CodeBlock code={signature} tokens={tokens} lang="ts" copy={false} wrap />
      {description !== undefined && (
        <div className="text-base text-pretty text-fg-muted">{description}</div>
      )}
      {params !== undefined && params.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-strong text-fg">Parameters</h4>
          <dl className="flex flex-col divide-y divide-line border-y border-line">
            {params.map((param) => (
              <div key={param.name} className="flex flex-col gap-1 py-2.5 @lg:flex-row @lg:gap-4">
                <dt className="flex shrink-0 items-baseline gap-2 @lg:w-56">
                  <code className="font-mono text-sm font-strong text-fg">
                    {param.name}
                    {param.optional === true && <span className="text-fg-subtle">?</span>}
                  </code>
                  <TypeText>{param.type}</TypeText>
                </dt>
                <dd className="text-sm text-pretty text-fg-muted">
                  {param.optional === true && <span className="sr-only">Optional. </span>}
                  {param.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {returns !== undefined && (
        <p className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="font-strong text-fg">Returns</span>
          <TypeText>{returns.type}</TypeText>
          {returns.description !== undefined && (
            <span className="text-fg-muted">{returns.description}</span>
          )}
        </p>
      )}
      {children}
    </section>
  );
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const METHOD_TONE: Record<HttpMethod, string> = {
  GET: 'border-info-strong/25 bg-info-subtle text-info-strong',
  POST: 'border-positive-strong/25 bg-positive-subtle text-positive-strong',
  PUT: 'border-warning-strong/30 bg-warning-subtle text-warning-strong',
  PATCH: 'border-warning-strong/30 bg-warning-subtle text-warning-strong',
  DELETE: 'border-negative-strong/25 bg-negative-subtle text-negative-strong',
};

/** The HTTP method in words, tinted by kind: read, create, change, delete. */
export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
  return (
    <span
      data-slot="method-badge"
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-badge border px-1.5 font-mono text-xs font-strong',
        METHOD_TONE[method],
        className,
      )}
    >
      {method}
    </span>
  );
}

export interface EndpointResponse {
  /** The HTTP status, such as 200 or 404. */
  status: number;
  description?: string | undefined;
  /** An example body. */
  example?: string | undefined;
  tokens?: readonly CodeLine[] | undefined;
  lang?: string | undefined;
}

export interface EndpointProps {
  method: HttpMethod;
  /** The path with its parameters, such as `/v1/queues/:queue/jobs`. */
  path: string;
  /** A short name, such as "Enqueue a job". It is the heading and the anchor. */
  title: string;
  description?: ReactNode;
  /** Who may call it, such as "API key with the jobs:write scope". */
  auth?: ReactNode;
  pathParams?: readonly PropRow[] | undefined;
  queryParams?: readonly PropRow[] | undefined;
  body?: readonly PropRow[] | undefined;
  /** A request example, such as a curl command. */
  request?: { code: string; lang?: string; tokens?: readonly CodeLine[] } | undefined;
  responses?: readonly EndpointResponse[] | undefined;
  level?: 2 | 3;
  className?: string;
}

/** `/v1/queues/:queue/jobs` with `:queue` set apart, so parameters read at a glance. */
function PathText({ path }: { path: string }) {
  const parts = path.split(/(:[a-zA-Z_]\w*|\{[a-zA-Z_]\w*\})/);
  return (
    <code className="min-w-0 font-mono text-sm break-all text-fg">
      {parts.map((part, index) =>
        /^(:|\{)/.test(part) ? (
          // Parts are positional within the path.
          <span key={index} className="text-code-token-parameter">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </code>
  );
}

/**
 * One HTTP endpoint: method and path, what it does, who may call it, its path, query and body
 * parameters, a request example and example responses by status.
 */
export function Endpoint({
  method,
  path,
  title,
  description,
  auth,
  pathParams,
  queryParams,
  body,
  request,
  responses,
  level = 3,
  className,
}: EndpointProps) {
  const { TabsList } = useDocsParts();
  const Heading = level === 2 ? 'h2' : 'h3';
  const id = slugify(title);
  const groups: [string, readonly PropRow[] | undefined][] = [
    ['Path parameters', pathParams],
    ['Query parameters', queryParams],
    ['Body', body],
  ];
  return (
    <section
      aria-labelledby={id}
      data-slot="endpoint"
      className={cn('flex flex-col gap-5', className)}
    >
      <div className="flex flex-col gap-3">
        <Heading id={id} className="scroll-mt-24 font-display text-xl font-heading text-fg">
          <a
            href={`#${id}`}
            className="rounded-control outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
          >
            {title}
          </a>
        </Heading>
        <div className="flex min-w-0 items-center gap-2.5 rounded-panel border border-line bg-code-background px-3 py-2">
          <MethodBadge method={method} />
          <PathText path={path} />
        </div>
        {description !== undefined && (
          <div className="text-base text-pretty text-fg-muted">{description}</div>
        )}
        {auth !== undefined && (
          <p className="text-sm text-fg-muted">
            <span className="font-strong text-fg">Authorization</span> {auth}
          </p>
        )}
      </div>
      {groups.map(([label, rows]) =>
        rows === undefined || rows.length === 0 ? null : (
          <div key={label} className="flex flex-col gap-2">
            <h4 className="text-sm font-strong text-fg">{label}</h4>
            <PropsTable
              rows={rows}
              label={`${title}: ${label.toLowerCase()}`}
              labels={{ name: 'Name' }}
            />
          </div>
        ),
      )}
      {request !== undefined && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-strong text-fg">Request</h4>
          <CodeBlock code={request.code} tokens={request.tokens} lang={request.lang ?? 'sh'} />
        </div>
      )}
      {responses !== undefined && responses.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-strong text-fg">Responses</h4>
          <Tabs
            defaultValue={String(responses[0]?.status)}
            className="min-w-0 overflow-hidden rounded-panel border border-line bg-code-background"
          >
            <TabsList aria-label={`${title} responses`} className="px-2">
              {responses.map((response) => (
                <TabsTab key={response.status} value={String(response.status)} className="gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 rounded-full',
                      response.status < 300
                        ? 'bg-positive'
                        : response.status < 500
                          ? 'bg-warning'
                          : 'bg-negative',
                    )}
                  />
                  <span className="font-mono">{response.status}</span>
                </TabsTab>
              ))}
            </TabsList>
            {responses.map((response) => (
              <TabsPanel
                key={response.status}
                value={String(response.status)}
                className="pt-0 focus-visible:rounded-none focus-visible:-outline-offset-2"
              >
                {response.description !== undefined && (
                  <p className="border-b border-line px-4 py-2.5 text-sm text-fg-muted">
                    {response.description}
                  </p>
                )}
                {response.example !== undefined && (
                  <CodeBlock
                    framed={false}
                    code={response.example}
                    tokens={response.tokens}
                    lang={response.lang ?? 'json'}
                  />
                )}
              </TabsPanel>
            ))}
          </Tabs>
        </div>
      )}
    </section>
  );
}
