/**
 * rectio pro marketing blocks, motion variant: the same names and props as
 * `@rectio/blocks/marketing`, built on `@rectio/motion`. Sections fade up once, on first view,
 * stats count to their figure and a cycling headline slides its words; reduced motion renders the
 * plain blocks. Blocks with nothing to animate are exported here unchanged, so a page can import
 * every block from one path.
 */
export * from './index';
export { HeroCentered, HeroFloating, HeroSplit, HeroWordCycle } from './hero/hero.motion';
export { LogoStrip } from './logo-strip/logo-strip.motion';
export { FeatureBento, FeatureIconGrid, FeatureRows } from './feature-grid/feature-grid.motion';
export { StatRow } from './stat-row/stat-row.motion';
export {
  TestimonialGrid,
  TestimonialMarquee,
  TestimonialQuote,
} from './testimonials/testimonials.motion';
export { Faq } from './faq/faq.motion';
export { CtaBand } from './cta-band/cta-band.motion';
export { Newsletter } from './newsletter/newsletter.motion';
export { Team } from './team/team.motion';
export { ContactSection } from './contact/contact.motion';
export { ArticleLayout, ArticleList } from './blog/blog.motion';
export { CookieConsent, CookiePreferences } from './cookie-consent/cookie-consent.motion';
