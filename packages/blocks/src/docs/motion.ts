/**
 * rectio pro docs blocks, motion variant: the same names and props as `@rectio/blocks/docs`, built
 * on `@rectio/motion`. The table of contents glides its marker, code tabs glide their indicator,
 * the home page and releases fade up once on first view and feedback fades its thanks in; reduced
 * motion renders the plain blocks. Blocks with nothing to animate are exported here unchanged, so
 * a site can import every block from one path.
 */
export * from './index';
export { DocsToc } from './docs-toc/docs-toc.motion';
export { CodeTabs, InstallTabs } from './code-tabs/code-tabs.motion';
export { DocsFeedback } from './feedback/feedback.motion';
export { DocsHero, LinkCards } from './docs-home/docs-home.motion';
export { Changelog } from './changelog/changelog.motion';
