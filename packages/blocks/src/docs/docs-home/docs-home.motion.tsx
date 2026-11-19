import { motioned } from '../lib/motion-parts';
import {
  DocsHero as PlainDocsHero,
  LinkCards as PlainLinkCards,
  type DocsHeroProps,
  type LinkCardsProps,
} from './docs-home';

export type { DocsHeroProps, LinkCardsProps };

/** DocsHero whose copy and aside fade up once, on first view. */
export const DocsHero = motioned<DocsHeroProps>(PlainDocsHero, 'DocsHero');
/** LinkCards that arrive one after another, once, on first view. */
export const LinkCards = motioned<LinkCardsProps>(PlainLinkCards, 'LinkCards');
