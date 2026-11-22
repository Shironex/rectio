import { describe, expect, it } from 'vitest';

import {
  compareVersions,
  copyableText,
  createLocalSearch,
  excerptAround,
  feedbackReducer,
  flattenNav,
  groupChanges,
  matchRanges,
  pagerFor,
  parseCodeMeta,
  parseLineRanges,
  pickActive,
  pushRecent,
  releaseId,
  sectionOf,
  sortReleases,
  splitDiff,
  toPackageManager,
  tokensFromText,
  trailTo,
  uniqueSlugs,
  type DocsNavSection,
  type FeedbackState,
} from '../src/docs';

const NAV: DocsNavSection[] = [
  {
    title: 'Get started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
    ],
  },
  {
    title: 'Guides',
    items: [
      {
        title: 'Queues',
        href: '/docs/queues',
        items: [
          { title: 'Retries', href: '/docs/queues/retries', badge: 'New' },
          { title: 'Schedules', href: '/docs/queues/schedules' },
        ],
      },
      { title: 'GitHub', href: 'https://github.com/example', external: true },
    ],
  },
];

describe('navigation', () => {
  it('lists pages in reading order, children after parents, without external links', () => {
    expect(flattenNav(NAV).map((page) => page.href)).toEqual([
      '/docs',
      '/docs/installation',
      '/docs/queues',
      '/docs/queues/retries',
      '/docs/queues/schedules',
    ]);
  });

  it('finds the previous and next page across sections, ignoring a trailing slash', () => {
    const { prev, next } = pagerFor(NAV, '/docs/installation/');
    expect(prev?.title).toBe('Introduction');
    expect(next).toMatchObject({ title: 'Queues', section: 'Guides' });
    expect(pagerFor(NAV, '/docs').prev).toBeNull();
    expect(pagerFor(NAV, '/nowhere')).toEqual({ prev: null, next: null });
  });

  it('walks the trail to a nested page and names its section', () => {
    expect(trailTo(NAV, '/docs/queues/retries#backoff').map((item) => item.title)).toEqual([
      'Queues',
      'Retries',
    ]);
    expect(sectionOf(NAV, '/docs/queues/schedules')).toBe('Guides');
    expect(trailTo(NAV, '/missing')).toEqual([]);
  });

  it('numbers repeated heading slugs the way Markdown tools do', () => {
    expect(uniqueSlugs(['Options', 'Retries and backoff', 'Options', 'Café'])).toEqual([
      'options',
      'retries-and-backoff',
      'options-1',
      'cafe',
    ]);
  });
});

describe('code blocks', () => {
  it('reads line ranges and the fence meta', () => {
    expect(parseLineRanges('{5-3,1,1}')).toEqual([1, 3, 4, 5]);
    expect(parseCodeMeta('title="queue.ts" {2,4-5} showLineNumbers=10 diff')).toEqual({
      title: 'queue.ts',
      highlight: [2, 4, 5],
      lineNumbers: true,
      diff: true,
      startLine: 10,
    });
    expect(parseCodeMeta(undefined)).toMatchObject({ highlight: [], lineNumbers: false });
  });

  it('clamps highlight ranges to the code instead of filling memory', () => {
    const started = performance.now();
    expect(parseLineRanges('{1-99999999999}', 3)).toEqual([1, 2, 3]);
    expect(parseCodeMeta('{2-99999999999}', 4).highlight).toEqual([2, 3, 4]);
    // Without a line count the range stops at the longest code block there is.
    expect(parseLineRanges('{1-99999999999}')).toHaveLength(10_000);
    expect(parseLineRanges('{0-2,999999999999999999}', 5)).toEqual([1, 2]);
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('strips diff marks, keeps colours and copies the code after the change', () => {
    const lines = [
      [{ content: ' const a = 1;' }],
      [{ content: '-', color: 'var(--rx-code-token-keyword)' }, { content: 'retry: 3' }],
      [{ content: '+retry: ' }, { content: '5', color: 'var(--rx-code-token-constant)' }],
    ];
    const { lines: out, marks } = splitDiff(lines);
    expect(marks).toEqual([null, 'deleted', 'inserted']);
    expect(out[1]).toEqual([{ content: 'retry: 3' }]);
    expect(out[2]?.[1]?.color).toBe('var(--rx-code-token-constant)');
    expect(copyableText(out, marks)).toBe('const a = 1;\nretry: 5');
  });

  it('turns plain text into uncoloured lines without a trailing empty line', () => {
    expect(tokensFromText('a\nb\n')).toEqual([[{ content: 'a' }], [{ content: 'b' }]]);
  });
});

describe('package manager commands', () => {
  it('writes installs, dev installs and npx for each manager', () => {
    expect(toPackageManager('npm install @halyard/core', 'pnpm')).toBe('pnpm add @halyard/core');
    expect(toPackageManager('npm i -D halyard-cli', 'yarn')).toBe('yarn add -D halyard-cli');
    expect(toPackageManager('npm install --save-dev vitest', 'bun')).toBe('bun add -D vitest');
    expect(toPackageManager('npx halyard init', 'pnpm')).toBe('pnpm dlx halyard init');
    expect(toPackageManager('npx halyard init', 'bun')).toBe('bunx halyard init');
    expect(toPackageManager('npm run dev', 'yarn')).toBe('yarn dev');
    expect(toPackageManager('npm run dev', 'bun')).toBe('bun run dev');
    expect(toPackageManager('npm install', 'pnpm')).toBe('pnpm install');
    expect(toPackageManager('npm install -g halyard', 'yarn')).toBe('yarn global add halyard');
    expect(toPackageManager('npm install @halyard/core', 'npm')).toBe('npm install @halyard/core');
  });

  it('converts each line of a multi-line command', () => {
    expect(toPackageManager('npm install a\nnpx a init', 'pnpm')).toBe(
      'pnpm add a\npnpm dlx a init',
    );
  });
});

describe('table of contents', () => {
  const tops = [
    { id: 'install', top: 40 },
    { id: 'configure', top: 300 },
    { id: 'deploy', top: 900 },
  ];

  it('marks the last heading that passed the reading line', () => {
    expect(pickActive(tops, 96, false)).toBe('install');
    expect(pickActive(tops, 320, false)).toBe('configure');
    expect(pickActive([{ id: 'a', top: 500 }], 96, false)).toBe('a');
  });

  it('marks the last heading at the bottom of the page', () => {
    expect(pickActive(tops, 96, true)).toBe('deploy');
    expect(pickActive([], 96, false)).toBeNull();
  });
});

describe('search', () => {
  const search = createLocalSearch([
    {
      id: 'retries',
      title: 'Retries and backoff',
      href: '/docs/retries',
      group: 'Guides',
      headings: [{ id: 'exponential-backoff', title: 'Exponential backoff' }],
      content: 'A failed job is retried with exponential backoff until it runs out of attempts.',
    },
    {
      id: 'install',
      title: 'Installation',
      href: '/docs/installation',
      group: 'Get started',
      content: 'Install the package and create a queue. Retries are on by default.',
    },
  ]);
  const signal = new AbortController().signal;

  it('ranks a title match first and returns matching headings as their own results', async () => {
    const results = await search('backoff', signal);
    expect(results.map((r) => r.href)).toEqual([
      '/docs/retries',
      '/docs/retries#exponential-backoff',
    ]);
    expect(results[1]).toMatchObject({ page: 'Retries and backoff', group: 'Guides' });
  });

  it('needs every word and ignores case and accents', async () => {
    expect((await search('RETRIES default', signal)).map((r) => r.id)).toEqual(['install']);
    expect(await search('   ', signal)).toEqual([]);
  });

  it('marks merged match ranges and cuts an excerpt around the first match', () => {
    expect(matchRanges('Retry the retries', 'retr')).toEqual([
      [0, 4],
      [10, 14],
    ]);
    const long = `${'word '.repeat(60)}backoff ${'tail '.repeat(60)}`;
    const excerpt = excerptAround(long, 'backoff', 80);
    expect(excerpt).toContain('backoff');
    expect(excerpt.startsWith('…')).toBe(true);
    expect(excerpt.endsWith('…')).toBe(true);
    // Without a match in the text, the start of it, still cut at a word.
    const opening = excerptAround('alpha beta gamma delta epsilon zeta', 'nothing', 20);
    expect(opening).toBe('alpha beta gamma…');
  });

  it('keeps recent results newest first, without duplicates or excerpts', () => {
    const a = { id: 'a', title: 'A', href: '/a', excerpt: 'x' };
    const b = { id: 'b', title: 'B', href: '/b' };
    const list = pushRecent(pushRecent([b], a), b, 5);
    expect(list).toEqual([b, { id: 'a', title: 'A', href: '/a' }]);
  });
});

describe('changelog', () => {
  it('sorts versions numerically, a pre-release before its release', () => {
    expect(compareVersions('2.10.0', '2.9.1')).toBeGreaterThan(0);
    expect(compareVersions('3.0.0-beta.2', '3.0.0')).toBeLessThan(0);
    expect(
      sortReleases([
        { version: '2.9.1', date: '2026-01-01', changes: [] },
        { version: '3.0.0-beta.1', date: '2026-03-01', changes: [] },
        { version: '2.10.0', date: '2026-02-01', changes: [] },
      ]).map((r) => r.version),
    ).toEqual(['3.0.0-beta.1', '2.10.0', '2.9.1']);
  });

  it('groups changes from breaking to deprecated and makes anchor ids', () => {
    const groups = groupChanges([
      { type: 'fix', text: 'Fixed a leak.' },
      { type: 'breaking', text: 'Dropped Node 18.' },
      { type: 'feature', text: 'Added schedules.' },
    ]);
    expect(groups.map((g) => g.type)).toEqual(['breaking', 'feature', 'fix']);
    expect(releaseId('v2.4.0')).toBe('v2-4-0');
  });
});

describe('feedback', () => {
  it('votes, takes a comment, sends and thanks', () => {
    let state: FeedbackState = { step: 'ask' };
    state = feedbackReducer(state, { type: 'vote', helpful: false });
    state = feedbackReducer(state, { type: 'type', comment: '  Missing an example.  ' });
    state = feedbackReducer(state, { type: 'vote', helpful: true });
    expect(state).toEqual({ step: 'comment', helpful: true, comment: '  Missing an example.  ' });
    state = feedbackReducer(state, { type: 'send' });
    expect(state).toEqual({ step: 'sending', helpful: true, comment: 'Missing an example.' });
    expect(feedbackReducer(state, { type: 'sent' })).toEqual({ step: 'done', helpful: true });
  });

  it('keeps the comment when sending fails', () => {
    const sending: FeedbackState = { step: 'sending', helpful: false, comment: 'Typo in step 2' };
    expect(feedbackReducer(sending, { type: 'failed' })).toEqual({
      step: 'error',
      helpful: false,
      comment: 'Typo in step 2',
    });
    expect(feedbackReducer({ step: 'ask' }, { type: 'send' })).toEqual({ step: 'ask' });
  });
});
