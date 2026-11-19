import { Kbd, KbdShortcut } from '@rectio/ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { Endpoint, PropsTable, SignatureCard } from '../api-reference/api-reference';
import { CodeBlock } from '../code-block/code-block';
import { CodeTabs, InstallTabs } from '../code-tabs/code-tabs';
import { LinkCards } from '../docs-home/docs-home';
import { DocsBadge } from '../lib/badge';
import { textOf } from '../lib/docs';
import { DocsLink } from '../lib/link';
import { Callout } from './callout';
import { FileTree } from './file-tree';
import { DocsHeading, DocsTable, Figure } from './prose';
import { Step, Steps } from './steps';

/**
 * A Markdown fence as most MDX setups emit it, `<pre><code className="language-ts">`, drawn as a
 * CodeBlock without highlighting. A build-time highlighter replaces this with tokens; see the docs
 * template's `Code` component for one way.
 */
function Pre({ children }: { children?: ReactNode }) {
  const code = children as ReactElement<{ className?: string; children?: ReactNode }> | undefined;
  const lang = /language-(\S+)/.exec(code?.props.className ?? '')?.[1];
  return <CodeBlock code={textOf(code?.props.children)} lang={lang} />;
}

function Anchor({ href = '', ...props }: ComponentProps<'a'>) {
  return <DocsLink href={href} {...props} />;
}

/**
 * The docs blocks under the names MDX uses: Markdown headings, tables, images, links and fences,
 * plus the components a page can write directly (`<Callout>`, `<Steps>`, `<InstallTabs>`...).
 * Pass it to your MDX provider or `evaluate` call; it works with any MDX setup.
 */
export const docsMdxComponents = {
  h2: (props: { children?: ReactNode; id?: string }) => (
    <DocsHeading level={2} id={props.id}>
      {props.children}
    </DocsHeading>
  ),
  h3: (props: { children?: ReactNode; id?: string }) => (
    <DocsHeading level={3} id={props.id}>
      {props.children}
    </DocsHeading>
  ),
  h4: (props: { children?: ReactNode; id?: string }) => (
    <DocsHeading level={4} id={props.id}>
      {props.children}
    </DocsHeading>
  ),
  table: (props: ComponentProps<'table'>) => (
    <DocsTable>
      <table {...props} />
    </DocsTable>
  ),
  a: Anchor,
  pre: Pre,
  Callout,
  Steps,
  Step,
  FileTree,
  Figure,
  Badge: DocsBadge,
  Kbd,
  KbdShortcut,
  CodeBlock,
  CodeTabs,
  InstallTabs,
  PropsTable,
  SignatureCard,
  Endpoint,
  LinkCards,
};
