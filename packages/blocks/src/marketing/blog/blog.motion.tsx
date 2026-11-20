'use client';

import { motioned } from '../lib/motion-parts';
import {
  ArticleList as PlainArticleList,
  ArticleLayout as PlainArticleLayout,
  type ArticleListProps,
  type ArticleLayoutProps,
} from './blog';

export type { ArticleListProps, ArticleLayoutProps };

/** ArticleList with entrances that play once, on first view; plain under reduced motion. */
export const ArticleList = motioned<ArticleListProps>(PlainArticleList, 'ArticleList');
/** ArticleLayout with entrances that play once, on first view; plain under reduced motion. */
export const ArticleLayout = motioned<ArticleLayoutProps>(PlainArticleLayout, 'ArticleLayout');
