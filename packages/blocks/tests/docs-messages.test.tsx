import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Callout,
  Changelog,
  CodeBlock,
  CodeTabs,
  CopyButton,
  DocsBreadcrumb,
  DocsFeedback,
  DocsHeader,
  DocsHero,
  DocsLayout,
  DocsPageMeta,
  DocsPager,
  DocsSearch,
  DocsSidebar,
  DocsTable,
  DocsToc,
  Endpoint,
  FileTree,
  InstallTabs,
  LanguageSwitcher,
  PropsTable,
  SignatureCard,
  Step,
  Steps,
  VersionSwitcher,
  createLocalSearch,
  type DocsNavSection,
} from '../src/docs';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const NAV: DocsNavSection[] = [
  {
    title: 'Guides',
    items: [
      { title: 'Intro', href: '/docs' },
      {
        title: 'Queues',
        href: '/docs/queues',
        items: [{ title: 'Retries', href: '/docs/queues/retries' }],
      },
      { title: 'GitHub', href: 'https://example.com', external: true },
    ],
  },
];

describe('copy button and code', () => {
  it('names the copy button and says when it copied', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });
    render(<CopyButton value="x" messages={{ copy: 'Duplicate', copied: 'Duplicated' }} />);
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(await screen.findByRole('button', { name: 'Duplicated' })).toBeInTheDocument();
  });

  it('words the code block: copy name, diff marks and the unnamed example', () => {
    render(
      <CodeBlock
        code={'+ added\n- removed'}
        lang="diff"
        messages={{
          copyCode: 'Copy the code',
          added: 'Newly added: ',
          removed: 'Dropped: ',
          example: (language) => `sample: ${language}`,
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Copy the code' })).toBeInTheDocument();
    expect(screen.getByText('Newly added:')).toBeInTheDocument();
    expect(screen.getByText('Dropped:')).toBeInTheDocument();
    expect(screen.getByLabelText('sample: Diff')).toBeInTheDocument();
    expect(screen.queryByText('Added:')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('names the tab lists of code tabs and install tabs', () => {
    render(
      <>
        <CodeTabs items={[{ label: 'a.ts', code: 'a' }]} messages={{ label: 'Samples' }} />
        <InstallTabs command="npm install x" messages={{ label: 'Installer' }} />
      </>,
    );
    expect(screen.getByRole('tablist', { name: 'Samples' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Installer' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Code examples' })).toBeNull();
    expect(screen.queryByRole('tablist', { name: 'Package manager' })).toBeNull();
  });
});

describe('navigation words', () => {
  it('words the table of contents', () => {
    render(
      <DocsToc
        headings={[{ id: 'a', title: 'Alpha', level: 2 }]}
        messages={{ title: 'In this article', label: 'Contents' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Contents' })).toBeInTheDocument();
    expect(screen.getByText('In this article')).toBeInTheDocument();
    expect(screen.queryByText('On this page')).toBeNull();
  });

  it('words the sidebar, including a group button and an external link', () => {
    render(
      <DocsSidebar
        sections={NAV}
        currentHref="/docs"
        messages={{
          label: 'Handbook',
          opensInNewTab: '(opens in a new window)',
          groupPages: (title) => `Pages in ${title}`,
        }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Handbook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pages in Queues' })).toBeInTheDocument();
    expect(screen.getByText('(opens in a new window)')).toBeInTheDocument();
    expect(screen.queryByText('(opens in a new tab)')).toBeNull();
  });

  it('words the pager, the breadcrumb and the page meta', () => {
    render(
      <>
        <DocsPager
          prev={{ title: 'One', href: '/one' }}
          next={{ title: 'Three', href: '/three' }}
          messages={{ label: 'Earlier and later', previous: 'Wstecz', next: 'Dalej' }}
        />
        <DocsBreadcrumb
          items={[{ label: 'Docs', href: '/docs' }, { label: 'Page' }]}
          messages={{ label: 'Trail' }}
        />
        <DocsPageMeta
          editHref="https://example.com/edit"
          lastUpdated="2026-03-01"
          locale="en-GB"
          messages={{
            edit: 'Suggest an edit',
            lastUpdated: 'Revised',
            opensInNewTab: '(new window)',
          }}
        />
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'Earlier and later' })).toBeInTheDocument();
    expect(screen.getByText('Wstecz')).toBeInTheDocument();
    expect(screen.getByText('Dalej')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Trail' })).toBeInTheDocument();
    expect(screen.getByText('Suggest an edit')).toBeInTheDocument();
    expect(screen.getByText('Revised', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('(new window)')).toBeInTheDocument();
    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.queryByText('Edit this page')).toBeNull();
  });

  it('passes the shown value to the switchers button name', () => {
    render(
      <>
        <VersionSwitcher
          versions={[{ value: '2', label: 'v2', href: '/v2' }]}
          current="2"
          messages={{ button: (version) => `Release ${version}` }}
        />
        <LanguageSwitcher
          languages={[{ value: 'de', label: 'Deutsch', href: '/de' }]}
          current="de"
          messages={{ button: (language) => `Switch language, ${language}` }}
        />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Release v2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch language, Deutsch' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Version: v2' })).toBeNull();
  });

  it('words the header and the layout', () => {
    render(
      <DocsLayout
        header={
          <DocsHeader
            brand="Brand"
            brandLabel="Home"
            links={[{ label: 'Docs', href: '/docs' }]}
            mobileNav={<p>nav</p>}
            messages={{ navigation: 'Site menu', main: 'Primary' }}
          />
        }
        toc={<p>toc</p>}
        messages={{ skipToContent: 'Jump to content', tocLabel: 'Here' }}
      >
        <p>body</p>
      </DocsLayout>,
    );
    expect(screen.getByRole('button', { name: 'Site menu' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('Jump to content')).toBeInTheDocument();
    expect(screen.getByText('Here')).toBeInTheDocument();
    expect(screen.queryByText('Skip to content')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
  });
});

describe('search words', () => {
  const search = createLocalSearch([
    { id: 'a', title: 'Queue basics', href: '/a', content: 'queue' },
    { id: 'b', title: 'Queue retries', href: '/b', content: 'queue' },
  ]);

  it('words the field, the empty state, the keys and the result count', async () => {
    const user = userEvent.setup();
    const results = vi.fn((count: number) => `${String(count)} matches`);
    render(
      <DocsSearch
        search={search}
        open
        debounce={0}
        trigger={false}
        messages={{
          label: 'Find',
          placeholder: 'Search the handbook',
          emptyTitle: 'Search the documents',
          hints: 'Arrows, Return, Esc.',
          toMove: 'navigate',
          results,
          noResultsTitle: (query) => `Nothing for ${query}`,
        }}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Find' });
    expect(input).toHaveAttribute('placeholder', 'Search the handbook');
    expect(screen.getByText('Search the documents')).toBeInTheDocument();
    expect(screen.getByText('navigate')).toBeInTheDocument();
    expect(screen.getByText('Arrows, Return, Esc.')).toBeInTheDocument();
    expect(screen.queryByText('to move')).toBeNull();
    await user.type(input, 'queue');
    expect(await screen.findByText('2 matches')).toBeInTheDocument();
    expect(results).toHaveBeenCalledWith(2, expect.any(String));
    await user.clear(input);
    await user.type(input, 'zzz');
    expect(await screen.findByText('Nothing for zzz')).toBeInTheDocument();
    expect(screen.queryByText(/No results for/)).toBeNull();
  });

  it('words the trigger and the failure note', async () => {
    const user = userEvent.setup();
    render(
      <DocsSearch
        search={() => Promise.reject(new Error('offline'))}
        debounce={0}
        messages={{ triggerLabel: 'Search handbook', errorTitle: 'Search is down' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Search handbook/ }));
    expect(screen.queryByRole('button', { name: /Search docs/ })).toBeNull();
    await user.type(screen.getByRole('combobox'), 'queue');
    expect(await screen.findByText('Search is down')).toBeInTheDocument();
  });

  it('formats the count in English by default', async () => {
    const user = userEvent.setup();
    render(<DocsSearch search={search} open debounce={0} trigger={false} locale="en-GB" />);
    await user.type(screen.getByRole('combobox'), 'basics');
    expect(await screen.findByText('1 result')).toBeInTheDocument();
  });
});

describe('feedback words', () => {
  it('words the question, votes, prompt, buttons and thanks', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <DocsFeedback
        onSubmit={onSubmit}
        messages={{
          label: 'Feedback form',
          question: 'Did this page help?',
          yes: 'Yep',
          no: 'Nope',
          helpfulPrompt: 'What worked?',
          send: 'Submit',
          cancel: 'Back out',
          thanks: 'Much appreciated.',
        }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Feedback form' })).toBeInTheDocument();
    expect(screen.getByText('Did this page help?')).toBeInTheDocument();
    expect(screen.queryByText('Was this page helpful?')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Yep' }));
    expect(screen.getByText('What worked?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back out' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Much appreciated.')).toBeInTheDocument();
  });

  it('words the failure', async () => {
    const user = userEvent.setup();
    render(
      <DocsFeedback
        onSubmit={() => Promise.reject(new Error('down'))}
        messages={{ yes: 'Yep', send: 'Submit', error: 'Not sent.' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Yep' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Not sent.')).toBeInTheDocument();
  });
});

describe('prose words', () => {
  it('words callout types, step numbers, the file tree and the table', () => {
    render(
      <>
        <Callout
          type="tip"
          messages={{ types: { note: 'N', tip: 'Pointer', warning: 'W', danger: 'D' } }}
        >
          body
        </Callout>
        <Steps messages={{ step: (number) => `Phase ${String(number)}:` }}>
          <Step title="First" />
          <Step title="Second" />
        </Steps>
        <FileTree
          entries={[{ name: 'a.ts', highlight: true }]}
          messages={{ label: 'Documents', highlighted: '(marked)' }}
        />
        <DocsTable messages={{ label: 'Grid' }}>
          <table />
        </DocsTable>
      </>,
    );
    expect(screen.getByRole('note', { name: 'Pointer' })).toBeInTheDocument();
    expect(screen.getByText('Phase 2:')).toBeInTheDocument();
    expect(screen.queryByText('Step 2:')).toBeNull();
    expect(screen.getByRole('list', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getByText('(marked)')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Grid' })).toBeInTheDocument();
  });

  it('lets one step carry its own words', () => {
    render(
      <Steps messages={{ step: (number) => `Phase ${String(number)}:` }}>
        <Step title="Own" messages={{ step: (number) => `Stage ${String(number)}:` }} />
      </Steps>,
    );
    expect(screen.getByText('Stage 1:')).toBeInTheDocument();
  });
});

describe('content block words', () => {
  it('words the changelog and gives the link its version', () => {
    const changes = {
      breaking: 'Major',
      security: 'Safety',
      feature: 'New',
      improvement: 'Improved',
      fix: 'Repaired',
      deprecation: 'Retired',
    };
    render(
      <Changelog
        releases={[
          {
            version: '2.0.0',
            date: '2026-03-01',
            href: '/notes',
            changes: [{ type: 'breaking', text: 'Gone.' }],
          },
        ]}
        messages={{
          latest: 'Newest',
          changes,
          fullNotes: (version) => `Release notes for ${version}`,
        }}
      />,
    );
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getAllByText('Major').length).toBeGreaterThan(0);
    expect(screen.getByText('Release notes for 2.0.0')).toBeInTheDocument();
    expect(screen.queryByText('Latest')).toBeNull();
    expect(screen.queryByText('Breaking')).toBeNull();
  });

  it('words the hero', () => {
    render(
      <DocsHero
        title="Halyard"
        install="npm i halyard"
        messages={{ introduction: 'Overview', copyInstall: 'Copy the command' }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy the command' })).toBeInTheDocument();
  });

  it('words the props table, signature card and endpoint', async () => {
    const user = userEvent.setup();
    const tableMessages = {
      name: 'Label',
      type: 'Kind',
      default: 'Initial',
      description: 'Summary',
      required: 'Compulsory',
      deprecated: 'Obsolete',
      none: 'Nil',
    };
    render(
      <>
        <PropsTable
          label="opts"
          rows={[
            { name: 'a', type: 'string', required: true },
            { name: 'b', type: 'number', deprecated: true, default: '1' },
          ]}
          messages={tableMessages}
        />
        <SignatureCard
          name="queue.add"
          signature="queue.add(name)"
          kind="method"
          since="1.4"
          deprecated
          params={[{ name: 'name', type: 'string', optional: true }]}
          returns={{ type: 'Job' }}
          messages={{
            kinds: {
              function: 'proc',
              method: 'routine',
              class: 'blueprint',
              hook: 'handle',
              type: 'shape',
            },
            since: (version) => `Since ${version}`,
            deprecated: 'Obsolete',
            parameters: 'Inputs',
            optional: 'Optional. ',
            returns: 'Yields',
          }}
        />
        <Endpoint
          method="POST"
          path="/v1/jobs"
          title="Enqueue"
          auth="key"
          body={[{ name: 'x', type: 'string' }]}
          request={{ code: 'curl' }}
          responses={[{ status: 200, description: 'ok' }]}
          messages={{
            authorization: 'Credentials',
            body: 'Payload',
            request: 'Call',
            responses: 'Replies',
            responsesLabel: (title) => `Replies: ${title}`,
          }}
        />
      </>,
    );
    expect(screen.getAllByText('Label').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Compulsory').length).toBeGreaterThan(0);
    expect(screen.queryByText('Required')).toBeNull();
    expect(screen.queryByText('Prop')).toBeNull();
    expect(screen.getByText('routine')).toBeInTheDocument();
    expect(screen.getByText('Since 1.4')).toBeInTheDocument();
    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('Yields')).toBeInTheDocument();
    expect(screen.getByText('Credentials')).toBeInTheDocument();
    expect(screen.getByText('Call')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Replies: Enqueue' })).toBeInTheDocument();
    expect(screen.queryByText('Authorization')).toBeNull();
    await user.click(screen.getByRole('tab', { name: '200' }));
    expect(within(screen.getByRole('tabpanel')).getByText('ok')).toBeInTheDocument();
  });
});
