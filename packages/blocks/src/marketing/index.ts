/**
 * rectio pro marketing blocks, plain variant: the sections of a product site. Each block that moves
 * has a motioned twin with the same name and props in `@rectio/blocks/marketing/motion`; pick per
 * block by import path. Content is data: every headline, link and list is a prop.
 */
export {
  ActionLink,
  Actions,
  Anchor,
  type ActionSize,
  type ActionVariant,
  type MarketingAction,
  type MarketingLink,
} from './lib/action';
export { Container, Em, Eyebrow, Section, SectionHeader } from './lib/section';
export type { SectionHeaderProps, SectionProps, SectionTone, SectionWidth } from './lib/section';
export { Prose } from './lib/prose';
export { Marquee } from './lib/marquee';
export { formatDate, isEmail, readingMinutes, slugify } from './lib/marketing';
export { AnnouncementBar, type AnnouncementBarProps } from './announcement-bar/announcement-bar';
export { SiteHeader, type SiteHeaderProps } from './site-header/site-header';
export {
  FloatingCardFrame,
  HeroCentered,
  HeroFloating,
  HeroFrame,
  HeroSplit,
  type FloatingCard,
  type FloatingCardPosition,
  type HeroCenteredProps,
  type HeroFloatingProps,
  type HeroSplitProps,
  type HeroWash,
} from './hero/hero';
export { HeroWordCycle, useWordCycle, type HeroWordCycleProps } from './hero/hero-word-cycle';
export { LogoStrip, type Logo, type LogoStripProps } from './logo-strip/logo-strip';
export {
  FeatureBento,
  FeatureIconGrid,
  FeatureRows,
  type BentoItem,
  type BentoSize,
  type BentoTone,
  type FeatureBentoProps,
  type FeatureIconGridProps,
  type FeatureRow,
  type FeatureRowsProps,
  type IconFeature,
} from './feature-grid/feature-grid';
export { StatRow, type StatRowProps } from './stat-row/stat-row';
export * from './stat-row/stat-row.logic';
export {
  TestimonialGrid,
  TestimonialMarquee,
  TestimonialQuote,
  type Testimonial,
  type TestimonialGridProps,
  type TestimonialMarqueeProps,
  type TestimonialQuoteProps,
} from './testimonials/testimonials';
export { Faq, type FaqItem, type FaqProps } from './faq/faq';
export { CtaBand, type CtaBandProps } from './cta-band/cta-band';
export { Newsletter, type NewsletterProps } from './newsletter/newsletter';
export { Team, type TeamMember, type TeamProps, type TeamValue } from './team/team';
export { ContactSection, type ContactChannel, type ContactSectionProps } from './contact/contact';
export * from './contact/contact.logic';
export {
  ArticleLayout,
  ArticleList,
  type ArticleAuthor,
  type ArticleHeading,
  type ArticleLayoutProps,
  type ArticleListProps,
  type ArticleSummary,
} from './blog/blog';
export {
  SiteFooter,
  type FooterColumn,
  type SiteFooterProps,
  type SocialLink,
} from './site-footer/site-footer';
export { LegalPage, templateSections, type LegalPageProps, type LegalSection } from './legal/legal';
export * from './legal/legal.logic';
export {
  CookieConsent,
  CookiePreferences,
  type CookieConsentProps,
  type CookiePreferencesProps,
} from './cookie-consent/cookie-consent';
export * from './cookie-consent/cookie-consent.logic';
