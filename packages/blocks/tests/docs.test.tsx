import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Callout,
  Changelog,
  CodeBlock,
  DocsBreadcrumb,
  DocsFeedback,
  DocsHeading,
  DocsLinkProvider,
  DocsPageMeta,
  DocsPager,
  DocsSearch,
  DocsSidebar,
  DocsToc,
  Endpoint,
  FileTree,
  InstallTabs,
  PropsTable,
  Step,
  Steps,
  VersionSwitcher,
  createLocalSearch,
  type DocsNavSection,
} from '../src/docs';
import * as moving from '../src/docs/motion';

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
          { title: 'Schedules', href: '/docs/queues/schedules', badge: 'Beta' },
        ],
      },
    ],
  },
];

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('DocsSidebar', () => {
  it('marks the current page, opens its group and collapses a group on demand', async () => {
    const user = userEvent.setup();
    render(<DocsSidebar sections={NAV} currentHref="/docs/queues/retries" />);
    const nav = screen.getByRole('navigation', { name: 'Docs' });
    const current = within(nav).getByRole('link', { name: /Retries/ });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(within(current).getByText('New')).toBeInTheDocument();
    const toggle = within(nav).getByRole('button', { name: /Queues/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: /Schedules/ })).not.toBeInTheDocument();
  });

  it('routes links through the provided link component and reports navigation', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <DocsLinkProvider render={(props) => <a data-router="yes" {...props} />}>
        <DocsSidebar sections={NAV} currentHref="/docs" onNavigate={onNavigate} />
      </DocsLinkProvider>,
    );
    const link = screen.getByRole('link', { name: 'Installation' });
    expect(link).toHaveAttribute('data-router', 'yes');
    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await user.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });
});

describe('DocsToc', () => {
  it('lists headings and scrolls to one, moving focus there', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as never;
    render(
      <>
        <h2 id="install">Install</h2>
        <h2 id="configure">Configure</h2>
        <DocsToc
          headings={[
            { id: 'install', title: 'Install', level: 2 },
            { id: 'configure', title: 'Configure', level: 2 },
          ]}
        />
      </>,
    );
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    await user.click(within(nav).getByRole('link', { name: 'Configure' }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    expect(screen.getByRole('heading', { name: 'Configure' })).toHaveFocus();
    expect(window.location.hash).toBe('#configure');
  });
});

describe('CodeBlock', () => {
  it('shows the title, numbers and highlights lines, marks a diff and copies the result', async () => {
    const user = userEvent.setup();
    render(
      <CodeBlock
        lang="ts"
        meta='title="queue.ts" {2} showLineNumbers'
        code={'const queue = createQueue();\nqueue.add(job);'}
      />,
    );
    expect(screen.getByText('queue.ts')).toBeInTheDocument();
    const lines = screen.getByLabelText(/queue\.ts/).querySelectorAll('[data-line]');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toHaveAttribute('data-highlighted', 'true');
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(await navigator.clipboard.readText()).toBe(
      'const queue = createQueue();\nqueue.add(job);',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('labels added and removed lines and leaves removed lines out of the copy', async () => {
    const user = userEvent.setup();
    render(<CodeBlock diff code={'-retries: 3\n+retries: 5\n keep: true'} />);
    expect(screen.getByText('Removed:')).toBeInTheDocument();
    expect(screen.getByText('Added:')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(await navigator.clipboard.readText()).toBe('retries: 5\nkeep: true');
  });
});

describe('InstallTabs', () => {
  it('writes the command per manager and remembers the choice across instances', async () => {
    const user = userEvent.setup();
    render(
      <>
        <InstallTabs command="npm install @halyard/core" />
        <InstallTabs command="npx halyard init" />
      </>,
    );
    const [first] = screen.getAllByRole('tablist', { name: 'Package manager' });
    if (first === undefined) throw new Error('no package manager tabs');
    await user.click(within(first).getByRole('tab', { name: 'pnpm' }));
    expect(screen.getByText('pnpm add @halyard/core')).toBeInTheDocument();
    expect(screen.getByText('pnpm dlx halyard init')).toBeInTheDocument();
    expect(localStorage.getItem('rectio-docs-package-manager')).toContain('pnpm');
  });
});

describe('DocsSearch', () => {
  const search = createLocalSearch([
    {
      id: 'retries',
      title: 'Retries and backoff',
      href: '/docs/retries',
      group: 'Guides',
      content: 'A failed job is retried with backoff.',
    },
    {
      id: 'install',
      title: 'Installation',
      href: '/docs/installation',
      group: 'Get started',
      content: 'Install the package.',
    },
  ]);

  it('opens from the trigger, groups and marks results and remembers the one opened', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<DocsSearch search={search} onNavigate={onNavigate} debounce={0} />);
    await user.click(screen.getByRole('button', { name: /Search docs/ }));
    const input = await screen.findByRole('combobox', { name: 'Search the docs' });
    await user.type(input, 'backoff');
    const option = await screen.findByRole('option', { name: /Retries and backoff/ });
    expect(screen.getByText('Guides')).toBeInTheDocument();
    expect(option.querySelector('mark')).toHaveTextContent(/backoff/i);
    await user.click(option);
    expect(onNavigate).toHaveBeenCalledWith('/docs/retries');
    expect(localStorage.getItem('rectio-docs-recent-searches')).toContain('/docs/retries');
  });

  it('says when nothing matches and when the provider fails', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DocsSearch search={search} open debounce={0} trigger={false} />);
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(await screen.findByText(/No results for/)).toBeInTheDocument();
    unmount();
    render(
      <DocsSearch
        search={() => Promise.reject(new Error('offline'))}
        open
        debounce={0}
        trigger={false}
      />,
    );
    await user.type(screen.getByRole('combobox'), 'queue');
    expect(await screen.findByText('Search is not available right now')).toBeInTheDocument();
  });
});

describe('DocsFeedback', () => {
  it('votes, focuses the comment, sends and thanks', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DocsFeedback onSubmit={onSubmit} />);
    const no = screen.getByRole('button', { name: 'No' });
    await user.click(no);
    expect(no).toHaveAttribute('aria-pressed', 'true');
    const field = screen.getByRole('textbox', { name: /What was missing/ });
    expect(field).toHaveFocus();
    await user.type(field, 'Needs an example');
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(onSubmit).toHaveBeenCalledWith({ helpful: false, comment: 'Needs an example' });
    expect(await screen.findByRole('status')).toHaveTextContent(/Thanks/);
  });

  it('keeps the comment and shows an error when sending fails', async () => {
    const user = userEvent.setup();
    render(<DocsFeedback onSubmit={() => Promise.reject(new Error('down'))} />);
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await user.type(screen.getByRole('textbox'), 'Clear');
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(await screen.findByText(/was not sent/)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Clear');
  });
});

describe('page navigation', () => {
  it('links the previous and next page and the edit page, with the date in a time element', () => {
    render(
      <>
        <DocsBreadcrumb items={[{ label: 'Guides', href: '/docs/guides' }, { label: 'Retries' }]} />
        <DocsPager
          prev={{ title: 'Installation', href: '/docs/installation' }}
          next={{ title: 'Queues', href: '/docs/queues', section: 'Guides' }}
        />
        <DocsPageMeta
          editHref="https://github.com/example/docs/edit/main/retries.mdx"
          lastUpdated="2026-11-02"
          locale="en-GB"
        />
      </>,
    );
    const pager = screen.getByRole('navigation', { name: 'Previous and next page' });
    expect(within(pager).getByRole('link', { name: /Installation/ })).toHaveAttribute(
      'rel',
      'prev',
    );
    expect(within(pager).getByRole('link', { name: /Queues/ })).toHaveAttribute('rel', 'next');
    expect(screen.getByRole('link', { name: /Edit this page/ })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-11-02');
    expect(screen.getByText('Retries')).toBeInTheDocument();
  });

  it('switches versions through a menu of links', async () => {
    const user = userEvent.setup();
    render(
      <VersionSwitcher
        current="3"
        versions={[
          { value: '3', label: 'v3', href: '/docs' },
          { value: '2', label: 'v2', href: '/v2/docs' },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Version: v3' }));
    expect(await screen.findByRole('menuitem', { name: /v2/ })).toHaveAttribute('href', '/v2/docs');
  });
});

describe('prose', () => {
  it('gives headings an anchor, numbers steps and labels callouts', () => {
    render(
      <>
        <DocsHeading level={2}>Retries and backoff</DocsHeading>
        <Steps>
          <Step title="Install">Run it.</Step>
          <Step title="Configure">Set it.</Step>
        </Steps>
        <Callout type="warning">Back up first.</Callout>
      </>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: /Retries and backoff/ });
    expect(heading).toHaveAttribute('id', 'retries-and-backoff');
    expect(within(heading).getByRole('link')).toHaveAttribute('href', '#retries-and-backoff');
    expect(screen.getByRole('heading', { name: 'Step 2: Configure' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/Warning/);
  });

  it('opens and closes folders in a file tree', async () => {
    const user = userEvent.setup();
    render(
      <FileTree
        entries={[{ name: 'content', defaultOpen: true, children: [{ name: 'index.mdx' }] }]}
      />,
    );
    const folder = screen.getByRole('button', { name: /content/ });
    expect(screen.getByText('index.mdx')).toBeInTheDocument();
    await user.click(folder);
    expect(folder).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('index.mdx')).not.toBeInTheDocument();
  });
});

describe('API reference', () => {
  it('lists props with defaults and flags, and shows an endpoint with its responses', async () => {
    const user = userEvent.setup();
    render(
      <>
        <PropsTable
          rows={[
            { name: 'retries', type: 'number', default: '3', description: 'Attempts.' },
            { name: 'name', type: 'string', required: true, description: 'Queue name.' },
          ]}
        />
        <Endpoint
          method="POST"
          title="Enqueue a job"
          path="/v1/queues/:queue/jobs"
          responses={[
            { status: 201, description: 'Created', example: '{ "id": "job_1" }' },
            { status: 404, description: 'No such queue', example: '{ "error": "not_found" }' },
          ]}
        />
      </>,
    );
    expect(screen.getAllByText('retries').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
    expect(screen.getByText('POST')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /404/ }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('{ "error": "not_found" }');
  });
});

describe('Changelog', () => {
  it('lists releases newest first with anchors, the latest marked', () => {
    render(
      <Changelog
        locale="en-GB"
        releases={[
          { version: '2.9.0', date: '2026-09-01', changes: [{ type: 'fix', text: 'Fixed.' }] },
          {
            version: '3.0.0',
            date: '2026-11-01',
            changes: [{ type: 'breaking', text: 'Dropped Node 18.' }],
          },
        ]}
      />,
    );
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(['3.0.0', '2.9.0']);
    expect(headings[0]).toHaveAttribute('id', 'v3-0-0');
    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getAllByText('Breaking').length).toBeGreaterThan(0);
  });
});

describe('motion twins', () => {
  it('render the same content as the plain blocks', async () => {
    const user = userEvent.setup();
    render(
      <>
        <moving.InstallTabs command="npm install @halyard/core" />
        <moving.Changelog releases={[{ version: '1.0.0', date: '2026-01-01', changes: [] }]} />
        <moving.DocsFeedback onSubmit={() => undefined} />
      </>,
    );
    await user.click(screen.getByRole('tab', { name: 'bun' }));
    expect(screen.getByText('bun add @halyard/core')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1.0.0' })).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Yes' }));
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send feedback' })).toBeInTheDocument();
    });
  });
});
