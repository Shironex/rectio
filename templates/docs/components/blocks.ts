'use client';

/**
 * The docs blocks the pages use, as client components. Server components (the pages and the MDX
 * map) import them from here, so the client boundary sits in one place. The motion variant is the
 * plain blocks plus entrances and gliding markers; import from `@rectio/blocks/docs` instead for
 * no motion at all.
 */
export {
  Callout,
  Changelog,
  CodeBlock,
  CodeTabs,
  DocsHeader,
  DocsHeading,
  DocsHero,
  DocsLayout,
  DocsPageMeta,
  DocsProse,
  DocsSidebar,
  DocsTable,
  DocsToc,
  Endpoint,
  FileTree,
  Figure,
  InstallTabs,
  LanguageSwitcher,
  LinkCards,
  PropsTable,
  SignatureCard,
  Step,
  Steps,
  VersionSwitcher,
  DocsBadge,
} from '@rectio/blocks/docs/motion';
export { Kbd, KbdShortcut } from '@rectio/ui';
