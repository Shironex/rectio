import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkProvider } from '../link/link';
import { Markdown, markdownToText, parseMarkdown, safeUrl } from './markdown';
import { parseInline, stableBoundary, type MarkdownBlock } from './markdown-parse';

describe('parseMarkdown', () => {
  it('reads headings, paragraphs, rules and quotes', () => {
    const blocks = parseMarkdown(
      '# Close\n\nThe month is open.\n\n---\n\n> Quoted line\n> and more',
    );
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'paragraph', 'hr', 'blockquote']);
  });

  it('reads tight and loose lists, ordered from any start, and nested items', () => {
    const [tight] = parseMarkdown('- one\n- two\n  - nested');
    expect(tight).toMatchObject({ type: 'list', ordered: false, tight: true });
    if (tight?.type !== 'list') throw new Error('expected a list');
    expect(tight.items[1]?.map((block) => block.type)).toEqual(['paragraph', 'list']);

    const [loose] = parseMarkdown('3. three\n\n4. four');
    expect(loose).toMatchObject({ type: 'list', ordered: true, start: 3, tight: false });
  });

  it('reads tables with their alignment', () => {
    const [table] = parseMarkdown('| Vendor | Amount |\n| :--- | ---: |\n| Northwind | 1,200 |');
    expect(table).toMatchObject({ type: 'table', align: ['left', 'right'] });
    if (table?.type !== 'table') throw new Error('expected a table');
    expect(table.rows).toHaveLength(1);
  });

  it('reads fenced code with its language and meta, and marks an open fence', () => {
    const [closed] = parseMarkdown('```ts title="a.ts"\nconst a = 1;\n```');
    expect(closed).toEqual({
      type: 'code',
      lang: 'ts',
      meta: 'title="a.ts"',
      value: 'const a = 1;',
      closed: true,
    });
    const [open] = parseMarkdown('```sh\npnpm add');
    expect(open).toMatchObject({ type: 'code', value: 'pnpm add', closed: false });
  });

  it('reads emphasis, strong, strikethrough and code spans, but not intraword underscores', () => {
    const [paragraph] = parseMarkdown('**bold** *em* ~~gone~~ `x_y` snake_case_name ***both***');
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    const types = paragraph.children
      .filter((node) => node.type !== 'text')
      .map((node) => node.type);
    expect(types).toEqual(['strong', 'em', 'del', 'code', 'strong']);
    expect(markdownToText('snake_case_name')).toBe('snake_case_name');
  });

  it('closes open markers at the end of streamed text instead of showing them', () => {
    const [paragraph] = parseMarkdown('Totals are **almost do', { streaming: true });
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(paragraph.children.at(-1)).toMatchObject({ type: 'strong' });
    // Without streaming the markers are plain text.
    expect(markdownToText('Totals are **almost do')).toBe('Totals are **almost do');
  });

  it('shows the words of a link whose address is still arriving', () => {
    const [paragraph] = parseMarkdown('See [the ledger](https://exa', { streaming: true });
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(paragraph.children.at(-1)).toMatchObject({ type: 'link', href: null });
  });
});

describe('safeUrl', () => {
  it('keeps safe protocols and relative links and drops script ones', () => {
    expect(safeUrl('https://rectio.dev')).toBe('https://rectio.dev');
    expect(safeUrl('/docs/cli')).toBe('/docs/cli');
    expect(safeUrl('#totals')).toBe('#totals');
    expect(safeUrl('mailto:ap@example.com')).toBe('mailto:ap@example.com');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('JaVa\tScRiPt:alert(1)')).toBeNull();
    expect(safeUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(safeUrl('vbscript:x')).toBeNull();
  });
});

describe('Markdown', () => {
  it('never renders raw HTML from the text', () => {
    const { container } = render(
      <Markdown>{'<img src=x onerror="alert(1)"> <b>bold</b>'}</Markdown>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<b>bold</b>');
  });

  it('drops the link of an unsafe address but keeps its words', () => {
    render(<Markdown>{'[Click me](javascript:alert(1))'}</Markdown>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('opens links to other sites in a new tab and says so', () => {
    render(
      <Markdown>{'Read [the guide](https://example.com/guide) or [the CLI](/docs/cli).'}</Markdown>,
    );
    const external = screen.getByRole('link', { name: /^the guide ?\(opens in a new tab\)$/ });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    const local = screen.getByRole('link', { name: 'the CLI' });
    expect(local).not.toHaveAttribute('target');
  });

  it('sends links inside the app through the LinkProvider and leaves others plain', () => {
    render(
      <LinkProvider render={(props) => <a data-router="" {...props} />}>
        <Markdown>{'See [the close](/close) or [the policy](https://example.com/p).'}</Markdown>
      </LinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'the close' })).toHaveAttribute('data-router');
    expect(screen.getByRole('link', { name: /the policy/ })).not.toHaveAttribute('data-router');
  });

  it('links bare addresses', () => {
    render(<Markdown externalLinks="same-tab">{'Docs at https://rectio.dev/docs.'}</Markdown>);
    expect(screen.getByRole('link', { name: 'https://rectio.dev/docs' })).toHaveAttribute(
      'href',
      'https://rectio.dev/docs',
    );
  });

  it('draws tables with header cells in a scrolling frame that takes focus only when it scrolls', () => {
    render(<Markdown>{'| Vendor | Amount |\n| --- | ---: |\n| Northwind | 1,200 |'}</Markdown>);
    const region = screen.getByRole('region', { name: 'Table' });
    expect(region).not.toHaveAttribute('tabindex');
    expect(within(region).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(region).getByRole('cell', { name: '1,200' })).toHaveClass('text-end');
  });

  it('gives a table wider than three columns a card per row for a narrow column', () => {
    render(
      <Markdown>
        {
          '| Customer | Invoice | Due | Amount |\n| --- | --- | --- | ---: |\n| Northwind | INV-1 | Oct 10 | $9,800.00 |'
        }
      </Markdown>,
    );
    const cards = screen.getByRole('list', { name: 'Table' });
    expect(within(cards).getByText('Northwind')).toBeInTheDocument();
    expect(within(cards).getByText('Amount').tagName).toBe('DT');
    expect(within(cards).getByText('$9,800.00').tagName).toBe('DD');
  });

  it('hands code blocks to components.code', () => {
    render(
      <Markdown
        components={{ code: ({ code, lang }) => <output>{`${lang ?? ''}:${code}`}</output> }}
      >
        {'```ts\nconst a = 1;\n```'}
      </Markdown>,
    );
    expect(screen.getByText('ts:const a = 1;')).toBeInTheDocument();
  });

  it('shows images only through components.image, else as a link named by the alt text', () => {
    const { container, rerender } = render(
      <Markdown>{'![Q3 chart](https://example.com/q3.png)'}</Markdown>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: /Q3 chart/ })).toBeInTheDocument();
    rerender(
      <Markdown components={{ image: ({ src, alt }) => <img src={src} alt={alt} /> }}>
        {'![Q3 chart](https://example.com/q3.png)'}
      </Markdown>,
    );
    expect(screen.getByRole('img', { name: 'Q3 chart' })).toBeInTheDocument();
  });

  it('starts headings at h3 so a reply never outranks the page', () => {
    render(<Markdown>{'# Summary\n\n## Detail'}</Markdown>);
    expect(screen.getByRole('heading', { level: 3, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Detail' })).toBeInTheDocument();
  });
});

/** Every href and src a parse produced, in order. */
const addresses = (source: string): (string | null)[] =>
  [
    ...JSON.stringify(parseMarkdown(source)).matchAll(/"(?:href|src)":(null|"(?:[^"\\]|\\.)*")/g),
  ].map((match) => JSON.parse(match[1] ?? 'null') as string | null);

const SPACES = [
  '\u00a0',
  '\u1680',
  '\u2000',
  '\u2001',
  '\u2002',
  '\u2003',
  '\u2004',
  '\u2005',
  '\u2006',
  '\u2007',
  '\u2008',
  '\u2009',
  '\u200a',
  '\u2028',
  '\u2029',
  '\u202f',
  '\u205f',
  '\u3000',
  '\ufeff',
  '\u200b',
  '\u200d',
  '\u0085',
  '\t',
  '\n',
  '\r',
  '\v',
  '\f',
];

describe('safeUrl against hostile addresses', () => {
  it.each(SPACES)('refuses a script address behind U+%s', (space) => {
    expect(safeUrl(`${space}javascript:alert(1)`)).toBeNull();
    expect(safeUrl(`java${space}script:alert(1)`)).toBeNull();
    expect(addresses(`[a](<${space}javascript:alert(1)>)`)).toEqual([null]);
    expect(addresses(`![a](<${space}javascript:alert(1)>)`)).toEqual([null]);
  });

  it('refuses mixed case, entities and unlisted schemes', () => {
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(safeUrl('&#106;avascript:alert(1)')).toBeNull();
    expect(safeUrl('&#x6A;avascript&colon;alert(1)')).toBeNull();
    expect(safeUrl('javascript&#58;alert(1)')).toBeNull();
    expect(safeUrl('\u00a0data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeUrl('vbscript:msgbox')).toBeNull();
    expect(safeUrl('file:///etc/passwd')).toBeNull();
    expect(addresses('[a](&#106;avascript:alert(1))')).toEqual([null]);
    expect(addresses('[a](< data:text/html,<script>alert(1)</script>>)')).toEqual([null]);
  });

  it('keeps spaces inside an address, percent-encoded, and still refuses a spaced scheme', () => {
    expect(safeUrl('mailto:ap@example.com?subject=Hello World')).toBe(
      'mailto:ap@example.com?subject=Hello%20World',
    );
    expect(safeUrl('/files/q3 report.pdf')).toBe('/files/q3%20report.pdf');
    expect(safeUrl('java script:alert(1)')).toBeNull();
    expect(safeUrl('java\u3000script:alert(1)')).toBeNull();
  });

  it('returns exactly the string it checked', () => {
    expect(safeUrl('\u00a0https://example.com/a\u3000')).toBe('https://example.com/a');
    expect(safeUrl(' /docs/cli ')).toBe('/docs/cli');
    expect(safeUrl('/a?b=c:d#e:f')).toBe('/a?b=c:d#e:f');
  });

  it('keeps protocol-relative and backslash paths, which links treat as other sites', () => {
    expect(safeUrl('//evil.com')).toBe('//evil.com');
    expect(safeUrl('/\\evil.com')).toBe('/\\evil.com');
    render(<Markdown>{'[a](/\\evil.com) and [b](//evil.com)'}</Markdown>);
    for (const name of [/^a/, /^b/]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('target', '_blank');
    }
  });
});

describe('parseMarkdown against hostile input', () => {
  const deep: [string, string, boolean][] = [
    ['2000 nested quotes', '>'.repeat(2000) + ' a', false],
    ['3000 spaced quotes', '> '.repeat(3000) + 'a', false],
    ['5000 open emphasis while streaming', '*a '.repeat(5000), true],
    ['5000 strong runs', '**'.repeat(5000) + 'a', false],
    ['5000 strong runs while streaming', '**'.repeat(5000) + 'a', true],
    ['3000 nested emphasis', '*'.repeat(3000) + 'a' + '*'.repeat(3000), false],
    ['20000 open brackets', '['.repeat(20000) + 'a', true],
    [
      '500 nested list levels',
      Array.from({ length: 500 }, (_, i) => '  '.repeat(i) + '- a').join('\n'),
      false,
    ],
  ];

  it.each(deep)('parses %s without overflowing the stack', (_name, source, streaming) => {
    expect(() => parseMarkdown(source, { streaming })).not.toThrow();
    expect(() => markdownToText(source)).not.toThrow();
  });

  it('keeps nesting past the cap as text', () => {
    const text = markdownToText('>'.repeat(40) + ' deep');
    expect(text).toContain('deep');
  });

  it('parses unclosed emphasis, open brackets and deep lists in near linear time', () => {
    // Quadratic parsing took seconds here; a generous bound still catches it.
    const started = performance.now();
    parseMarkdown('*a '.repeat(20000));
    parseMarkdown('_a '.repeat(20000), { streaming: true });
    parseMarkdown('['.repeat(20000) + 'a');
    parseMarkdown('[a]('.repeat(20000));
    parseMarkdown('![a]('.repeat(20000));
    markdownToText('[a]('.repeat(20000));
    parseMarkdown(Array.from({ length: 2000 }, (_, i) => '  '.repeat(i) + '- a').join('\n'));
    expect(performance.now() - started).toBeLessThan(3000);
  });
});

describe('stableBoundary', () => {
  it('splits before the last block that starts after a blank line', () => {
    const text = 'First paragraph.\n\nSecond one, still arri';
    expect(text.slice(stableBoundary(text))).toBe('Second one, still arri');
  });

  it('never splits inside a fence, a list or a quote', () => {
    expect(stableBoundary('```\na\n\nb')).toBe(0);
    expect(stableBoundary('- one\n\n- two')).toBe(0);
    expect(stableBoundary('> one\n\n> two')).toBe(0);
    expect(stableBoundary('- one\n\n  more of one')).toBe(0);
  });

  it('parses a split text the same as the whole', () => {
    const text = '# Title\n\nSome **bold** text.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\nLast words';
    const at = stableBoundary(text);
    const parts: MarkdownBlock[] = [
      ...parseMarkdown(text.slice(0, at)),
      ...parseMarkdown(text.slice(at), { streaming: true }),
    ];
    expect(parts).toEqual(parseMarkdown(text, { streaming: true }));
  });
});

describe('emphasis closer memory', () => {
  // A small seeded generator, so a failure always reproduces.
  function random(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
  }

  it('parses exactly as a scan without memory on thousands of generated strings', () => {
    const next = random(20261122);
    const alphabet = ['*', '*', '_', '~', '`', '\\', ' ', 'a', 'b', '[', ']', '(', ')'];
    const differ: string[] = [];
    for (let n = 0; n < 4000; n += 1) {
      const length = 1 + Math.floor(next() * 24);
      let text = '';
      for (let i = 0; i < length; i += 1)
        text += alphabet[Math.floor(next() * alphabet.length)] ?? '';
      for (const autoClose of [false, true]) {
        const base = { protocols: ['https'], autoClose };
        const remembered = JSON.stringify(parseInline(text, base));
        const plain = JSON.stringify(parseInline(text, { ...base, memo: false }));
        if (remembered !== plain) differ.push(JSON.stringify(text));
      }
    }
    expect(differ).toEqual([]);
  });

  it('agrees with a scan without memory on a case an earlier memory got wrong', () => {
    const text = '\\**b**~~` *a** *';
    expect(parseInline(text, { protocols: [], autoClose: false })).toEqual(
      parseInline(text, { protocols: [], autoClose: false, memo: false }),
    );
  });
});

describe('Markdown while streaming', () => {
  it('parses a finished hostile paragraph once, not again for every paragraph after it', () => {
    const hostile = '[a]('.repeat(20000);
    const { rerender } = render(<Markdown streaming>{hostile}</Markdown>);
    const started = performance.now();
    let text = hostile;
    for (let n = 0; n < 5; n += 1) {
      text += `\n\nParagraph ${String(n)} arrives`;
      rerender(<Markdown streaming>{text}</Markdown>);
    }
    expect(performance.now() - started).toBeLessThan(2000);
    expect(screen.getByText('Paragraph 4 arrives')).toBeInTheDocument();
  });
});
