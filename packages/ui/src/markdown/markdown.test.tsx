import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Markdown, markdownToText, parseMarkdown, safeUrl } from './markdown';

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

  it('links bare addresses', () => {
    render(<Markdown externalLinks="same-tab">{'Docs at https://rectio.dev/docs.'}</Markdown>);
    expect(screen.getByRole('link', { name: 'https://rectio.dev/docs' })).toHaveAttribute(
      'href',
      'https://rectio.dev/docs',
    );
  });

  it('draws tables with header cells and a scrollable, focusable frame', () => {
    render(<Markdown>{'| Vendor | Amount |\n| --- | ---: |\n| Northwind | 1,200 |'}</Markdown>);
    const region = screen.getByRole('region', { name: 'Table' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(region).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(region).getByRole('cell', { name: '1,200' })).toHaveClass('text-end');
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
