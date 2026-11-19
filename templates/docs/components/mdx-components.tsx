import type { ComponentProps, ReactNode } from 'react';

import {
  Callout,
  DocsBadge,
  DocsHeading,
  DocsTable,
  Figure,
  FileTree,
  InstallTabs,
  Kbd,
  KbdShortcut,
  LinkCards,
  PropsTable,
  Step,
  Steps,
} from './blocks';
import { Code, HighlightedCodeTabs, HighlightedEndpoint, HighlightedSignatureCard } from './code';
import { DocsAnchor } from './links';

interface HeadingProps {
  children?: ReactNode;
  id?: string;
}

/**
 * What each Markdown element and each component name in a page becomes. Add your own components
 * here to use them in any page without an import.
 */
export const mdxComponents = {
  h2: ({ children, id }: HeadingProps) => (
    <DocsHeading level={2} id={id}>
      {children}
    </DocsHeading>
  ),
  h3: ({ children, id }: HeadingProps) => (
    <DocsHeading level={3} id={id}>
      {children}
    </DocsHeading>
  ),
  h4: ({ children, id }: HeadingProps) => (
    <DocsHeading level={4} id={id}>
      {children}
    </DocsHeading>
  ),
  table: (props: ComponentProps<'table'>) => (
    <DocsTable>
      <table {...props} />
    </DocsTable>
  ),
  a: DocsAnchor,
  Code,
  Callout,
  Steps,
  Step,
  FileTree,
  Figure,
  Badge: DocsBadge,
  Kbd,
  KbdShortcut,
  CodeTabs: HighlightedCodeTabs,
  InstallTabs,
  PropsTable,
  SignatureCard: HighlightedSignatureCard,
  Endpoint: HighlightedEndpoint,
  LinkCards,
};
