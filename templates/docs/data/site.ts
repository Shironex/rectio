import type { DocsHeaderLink, DocsLanguage, DocsVersion } from '@rectio/blocks/docs';

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  install: string;
  repository: string;
  editBase: string;
  locale: string;
  links: readonly DocsHeaderLink[];
  versions: readonly DocsVersion[];
  languages: readonly DocsLanguage[];
  /** Post "Was this page helpful?" answers to /api/docs-feedback (see components/feedback.tsx). */
  collectFeedback: boolean;
}

/**
 * Everything about the site that is not a page: the product's name, the links across the top,
 * versions, languages and where "Edit this page" points. Change these first.
 */
export const SITE: SiteConfig = {
  name: 'Halyard',
  /** The browser tab and search results. */
  title: 'Halyard docs',
  description:
    'Typed background jobs for TypeScript: queues, retries, schedules and a dashboard, in one package.',
  /** The package a reader installs first, shown on the home page with a copy button. */
  install: 'npm install @halyard/core',
  /** The repository, linked from the header. */
  repository: 'https://github.com/example/halyard',
  /** "Edit this page" opens this URL followed by the page's path under content/docs. */
  editBase: 'https://github.com/example/halyard/edit/main/docs/content/docs/',
  /** The language of the pages, for dates and the `lang` attribute. */
  locale: 'en-GB',
  links: [
    { label: 'Docs', href: '/docs' },
    { label: 'API', href: '/docs/api' },
    { label: 'Changelog', href: '/changelog' },
  ],
  /** The version these pages document comes first. Point the others at their own deployments. */
  versions: [
    { value: '2', label: 'v2', href: '/docs', note: 'Latest' },
    { value: '1', label: 'v1', href: 'https://v1.docs.example.com', note: 'Legacy' },
  ],
  /** Each language named in its own tongue. Leave one entry to hide the switcher. */
  languages: [
    { value: 'en', label: 'English', href: '/docs' },
    { value: 'de', label: 'Deutsch', href: 'https://de.docs.example.com' },
    { value: 'ja', label: '日本語', href: 'https://ja.docs.example.com' },
  ],
  collectFeedback: false,
};
