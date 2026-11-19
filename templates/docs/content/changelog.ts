import type { Release } from '@rectio/blocks/docs';

/**
 * Release notes for /changelog, newest first or in any order (the page sorts by version). Each
 * change has a kind: breaking, security, feature, improvement, fix or deprecation.
 */
export const RELEASES: Release[] = [
  {
    version: '2.4.0',
    date: '2026-11-04',
    title: 'Schedules you can pause',
    summary:
      'Schedules gained a paused state and a next run you can read, and the dashboard shows both. Retries now wait with jitter by default.',
    changes: [
      {
        type: 'feature',
        text: 'schedule.pause() and schedule.resume(), kept across restarts.',
        ref: { label: '#812', href: 'https://github.com/example/halyard/pull/812' },
      },
      { type: 'feature', text: 'schedule.nextRunAt() returns the next run as a Date.' },
      {
        type: 'improvement',
        text: 'Exponential backoff adds up to 20% jitter, so retried jobs no longer arrive in step.',
      },
      {
        type: 'fix',
        text: 'A job that timed out while its worker shut down is retried instead of lost.',
        ref: { label: '#806', href: 'https://github.com/example/halyard/pull/806' },
      },
    ],
  },
  {
    version: '2.3.1',
    date: '2026-10-12',
    changes: [
      {
        type: 'security',
        text: 'The dashboard rejects requests without the session cookie on every route, not only on mutations.',
      },
      {
        type: 'fix',
        text: 'halyard migrate reports the pending migrations instead of exiting silently with --dry-run.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-09-18',
    title: 'Typed events',
    summary:
      'Queues emit typed events for every job state, so metrics and alerts no longer parse logs.',
    changes: [
      {
        type: 'feature',
        text: 'queue.on("completed" | "failed" | "retrying" | "stalled") with the job typed by its queue.',
      },
      {
        type: 'improvement',
        text: 'Workers pick up new jobs 40% sooner under load by polling only when idle.',
      },
      {
        type: 'deprecation',
        text: 'job.progress(number) is deprecated in favour of job.report({ progress }). It still works until 3.0.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-06-02',
    title: 'Halyard 2',
    summary:
      'One package instead of three, a Postgres store beside Redis, and job types inferred from the queue definition.',
    changes: [
      { type: 'breaking', text: 'Node 20 or later is required.' },
      {
        type: 'breaking',
        text: '@halyard/worker and @halyard/scheduler are merged into @halyard/core.',
      },
      { type: 'feature', text: 'A Postgres store, chosen with store: postgres(url).' },
      { type: 'feature', text: 'defineQueue infers the payload and result types of every job.' },
    ],
    href: 'https://github.com/example/halyard/releases/tag/v2.0.0',
  },
];
