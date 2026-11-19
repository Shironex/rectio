/**
 * The MDX pipeline: a page's body becomes React at build time with @mdx-js/mdx, GitHub flavoured
 * Markdown, ids on the headings for the table of contents, and code fences highlighted by shiki.
 * Nothing here runs in the browser.
 */
import { evaluate } from '@mdx-js/mdx';
import type { TocHeading } from '@rectio/blocks/docs';
import type { Code, Heading, Root, RootContent } from 'mdast';
import type { ReactNode } from 'react';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

import { mdxComponents } from '@/components/mdx-components';

import { slugify, uniqueSlugs } from './slugs';

function textOf(node: RootContent | Root): string {
  if ('value' in node && typeof node.value === 'string') return node.value;
  if ('children' in node) return node.children.map((child) => textOf(child)).join('');
  return '';
}

interface JsxNode {
  type: 'mdxJsxFlowElement';
  name: string | null;
  attributes: { type: string; name?: string; value?: unknown }[];
}

function attribute(node: JsxNode, name: string): string | undefined {
  const found = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
  return typeof found?.value === 'string' ? found.value : undefined;
}

/**
 * Gives every h2 to h4 an id, numbering repeats, and lists them for the table of contents with
 * the API entries (`<SignatureCard>` and `<Endpoint>`, which draw their own headings) in order.
 */
function remarkHeadingIds(sink: TocHeading[]) {
  return () => (tree: Root) => {
    const headings: Heading[] = [];
    visit(tree, 'heading', (node) => {
      if (node.depth >= 2 && node.depth <= 4) headings.push(node);
    });
    const titles = headings.map((node) => textOf(node));
    const ids = uniqueSlugs(titles);
    headings.forEach((node, index) => {
      const id = ids[index] ?? '';
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    });
    visit(tree, (node) => {
      if (node.type === 'heading') {
        const index = headings.indexOf(node);
        if (index >= 0) {
          sink.push({
            id: ids[index] ?? '',
            title: titles[index] ?? '',
            level: node.depth as 2 | 3 | 4,
          });
        }
        return;
      }
      if (node.type !== 'mdxJsxFlowElement') return;
      const jsx = node as unknown as JsxNode;
      const title =
        jsx.name === 'SignatureCard'
          ? attribute(jsx, 'name')
          : jsx.name === 'Endpoint'
            ? attribute(jsx, 'title')
            : undefined;
      if (title === undefined) return;
      const level = Number(attribute(jsx, 'level') ?? 3);
      sink.push({ id: slugify(title), title, level: level === 2 ? 2 : 3 });
    });
  };
}

/** Turns each code fence into `<Code code lang meta />`, which highlights it with shiki. */
function remarkCodeElements() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (parent === undefined || index === undefined) return;
      const attributes = [
        { type: 'mdxJsxAttribute' as const, name: 'code', value: node.value },
        ...(node.lang == null
          ? []
          : [{ type: 'mdxJsxAttribute' as const, name: 'lang', value: node.lang }]),
        ...(node.meta == null
          ? []
          : [{ type: 'mdxJsxAttribute' as const, name: 'meta', value: node.meta }]),
      ];
      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'Code',
        attributes,
        children: [],
      } as unknown as RootContent;
    });
  };
}

export interface RenderedPage {
  content: ReactNode;
  headings: TocHeading[];
}

export async function renderMdx(body: string): Promise<RenderedPage> {
  const headings: TocHeading[] = [];
  const { default: Content } = await evaluate(body, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkHeadingIds(headings), remarkCodeElements],
  });
  return { content: <Content components={mdxComponents} />, headings };
}
