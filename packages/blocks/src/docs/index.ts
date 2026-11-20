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
export {
  COPY_BUTTON_MESSAGES,
  CopyButton,
  type CopyButtonMessages,
  type CopyButtonProps,
} from './lib/copy-button';
export {
  DOCS_HEADER_MESSAGES,
  DOCS_LAYOUT_MESSAGES,
  DocsHeader,
  DocsLayout,
  type DocsHeaderLink,
  type DocsHeaderMessages,
  type DocsHeaderProps,
  type DocsLayoutMessages,
  type DocsLayoutProps,
} from './docs-layout/docs-layout';
export {
  DOCS_SIDEBAR_MESSAGES,
  DocsSidebar,
  type DocsSidebarMessages,
  type DocsSidebarProps,
} from './docs-sidebar/docs-sidebar';
export {
  DOCS_TOC_MESSAGES,
  DocsToc,
  type DocsTocMessages,
  type DocsTocProps,
} from './docs-toc/docs-toc';
export * from './docs-toc/docs-toc.logic';
export {
  DOCS_TABLE_MESSAGES,
  DocsHeading,
  DocsProse,
  DocsTable,
  Figure,
  type DocsHeadingProps,
  type DocsTableMessages,
  type FigureProps,
} from './prose/prose';
export {
  CALLOUT_MESSAGES,
  Callout,
  type CalloutMessages,
  type CalloutProps,
  type CalloutType,
} from './prose/callout';
export { STEPS_MESSAGES, Step, Steps, type StepProps, type StepsMessages } from './prose/steps';
export {
  FILE_TREE_MESSAGES,
  FileTree,
  type FileTreeEntry,
  type FileTreeMessages,
  type FileTreeProps,
} from './prose/file-tree';
export { docsMdxComponents } from './prose/mdx';
export {
  CODE_BLOCK_MESSAGES,
  CodeBlock,
  type CodeBlockMessages,
  type CodeBlockProps,
} from './code-block/code-block';
export * from './code-block/code-block.logic';
export {
  CODE_TABS_MESSAGES,
  INSTALL_TABS_MESSAGES,
  CodeTabs,
  InstallTabs,
  type CodeTab,
  type CodeTabsMessages,
  type CodeTabsProps,
  type InstallTabsMessages,
  type InstallTabsProps,
} from './code-tabs/code-tabs';
export * from './code-tabs/code-tabs.logic';
export {
  ENDPOINT_MESSAGES,
  PROPS_TABLE_MESSAGES,
  SIGNATURE_CARD_MESSAGES,
  Endpoint,
  MethodBadge,
  PropsTable,
  SignatureCard,
  type EndpointMessages,
  type EndpointProps,
  type EndpointResponse,
  type HttpMethod,
  type PropRow,
  type PropsTableMessages,
  type PropsTableProps,
  type SignatureCardMessages,
  type SignatureCardProps,
  type SignatureParam,
} from './api-reference/api-reference';
export {
  DOCS_SEARCH_MESSAGES,
  DocsSearch,
  type DocsSearchMessages,
  type DocsSearchProps,
} from './docs-search/docs-search';
export * from './docs-search/docs-search.logic';
export {
  DOCS_BREADCRUMB_MESSAGES,
  DOCS_PAGE_META_MESSAGES,
  DOCS_PAGER_MESSAGES,
  DocsBreadcrumb,
  DocsPageMeta,
  DocsPager,
  type DocsBreadcrumbMessages,
  type DocsBreadcrumbProps,
  type DocsPageMetaMessages,
  type DocsPageMetaProps,
  type DocsPagerMessages,
  type DocsPagerProps,
} from './page-nav/page-nav';
export {
  LANGUAGE_SWITCHER_MESSAGES,
  VERSION_SWITCHER_MESSAGES,
  LanguageSwitcher,
  VersionSwitcher,
  type DocsLanguage,
  type DocsVersion,
  type LanguageSwitcherMessages,
  type LanguageSwitcherProps,
  type VersionSwitcherMessages,
  type VersionSwitcherProps,
} from './switchers/switchers';
export {
  DOCS_FEEDBACK_MESSAGES,
  DocsFeedback,
  type DocsFeedbackMessages,
  type DocsFeedbackProps,
} from './feedback/feedback';
export * from './feedback/feedback.logic';
export {
  DOCS_HERO_MESSAGES,
  DocsActionLink,
  DocsHero,
  LinkCards,
  type DocsAction,
  type DocsHeroMessages,
  type DocsHeroProps,
  type LinkCard,
  type LinkCardsProps,
} from './docs-home/docs-home';
export {
  CHANGELOG_MESSAGES,
  Changelog,
  type ChangelogMessages,
  type ChangelogProps,
} from './changelog/changelog';
export * from './changelog/changelog.logic';
