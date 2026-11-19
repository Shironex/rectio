'use client';

import { ArticleLayout, ArticleList, readingMinutes } from '@rectio/blocks/marketing/motion';

import { ARTICLES, articleText, type Article, type ArticleBlock } from '@/data/blog';

/** A key from the block's own content: every block in an article says something different. */
function blockKey(block: ArticleBlock): string {
  switch (block.type) {
    case 'h2':
      return block.id;
    case 'ul':
    case 'ol':
      return `${block.type}:${block.items.join('|')}`;
    default:
      return `${block.type}:${block.text}`;
  }
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>;
    case 'h2':
      return <h2 id={block.id}>{block.text}</h2>;
    case 'ul':
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case 'quote':
      return (
        <blockquote>
          <p>“{block.text}”</p>
          <footer>{block.cite}</footer>
        </blockquote>
      );
  }
}

export function ArticlePage({ article }: { article: Article }) {
  const related = ARTICLES.filter((other) => other.slug !== article.slug)
    .slice(0, 3)
    .map((other) => ({
      id: other.slug,
      title: other.title,
      href: `/blog/${other.slug}`,
      excerpt: other.excerpt,
      date: other.date,
      author: { name: other.author.name },
      tag: other.tag,
      readingMinutes: readingMinutes(articleText(other)),
    }));
  return (
    <>
      <ArticleLayout
        title={article.title}
        description={article.excerpt}
        tag={article.tag}
        date={article.date}
        readingMinutes={readingMinutes(articleText(article))}
        author={article.author}
        back={{ label: 'All articles', href: '/blog' }}
        headings={article.body.flatMap((block) =>
          block.type === 'h2' ? [{ id: block.id, title: block.text }] : [],
        )}
        locale="en-GB"
      >
        {article.body.map((block) => (
          <Block key={blockKey(block)} block={block} />
        ))}
      </ArticleLayout>
      <ArticleList layout="list" title="Keep reading" articles={related} locale="en-GB" />
    </>
  );
}
