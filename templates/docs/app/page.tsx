import {
  ArrowsClockwiseIcon,
  BookOpenTextIcon,
  BracketsCurlyIcon,
  CalendarDotsIcon,
  CloudArrowUpIcon,
  RocketLaunchIcon,
  TerminalWindowIcon,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import { DocsHero, DocsLayout, LinkCards } from '@/components/blocks';
import { Code } from '@/components/code';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { RELEASES } from '@/content/changelog';
import { SITE } from '@/data/site';
import { CHANGE_LABELS } from '@/lib/changes';
import { getNav } from '@/lib/content';

const SAMPLE = `import { defineQueue } from '@halyard/core';

export const emails = defineQueue('emails', {
  retries: { attempts: 5, backoff: 'exponential' },
  async run(job: { to: string; template: Template }) {
    await send(job.to, job.template);
  },
});

await emails.add({ to: 'ada@example.com', template: 'welcome' });`;

const icon = 'size-5';

export default function HomePage() {
  const latest = RELEASES[0];
  return (
    <DocsLayout
      header={<SiteHeader sections={getNav()} currentHref="/" />}
      footer={<SiteFooter />}
      wide
    >
      <div className="flex flex-col gap-16 pb-8 sm:gap-20">
        <DocsHero
          eyebrow={
            latest === undefined ? undefined : (
              <Link
                href="/changelog"
                className="rounded-control outline-offset-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
              >
                New in {latest.version}: {latest.title ?? 'see the changelog'}
              </Link>
            )
          }
          title="Background jobs your types can trust"
          description={SITE.description}
          primary={{ label: 'Get started', href: '/docs' }}
          secondary={{ label: 'API reference', href: '/docs/api' }}
          install={SITE.install}
          aside={<Code code={SAMPLE} lang="ts" meta='title="queues/emails.ts"' />}
        />
        <LinkCards
          title="Start here"
          columns={3}
          items={[
            {
              title: 'Installation',
              description: 'Add the package, connect Redis or Postgres and run your first worker.',
              href: '/docs/installation',
              icon: <RocketLaunchIcon aria-hidden weight="duotone" className={icon} />,
            },
            {
              title: 'Configuration',
              description:
                'Every option of halyard.config.ts, with its default and when to change it.',
              href: '/docs/configuration',
              icon: <BracketsCurlyIcon aria-hidden weight="duotone" className={icon} />,
            },
            {
              title: 'JavaScript API',
              description: 'defineQueue, the worker, jobs and events, with their full signatures.',
              href: '/docs/api',
              icon: <BookOpenTextIcon aria-hidden weight="duotone" className={icon} />,
            },
          ]}
        />
        <LinkCards
          title="Guides"
          variant="list"
          columns={2}
          items={[
            {
              title: 'Retries and backoff',
              description: 'Decide what a failure costs and how long to wait before trying again.',
              href: '/docs/retries',
              icon: <ArrowsClockwiseIcon aria-hidden weight="duotone" className={icon} />,
            },
            {
              title: 'Scheduled jobs',
              description: 'Cron schedules, time zones, and pausing a schedule without losing it.',
              href: '/docs/schedules',
              icon: <CalendarDotsIcon aria-hidden weight="duotone" className={icon} />,
              badge: 'New',
            },
            {
              title: 'Deploying',
              description:
                'Workers in containers or functions, and shutting down without losing jobs.',
              href: '/docs/deploy',
              icon: <CloudArrowUpIcon aria-hidden weight="duotone" className={icon} />,
            },
            {
              title: 'HTTP API',
              description: 'Enqueue and inspect jobs from any language over HTTP.',
              href: '/docs/http-api',
              icon: <TerminalWindowIcon aria-hidden weight="duotone" className={icon} />,
            },
          ]}
        />
        {latest !== undefined && (
          <section
            aria-labelledby="latest-release"
            className="grid gap-6 border-t border-line pt-10 md:grid-cols-3"
          >
            <div className="flex flex-col gap-2">
              <h2
                id="latest-release"
                className="font-display text-xl font-heading tracking-tight text-fg"
              >
                Latest release
              </h2>
              <p className="text-sm text-fg-muted">
                <span className="font-mono font-medium text-fg">{latest.version}</span>
                {latest.title === undefined ? null : `, ${latest.title}`}
              </p>
              <Link
                href="/changelog"
                className="w-fit rounded-control text-sm font-medium text-accent-strong underline decoration-accent-strong/40 underline-offset-4 outline-offset-2 hover:decoration-accent-strong focus-visible:outline-2 focus-visible:outline-focus"
              >
                Read the changelog
              </Link>
            </div>
            <ul className="flex flex-col gap-3 md:col-span-2">
              {latest.changes.map((change) => (
                <li key={change.text} className="flex gap-3 text-base text-pretty text-fg-muted">
                  <span className="w-20 shrink-0 pt-0.5 text-xs font-strong tracking-caps text-fg uppercase">
                    {CHANGE_LABELS[change.type]}
                  </span>
                  {change.text}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DocsLayout>
  );
}
