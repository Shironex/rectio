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
    render(<CopyButton value="x" messages={{ copy: 'Kopiuj', copied: 'Skopiowano' }} />);
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Kopiuj' }));
    expect(await screen.findByRole('button', { name: 'Skopiowano' })).toBeInTheDocument();
  });

  it('words the code block: copy name, diff marks and the unnamed example', () => {
    render(
      <CodeBlock
        code={'+ added\n- removed'}
        lang="diff"
        messages={{
          copyCode: 'Kopiuj kod',
          added: 'Dodano: ',
          removed: 'Usunięto: ',
          example: (language) => `przykład: ${language}`,
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Kopiuj kod' })).toBeInTheDocument();
    expect(screen.getByText('Dodano:')).toBeInTheDocument();
    expect(screen.getByText('Usunięto:')).toBeInTheDocument();
    expect(screen.getByLabelText('przykład: Diff')).toBeInTheDocument();
    expect(screen.queryByText('Added:')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('names the tab lists of code tabs and install tabs', () => {
    render(
      <>
        <CodeTabs items={[{ label: 'a.ts', code: 'a' }]} messages={{ label: 'Przykłady' }} />
        <InstallTabs command="npm install x" messages={{ label: 'Menedżer pakietów' }} />
      </>,
    );
    expect(screen.getByRole('tablist', { name: 'Przykłady' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Menedżer pakietów' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Code examples' })).toBeNull();
    expect(screen.queryByRole('tablist', { name: 'Package manager' })).toBeNull();
  });
});

describe('navigation words', () => {
  it('words the table of contents', () => {
    render(
      <DocsToc
        headings={[{ id: 'a', title: 'Alpha', level: 2 }]}
        messages={{ title: 'Na tej stronie', label: 'Spis treści' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Spis treści' })).toBeInTheDocument();
    expect(screen.getByText('Na tej stronie')).toBeInTheDocument();
    expect(screen.queryByText('On this page')).toBeNull();
  });

  it('words the sidebar, including a group button and an external link', () => {
    render(
      <DocsSidebar
        sections={NAV}
        currentHref="/docs"
        messages={{
          label: 'Dokumentacja',
          opensInNewTab: '(otwiera się w nowej karcie)',
          groupPages: (title) => `Strony: ${title}`,
        }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Dokumentacja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Strony: Queues' })).toBeInTheDocument();
    expect(screen.getByText('(otwiera się w nowej karcie)')).toBeInTheDocument();
    expect(screen.queryByText('(opens in a new tab)')).toBeNull();
  });

  it('words the pager, the breadcrumb and the page meta', () => {
    render(
      <>
        <DocsPager
          prev={{ title: 'One', href: '/one' }}
          next={{ title: 'Three', href: '/three' }}
          messages={{ label: 'Poprzednia i następna', previous: 'Wstecz', next: 'Dalej' }}
        />
        <DocsBreadcrumb
          items={[{ label: 'Docs', href: '/docs' }, { label: 'Page' }]}
          messages={{ label: 'Ścieżka' }}
        />
        <DocsPageMeta
          editHref="https://example.com/edit"
          lastUpdated="2026-03-01"
          locale="en-GB"
          messages={{
            edit: 'Edytuj stronę',
            lastUpdated: 'Ostatnia zmiana',
            opensInNewTab: '(nowa karta)',
          }}
        />
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'Poprzednia i następna' })).toBeInTheDocument();
    expect(screen.getByText('Wstecz')).toBeInTheDocument();
    expect(screen.getByText('Dalej')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Ścieżka' })).toBeInTheDocument();
    expect(screen.getByText('Edytuj stronę')).toBeInTheDocument();
    expect(screen.getByText('Ostatnia zmiana', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('(nowa karta)')).toBeInTheDocument();
    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.queryByText('Edit this page')).toBeNull();
  });

  it('passes the shown value to the switchers button name', () => {
    render(
      <>
        <VersionSwitcher
          versions={[{ value: '2', label: 'v2', href: '/v2' }]}
          current="2"
          messages={{ button: (version) => `Wersja ${version}` }}
        />
        <LanguageSwitcher
          languages={[{ value: 'de', label: 'Deutsch', href: '/de' }]}
          current="de"
          messages={{ button: (language) => `Język ${language}` }}
        />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Wersja v2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Język Deutsch' })).toBeInTheDocument();
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
            messages={{ navigation: 'Nawigacja', main: 'Główna' }}
          />
        }
        toc={<p>toc</p>}
        messages={{ skipToContent: 'Przejdź do treści', tocLabel: 'Na stronie' }}
      >
        <p>body</p>
      </DocsLayout>,
    );
    expect(screen.getByRole('button', { name: 'Nawigacja' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Główna' })).toBeInTheDocument();
    expect(screen.getByText('Przejdź do treści')).toBeInTheDocument();
    expect(screen.getByText('Na stronie')).toBeInTheDocument();
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
    const results = vi.fn((count: number) => `${String(count)} trafienia`);
    render(
      <DocsSearch
        search={search}
        open
        debounce={0}
        trigger={false}
        messages={{
          label: 'Szukaj',
          placeholder: 'Szukaj w dokumentacji',
          emptyTitle: 'Szukaj w dokumentach',
          hints: 'Strzałki, Enter, Escape.',
          toMove: 'ruch',
          results,
          noResultsTitle: (query) => `Brak wyników: ${query}`,
        }}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Szukaj' });
    expect(input).toHaveAttribute('placeholder', 'Szukaj w dokumentacji');
    expect(screen.getByText('Szukaj w dokumentach')).toBeInTheDocument();
    expect(screen.getByText('ruch')).toBeInTheDocument();
    expect(screen.getByText('Strzałki, Enter, Escape.')).toBeInTheDocument();
    expect(screen.queryByText('to move')).toBeNull();
    await user.type(input, 'queue');
    expect(await screen.findByText('2 trafienia')).toBeInTheDocument();
    expect(results).toHaveBeenCalledWith(2, expect.any(String));
    await user.clear(input);
    await user.type(input, 'zzz');
    expect(await screen.findByText('Brak wyników: zzz')).toBeInTheDocument();
    expect(screen.queryByText(/No results for/)).toBeNull();
  });

  it('words the trigger and the failure note', async () => {
    const user = userEvent.setup();
    render(
      <DocsSearch
        search={() => Promise.reject(new Error('offline'))}
        debounce={0}
        messages={{ triggerLabel: 'Szukaj docs', errorTitle: 'Brak wyszukiwarki' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Szukaj docs/ }));
    expect(screen.queryByRole('button', { name: /Search docs/ })).toBeNull();
    await user.type(screen.getByRole('combobox'), 'queue');
    expect(await screen.findByText('Brak wyszukiwarki')).toBeInTheDocument();
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
          label: 'Opinia',
          question: 'Czy ta strona pomogła?',
          yes: 'Tak',
          no: 'Nie',
          helpfulPrompt: 'Co zadziałało?',
          send: 'Wyślij',
          cancel: 'Anuluj',
          thanks: 'Dziękujemy.',
        }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Opinia' })).toBeInTheDocument();
    expect(screen.getByText('Czy ta strona pomogła?')).toBeInTheDocument();
    expect(screen.queryByText('Was this page helpful?')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Tak' }));
    expect(screen.getByText('Co zadziałało?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Wyślij' }));
    expect(await screen.findByText('Dziękujemy.')).toBeInTheDocument();
  });

  it('words the failure', async () => {
    const user = userEvent.setup();
    render(
      <DocsFeedback
        onSubmit={() => Promise.reject(new Error('down'))}
        messages={{ yes: 'Tak', send: 'Wyślij', error: 'Nie wysłano.' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Tak' }));
    await user.click(screen.getByRole('button', { name: 'Wyślij' }));
    expect(await screen.findByText('Nie wysłano.')).toBeInTheDocument();
  });
});

describe('prose words', () => {
  it('words callout types, step numbers, the file tree and the table', () => {
    render(
      <>
        <Callout
          type="tip"
          messages={{ types: { note: 'N', tip: 'Wskazówka', warning: 'W', danger: 'D' } }}
        >
          body
        </Callout>
        <Steps messages={{ step: (number) => `Krok ${String(number)}:` }}>
          <Step title="First" />
          <Step title="Second" />
        </Steps>
        <FileTree
          entries={[{ name: 'a.ts', highlight: true }]}
          messages={{ label: 'Pliki', highlighted: '(wyróżniony)' }}
        />
        <DocsTable messages={{ label: 'Tabela' }}>
          <table />
        </DocsTable>
      </>,
    );
    expect(screen.getByRole('note', { name: 'Wskazówka' })).toBeInTheDocument();
    expect(screen.getByText('Krok 2:')).toBeInTheDocument();
    expect(screen.queryByText('Step 2:')).toBeNull();
    expect(screen.getByRole('list', { name: 'Pliki' })).toBeInTheDocument();
    expect(screen.getByText('(wyróżniony)')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tabela' })).toBeInTheDocument();
  });

  it('lets one step carry its own words', () => {
    render(
      <Steps messages={{ step: (number) => `Krok ${String(number)}:` }}>
        <Step title="Own" messages={{ step: (number) => `Etap ${String(number)}:` }} />
      </Steps>,
    );
    expect(screen.getByText('Etap 1:')).toBeInTheDocument();
  });
});

describe('content block words', () => {
  it('words the changelog and gives the link its version', () => {
    const changes = {
      breaking: 'Przełomowe',
      security: 'Bezpieczeństwo',
      feature: 'Dodano',
      improvement: 'Ulepszono',
      fix: 'Naprawiono',
      deprecation: 'Wycofano',
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
          latest: 'Najnowsza',
          changes,
          fullNotes: (version) => `Pełne notatki ${version}`,
        }}
      />,
    );
    expect(screen.getByText('Najnowsza')).toBeInTheDocument();
    expect(screen.getAllByText('Przełomowe').length).toBeGreaterThan(0);
    expect(screen.getByText('Pełne notatki 2.0.0')).toBeInTheDocument();
    expect(screen.queryByText('Latest')).toBeNull();
    expect(screen.queryByText('Breaking')).toBeNull();
  });

  it('words the hero', () => {
    render(
      <DocsHero
        title="Halyard"
        install="npm i halyard"
        messages={{ introduction: 'Wstęp', copyInstall: 'Kopiuj komendę' }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Wstęp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kopiuj komendę' })).toBeInTheDocument();
  });

  it('words the props table, signature card and endpoint', async () => {
    const user = userEvent.setup();
    const tableMessages = {
      name: 'Nazwa',
      type: 'Typ',
      default: 'Domyślnie',
      description: 'Opis',
      required: 'Wymagane',
      deprecated: 'Wycofane',
      none: 'Brak',
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
              function: 'funkcja',
              method: 'metoda',
              class: 'klasa',
              hook: 'hak',
              type: 'typ',
            },
            since: (version) => `Od ${version}`,
            deprecated: 'Wycofane',
            parameters: 'Parametry',
            optional: 'Opcjonalny. ',
            returns: 'Zwraca',
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
            authorization: 'Autoryzacja',
            body: 'Treść',
            request: 'Żądanie',
            responses: 'Odpowiedzi',
            responsesLabel: (title) => `Odpowiedzi: ${title}`,
          }}
        />
      </>,
    );
    expect(screen.getAllByText('Nazwa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wymagane').length).toBeGreaterThan(0);
    expect(screen.queryByText('Required')).toBeNull();
    expect(screen.queryByText('Prop')).toBeNull();
    expect(screen.getByText('metoda')).toBeInTheDocument();
    expect(screen.getByText('Od 1.4')).toBeInTheDocument();
    expect(screen.getByText('Parametry')).toBeInTheDocument();
    expect(screen.getByText('Zwraca')).toBeInTheDocument();
    expect(screen.getByText('Autoryzacja')).toBeInTheDocument();
    expect(screen.getByText('Żądanie')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Odpowiedzi: Enqueue' })).toBeInTheDocument();
    expect(screen.queryByText('Authorization')).toBeNull();
    await user.click(screen.getByRole('tab', { name: '200' }));
    expect(within(screen.getByRole('tabpanel')).getByText('ok')).toBeInTheDocument();
  });
});
