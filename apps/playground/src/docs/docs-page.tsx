import { AnchorSimpleIcon, BookOpenTextIcon, RocketLaunchIcon } from '@phosphor-icons/react';
import * as plain from '@rectio/blocks/docs';
import { createLocalSearch, tokensFromText, type DocsNavSection } from '@rectio/blocks/docs';
import * as moving from '@rectio/blocks/docs/motion';
import { Kbd, ThemeScope } from '@rectio/ui';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';

type Blocks = typeof plain;

const NAV: DocsNavSection[] = [
  {
    title: 'Get started',
    items: [
      { title: 'Introduction', href: '/docs/intro' },
      { title: 'Installation', href: '/docs/install' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Retries and backoff', href: '/docs/retries' },
      { title: 'Schedules', href: '/docs/schedules', badge: 'New' },
      {
        title: 'Deploying',
        href: '/docs/deploy',
        items: [
          { title: 'Containers', href: '/docs/containers' },
          { title: 'Serverless', href: '/docs/serverless', badge: 'Beta' },
        ],
      },
    ],
  },
  {
    title: 'Reference',
    items: [
      { title: 'JavaScript API', href: '/docs/api' },
      { title: 'Changelog', href: '/docs/changelog' },
    ],
  },
];

const search = createLocalSearch([
  {
    id: 'retries',
    title: 'Retries and backoff',
    href: '#retries',
    group: 'Guides',
    headings: [{ id: 'policy', title: 'Set a policy per queue' }],
    content: 'Failed jobs retry with exponential backoff and jitter.',
  },
  {
    id: 'install',
    title: 'Installation',
    href: '#install',
    group: 'Get started',
    content: 'Install the package, create the config and start a worker.',
  },
]);

/** shiki would produce these at build time; a few hand-made tokens stand in for it here. */
const k = (content: string) => ({ content, color: 'var(--rx-code-token-keyword)' });
const f = (content: string) => ({ content, color: 'var(--rx-code-token-function)' });
const s = (content: string) => ({ content, color: 'var(--rx-code-token-string)' });
const n = (content: string) => ({ content, color: 'var(--rx-code-token-constant)' });
const t = (content: string) => ({ content });
const QUEUE = [
  [k('import'), t(' { defineQueue } '), k('from'), t(' '), s("'@halyard/core'"), t(';')],
  [],
  [k('export const'), t(' webhooks = '), f('defineQueue'), t('('), s("'webhooks'"), t(', {')],
  [t('  retries: { attempts: '), n('8'), t(', backoff: '), s("'exponential'"), t(' },')],
  [t('  '), k('async'), t(' '), f('run'), t('(job: { url: '), k('string'), t(' }) {')],
  [t('    '), k('await'), t(' '), f('fetch'), t('(job.url, { method: '), s("'POST'"), t(' });')],
  [t('  },')],
  [t('});')],
];

const QUEUE_TEXT = QUEUE.map((line) => line.map((token) => token.content).join('')).join('\n');

const LOREM =
  'A failed job is retried with exponential backoff, waiting a little longer after each attempt so a struggling service can recover.';

function Brand() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex size-7 items-center justify-center rounded-control bg-accent text-fg-on-accent">
        <AnchorSimpleIcon aria-hidden weight="bold" className="size-4" />
      </span>
      <span className="font-display text-base font-strong text-fg">Halyard</span>
    </span>
  );
}

function Header({ blocks }: { blocks: Blocks }) {
  return (
    <blocks.DocsHeader
      brand={<Brand />}
      brandLabel="Halyard docs home"
      links={[
        { label: 'Docs', href: '#intro' },
        { label: 'API', href: '#api' },
        { label: 'Changelog', href: '#changelog' },
      ]}
      currentHref="#intro"
      search={<blocks.DocsSearch search={search} onNavigate={() => undefined} />}
      mobileNav={<blocks.DocsSidebar sections={NAV} currentHref="/docs/retries" />}
      actions={
        <>
          <blocks.VersionSwitcher
            current="2"
            versions={[
              { value: '2', label: 'v2', href: '#', note: 'Latest' },
              { value: '1', label: 'v1', href: '#', note: 'Legacy' },
            ]}
            className="max-md:hidden"
          />
          <blocks.LanguageSwitcher
            current="en"
            compact
            languages={[
              { value: 'en', label: 'English', href: '#' },
              { value: 'de', label: 'Deutsch', href: '#' },
            ]}
          />
        </>
      }
    />
  );
}

function Article({ blocks }: { blocks: Blocks }) {
  return (
    <article>
      <h1 className="mb-3 font-display text-4xl font-heading tracking-tight text-fg">
        Retries and backoff
      </h1>
      <p className="mb-8 max-w-prose text-lg text-fg-muted">
        Decide how many times a job tries again and how long it waits in between.
      </p>
      <blocks.DocsProse>
        <p>
          {LOREM} Press <Kbd>R</Kbd> in the dashboard to retry a failed job.
        </p>
        <blocks.DocsHeading level={2} badge={<blocks.DocsBadge tone="new">2.4</blocks.DocsBadge>}>
          Set a policy per queue
        </blocks.DocsHeading>
        <blocks.CodeBlock
          tokens={QUEUE}
          code={QUEUE_TEXT}
          lang="ts"
          title="src/queues/webhooks.ts"
          highlight="{4}"
          lineNumbers
        />
        <blocks.InstallTabs command="npm install @halyard/core" />
        <blocks.CodeTabs
          label="Backoff"
          items={[
            { label: 'Exponential', code: "backoff: 'exponential'", lang: 'ts' },
            { label: 'Fixed', code: "backoff: { fixed: '30s' }", lang: 'ts' },
          ]}
        />
        <blocks.CodeBlock
          diff
          lang="ts"
          title="src/queues/receipts.ts"
          tokens={tokensFromText(
            " if (!order) {\n-  throw new Error('Order not found');\n+  throw new PermanentError('Order not found');\n }",
          )}
        />
        <blocks.Callout type="note">Retries are on by default: three attempts.</blocks.Callout>
        <blocks.Callout type="tip">
          Add jitter so failed jobs do not return together.
        </blocks.Callout>
        <blocks.Callout type="warning">Postgres needs `halyard migrate` first.</blocks.Callout>
        <blocks.Callout type="danger" title="Make jobs safe to run twice">
          A worker can crash after the work and before it records the result.
        </blocks.Callout>
        <blocks.DocsHeading level={2}>Set it up</blocks.DocsHeading>
        <blocks.Steps>
          <blocks.Step title="Install the package">
            <p>One package with the queue, the worker and the CLI.</p>
          </blocks.Step>
          <blocks.Step title="Define a queue">
            <p>A name and a run function.</p>
          </blocks.Step>
          <blocks.Step title="Start a worker">
            <p>In its own process.</p>
          </blocks.Step>
        </blocks.Steps>
        <blocks.FileTree
          entries={[
            {
              name: 'src',
              defaultOpen: true,
              children: [
                { name: 'queues', defaultOpen: true, children: [{ name: 'webhooks.ts' }] },
                { name: 'worker.ts', highlight: true, note: 'runs the queues' },
              ],
            },
            { name: 'halyard.config.ts' },
          ]}
        />
        <blocks.DocsTable label="Requirements">
          <table>
            <thead>
              <tr>
                <th>Runtime</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Node.js</td>
                <td>20 or later</td>
              </tr>
              <tr>
                <td>Bun</td>
                <td>1.2 or later</td>
              </tr>
            </tbody>
          </table>
        </blocks.DocsTable>
        <blocks.DocsHeading level={2} id="api">
          API reference
        </blocks.DocsHeading>
        <blocks.SignatureCard
          name="queue.add"
          kind="method"
          signature="add(job: Job, options?: AddOptions): Promise<JobHandle<Result>>"
          description="Adds a job. Resolves once the store has it."
          params={[
            { name: 'job', type: 'Job', description: 'The payload.' },
            { name: 'options', type: 'AddOptions', optional: true, description: 'Delay and key.' },
          ]}
          returns={{ type: 'Promise<JobHandle<Result>>' }}
          since="2.0.0"
        />
        <blocks.PropsTable
          label="QueueOptions"
          rows={[
            {
              name: 'run',
              type: '(job: Job) => Promise<Result>',
              required: true,
              description: 'Does the work.',
            },
            {
              name: 'retries',
              type: 'RetryPolicy',
              default: '{ attempts: 3 }',
              description: 'Retry policy.',
            },
            {
              name: 'priority',
              type: 'number',
              deprecated: true,
              description: 'Use lanes instead.',
            },
          ]}
        />
        <blocks.Endpoint
          method="POST"
          path="/v1/queues/:queue/jobs"
          title="Enqueue a job"
          auth="An API key with the jobs:write scope."
          pathParams={[
            { name: 'queue', type: 'string', required: true, description: 'The queue name.' },
          ]}
          responses={[
            {
              status: 201,
              description: 'Added.',
              example: '{ "id": "job_01HZX3K9" }',
              lang: 'json',
            },
            {
              status: 404,
              description: 'No such queue.',
              example: '{ "error": "queue_not_found" }',
              lang: 'json',
            },
          ]}
        />
      </blocks.DocsProse>
    </article>
  );
}

function DocsArticlePage({ blocks }: { blocks: Blocks }) {
  return (
    <blocks.DocsLayout
      header={<Header blocks={blocks} />}
      sidebar={<blocks.DocsSidebar sections={NAV} currentHref="/docs/retries" />}
      toc={
        <blocks.DocsToc
          headings={[
            { id: 'set-a-policy-per-queue', title: 'Set a policy per queue', level: 2 },
            { id: 'set-it-up', title: 'Set it up', level: 2 },
            { id: 'api', title: 'API reference', level: 2 },
            { id: 'queue-add', title: 'queue.add', level: 3 },
            { id: 'enqueue-a-job', title: 'Enqueue a job', level: 3 },
          ]}
        />
      }
      top={
        <blocks.DocsBreadcrumb
          items={[{ label: 'Guides', href: '#' }, { label: 'Retries and backoff' }]}
        />
      }
      bottom={
        <>
          <blocks.DocsFeedback
            onSubmit={() => new Promise((resolve) => setTimeout(resolve, 500))}
          />
          <blocks.DocsPageMeta
            editHref="https://example.com/edit"
            lastUpdated="2026-11-04"
            locale="en-GB"
          />
          <blocks.DocsPager
            prev={{ title: 'Installation', href: '#install', section: 'Get started' }}
            next={{ title: 'Schedules', href: '#schedules', section: 'Guides' }}
          />
        </>
      }
    >
      <Article blocks={blocks} />
    </blocks.DocsLayout>
  );
}

function HomePage({ blocks }: { blocks: Blocks }) {
  return (
    <blocks.DocsLayout header={<Header blocks={blocks} />} wide>
      <div className="flex flex-col gap-16">
        <blocks.DocsHero
          eyebrow="New in 2.4: schedules you can pause"
          title="Background jobs your types can trust"
          description="Typed queues, retries, schedules and a dashboard, in one package."
          primary={{ label: 'Get started', href: '#intro' }}
          secondary={{ label: 'API reference', href: '#api' }}
          install="npm install @halyard/core"
          aside={
            <blocks.CodeBlock
              tokens={QUEUE}
              code={QUEUE_TEXT}
              lang="ts"
              title="queues/webhooks.ts"
            />
          }
        />
        <blocks.LinkCards
          title="Start here"
          items={[
            {
              title: 'Installation',
              description: 'Add the package and run a worker.',
              href: '#install',
              icon: <RocketLaunchIcon aria-hidden weight="duotone" className="size-5" />,
            },
            {
              title: 'JavaScript API',
              description: 'Every function and type.',
              href: '#api',
              icon: <BookOpenTextIcon aria-hidden weight="duotone" className="size-5" />,
            },
            {
              title: 'Schedules',
              description: 'Cron with time zones.',
              href: '#schedules',
              badge: 'New',
            },
          ]}
        />
        <blocks.LinkCards
          title="Guides"
          variant="list"
          columns={2}
          items={[
            {
              title: 'Retries and backoff',
              description: 'What to do when a job fails.',
              href: '#retries',
            },
            {
              title: 'Deploying',
              description: 'Workers in containers or functions.',
              href: '#deploy',
            },
          ]}
        />
      </div>
    </blocks.DocsLayout>
  );
}

function ChangelogPage({ blocks }: { blocks: Blocks }) {
  return (
    <blocks.DocsLayout header={<Header blocks={blocks} />} wide>
      <h1 className="mb-8 font-display text-4xl font-heading tracking-tight text-fg">Changelog</h1>
      <blocks.Changelog
        locale="en-GB"
        releases={[
          {
            version: '2.4.0',
            date: '2026-11-04',
            title: 'Schedules you can pause',
            summary: 'Schedules gained a paused state, and retries wait with jitter.',
            changes: [
              {
                type: 'feature',
                text: 'schedule.pause() and schedule.resume().',
                ref: { label: 'PR 812', href: '#' },
              },
              { type: 'improvement', text: 'Backoff adds up to 20% jitter.' },
              { type: 'fix', text: 'A timed out job is retried instead of lost.' },
            ],
          },
          {
            version: '2.0.0',
            date: '2026-06-02',
            title: 'Halyard 2',
            changes: [
              { type: 'breaking', text: 'Node 20 or later is required.' },
              { type: 'deprecation', text: 'job.progress(number) is deprecated.' },
              { type: 'security', text: 'The dashboard checks the session on every route.' },
            ],
            href: '#',
          },
        ]}
      />
    </blocks.DocsLayout>
  );
}

/** Every docs block in context: `?view=docs`, with `&page=home` or `&page=changelog`. */
export function DocsPage({ theme, mode, motion }: { theme: ThemeId; mode: Mode; motion: boolean }) {
  const page = new URLSearchParams(window.location.search).get('page');
  const blocks: Blocks = motion ? moving : plain;
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      className="min-h-dvh bg-surface-canvas text-fg"
    >
      {page === 'home' ? (
        <HomePage blocks={blocks} />
      ) : page === 'changelog' ? (
        <ChangelogPage blocks={blocks} />
      ) : (
        <DocsArticlePage blocks={blocks} />
      )}
    </ThemeScope>
  );
}
