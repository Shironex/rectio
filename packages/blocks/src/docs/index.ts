/**
 * rectio pro docs blocks, plain variant: the pieces of a documentation site, for any React
 * framework and any MDX setup. Blocks that move have a motioned twin with the same name and props
 * in `@rectio/blocks/docs/motion`; pick per block by import path. Content is data: navigation,
 * headings, releases and search results are props, and nothing here fetches.
 */
export * from './lib/docs';
export {
  DocsLink,
  DocsLinkProvider,
  type DocsLinkProps,
  type DocsLinkRender,
  type DocsLinkRenderProps,
} from './lib/link';
export { DocsBadge, badgeFrom } from './lib/badge';
export { CopyButton, type CopyButtonProps } from './lib/copy-button';
export {
  DocsHeader,
  DocsLayout,
  type DocsHeaderLink,
  type DocsHeaderProps,
  type DocsLayoutProps,
} from './docs-layout/docs-layout';
export { DocsSidebar, type DocsSidebarProps } from './docs-sidebar/docs-sidebar';
export { DocsToc, type DocsTocProps } from './docs-toc/docs-toc';
export * from './docs-toc/docs-toc.logic';
export {
  DocsHeading,
  DocsProse,
  DocsTable,
  Figure,
  type DocsHeadingProps,
  type FigureProps,
} from './prose/prose';
export { Callout, type CalloutProps, type CalloutType } from './prose/callout';
export { Step, Steps, type StepProps } from './prose/steps';
export { FileTree, type FileTreeEntry, type FileTreeProps } from './prose/file-tree';
export { docsMdxComponents } from './prose/mdx';
export { CodeBlock, type CodeBlockProps } from './code-block/code-block';
export * from './code-block/code-block.logic';
export {
  CodeTabs,
  InstallTabs,
  type CodeTab,
  type CodeTabsProps,
  type InstallTabsProps,
} from './code-tabs/code-tabs';
export * from './code-tabs/code-tabs.logic';
export {
  Endpoint,
  MethodBadge,
  PropsTable,
  SignatureCard,
  type EndpointProps,
  type EndpointResponse,
  type HttpMethod,
  type PropRow,
  type PropsTableProps,
  type SignatureCardProps,
  type SignatureParam,
} from './api-reference/api-reference';
export { DocsSearch, type DocsSearchProps } from './docs-search/docs-search';
export * from './docs-search/docs-search.logic';
export {
  DocsBreadcrumb,
  DocsPageMeta,
  DocsPager,
  type DocsBreadcrumbProps,
  type DocsPageMetaProps,
  type DocsPagerProps,
} from './page-nav/page-nav';
export {
  LanguageSwitcher,
  VersionSwitcher,
  type DocsLanguage,
  type DocsVersion,
  type LanguageSwitcherProps,
  type VersionSwitcherProps,
} from './switchers/switchers';
export { DocsFeedback, type DocsFeedbackProps } from './feedback/feedback';
export * from './feedback/feedback.logic';
export {
  DocsActionLink,
  DocsHero,
  LinkCards,
  type DocsAction,
  type DocsHeroProps,
  type LinkCard,
  type LinkCardsProps,
} from './docs-home/docs-home';
export { Changelog, type ChangelogProps } from './changelog/changelog';
export * from './changelog/changelog.logic';
