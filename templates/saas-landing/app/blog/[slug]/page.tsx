import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticlePage } from '@/components/pages/article';
import { ARTICLES, articleBySlug } from '@/data/blog';

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  return article === undefined ? {} : { title: article.title, description: article.excerpt };
}

export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (article === undefined) notFound();
  return <ArticlePage article={article} />;
}
