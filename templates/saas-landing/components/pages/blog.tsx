'use client';

import { ArticleList, Newsletter, readingMinutes } from '@rectio/blocks/marketing/motion';

import { ArticleCover } from '@/components/article-cover';
import { PageIntro } from '@/components/page-intro';
import { ARTICLES, articleText } from '@/data/blog';
import { subscribe } from '@/lib/forms';

const SUMMARIES = ARTICLES.map((article) => ({
  id: article.slug,
  title: article.title,
  href: `/blog/${article.slug}`,
  excerpt: article.excerpt,
  date: article.date,
  author: { name: article.author.name },
  tag: article.tag,
  readingMinutes: readingMinutes(articleText(article)),
  cover: <ArticleCover cover={article.cover} />,
}));

export function BlogPage() {
  return (
    <>
      <PageIntro
        title="The Rostra blog"
        description="Customer stories, guides to running fair rotas, and what is new in the product."
      />
      <ArticleList
        title="All articles"
        articles={SUMMARIES}
        locale="en-GB"
        className="pt-0 sm:pt-0"
      />
      <Newsletter
        title="The rota letter"
        description="One email a month: a new guide, a customer story and what shipped. No tracking pixels."
        note="Unsubscribe with one click, any time."
        onSubscribe={subscribe}
      />
    </>
  );
}
