import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { cn } from '@rectio/ui';
import { useId, type ReactNode } from 'react';

import {
  ActionLink,
  Anchor,
  linkFocus,
  type MarketingAction,
  type MarketingLink,
} from '../lib/action';
import { Avatar } from '../lib/avatar';
import { formatDate, isoDate } from '../lib/marketing';
import { useMarketingParts } from '../lib/parts';
import { Prose } from '../lib/prose';
import { Container, Section, SectionHeader, useHeadingId, type SectionTone } from '../lib/section';

export interface ArticleAuthor {
  name: string;
  role?: string;
  avatar?: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  href: string;
  excerpt: string;
  /** ISO date, such as 2026-03-04. */
  date: string;
  author: ArticleAuthor;
  tag?: string;
  readingMinutes?: number;
  /** A cover: an image, or a small composition of your own UI. */
  cover?: ReactNode;
}

export interface ArticleListProps {
  articles: readonly ArticleSummary[];
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /** `grid` leads with the first article large; `list` runs them as dated rows. */
  layout?: 'grid' | 'list';
  /** A link to every article, such as "All articles". */
  viewAll?: MarketingAction;
  locale?: string;
  tone?: SectionTone;
  className?: string;
}

function Meta({ article, locale }: { article: ArticleSummary; locale?: string | undefined }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
      {article.tag !== undefined && (
        <span className="font-medium text-accent-strong">{article.tag}</span>
      )}
      <time dateTime={isoDate(article.date)}>{formatDate(article.date, locale)}</time>
      {article.readingMinutes !== undefined && (
        <span>{`${String(article.readingMinutes)} min read`}</span>
      )}
    </p>
  );
}

/** The whole card is the link's hit area; only the title is the link, so it reads once. */
function Card({
  article,
  featured = false,
  locale,
}: {
  article: ArticleSummary;
  featured?: boolean;
  locale?: string | undefined;
}) {
  return (
    <article
      className={cn(
        'group/card relative flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface',
        'transition-[border-color,box-shadow] duration-base ease-standard pointer-fine:hover:border-line-strong pointer-fine:hover:shadow-raised',
        featured && '@3xl:flex-row',
      )}
    >
      {article.cover !== undefined && (
        <div
          className={cn(
            'aspect-video overflow-hidden border-b border-line bg-surface-sunken',
            featured && '@3xl:aspect-auto @3xl:w-3/5 @3xl:border-e @3xl:border-b-0',
          )}
        >
          {article.cover}
        </div>
      )}
      <div
        className={cn(
          'flex flex-1 flex-col gap-3 p-6',
          featured && '@3xl:justify-center @3xl:p-10',
        )}
      >
        <Meta article={article} locale={locale} />
        <h3
          className={cn(
            'font-display font-regular tracking-tight text-balance text-fg',
            featured ? 'text-2xl @3xl:text-3xl' : 'text-xl',
          )}
        >
          <Anchor
            href={article.href}
            className={cn(
              'after:absolute after:inset-0 pointer-fine:group-hover/card:underline underline-offset-4',
              linkFocus,
            )}
          >
            {article.title}
          </Anchor>
        </h3>
        <p className="line-clamp-3 text-base text-pretty text-fg-muted">{article.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 pt-3">
          <Avatar name={article.author.name} src={article.author.avatar} size="sm" />
          <span className="text-sm font-medium text-fg">{article.author.name}</span>
        </div>
      </div>
    </article>
  );
}

/**
 * The latest articles: a large lead and a grid, or dated rows. Each card is one link, named by the
 * article's title.
 */
export function ArticleList({
  articles,
  title,
  description,
  eyebrow,
  layout = 'grid',
  viewAll,
  locale,
  tone,
  className,
}: ArticleListProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  const [lead, ...rest] = articles;
  return (
    <Section tone={tone} width="wide" labelledBy={headingId} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeader id={headingId} title={title} description={description} eyebrow={eyebrow} />
        {viewAll !== undefined && (
          <ActionLink action={viewAll} variant="secondary" size="md" arrow />
        )}
      </div>
      {layout === 'grid' ? (
        <div className="mt-12 flex flex-col gap-6">
          {lead !== undefined && (
            <Reveal>
              <Card article={lead} featured locale={locale} />
            </Reveal>
          )}
          {rest.length > 0 && (
            <Reveal as="ul" stagger className="grid gap-6 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {rest.map((article) => (
                <li key={article.id}>
                  <Card article={article} locale={locale} />
                </li>
              ))}
            </Reveal>
          )}
        </div>
      ) : (
        <Reveal as="ul" stagger className="mt-12 flex flex-col border-t border-line">
          {articles.map((article) => (
            <li key={article.id} className="border-b border-line">
              <article className="group/row relative grid gap-3 py-8 @3xl:grid-cols-12 @3xl:gap-8">
                <div className="@3xl:col-span-3">
                  <Meta article={article} locale={locale} />
                </div>
                <div className="flex flex-col gap-2 @3xl:col-span-9">
                  <h3 className="font-display text-xl font-regular tracking-tight text-balance text-fg sm:text-2xl">
                    <Anchor
                      href={article.href}
                      className={cn(
                        'after:absolute after:inset-0 underline-offset-4 pointer-fine:group-hover/row:underline',
                        linkFocus,
                      )}
                    >
                      {article.title}
                    </Anchor>
                  </h3>
                  <p className="max-w-prose text-base text-pretty text-fg-muted">
                    {article.excerpt}
                  </p>
                  <p className="text-sm text-fg-muted">{article.author.name}</p>
                </div>
              </article>
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

export interface ArticleHeading {
  id: string;
  title: string;
}

export interface ArticleLayoutProps {
  title: string;
  /** The standfirst: one or two sentences under the title. */
  description?: ReactNode;
  tag?: string;
  /** ISO date, such as 2026-03-04. */
  date: string;
  author: ArticleAuthor;
  readingMinutes?: number;
  cover?: ReactNode;
  /** A link back to the list, such as "All articles". */
  back?: MarketingLink;
  /** The article's sections, listed beside it on wide screens. Give each `h2` the matching id. */
  headings?: readonly ArticleHeading[];
  /** Something after the body, such as a newsletter signup or related articles. */
  footer?: ReactNode;
  locale?: string;
  /** The article itself, as plain HTML elements: it is set in the prose styles. */
  children: ReactNode;
  className?: string;
}

/**
 * One article: title, standfirst, author and date, an optional cover, the body in prose styles at a
 * reading measure, and an "On this page" list beside it on wide screens.
 */
export function ArticleLayout({
  title,
  description,
  tag,
  date,
  author,
  readingMinutes,
  cover,
  back,
  headings = [],
  footer,
  locale,
  children,
  className,
}: ArticleLayoutProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  const tocId = useId();
  return (
    <article aria-labelledby={titleId} className={cn('py-12 text-fg sm:py-16', className)}>
      <Container width="wide">
        <Reveal stagger className="mx-auto flex max-w-3xl flex-col gap-6">
          {back !== undefined && (
            <Anchor
              href={back.href}
              className={cn(
                'inline-flex min-h-8 w-fit items-center gap-2 text-sm text-fg-muted pointer-fine:hover:text-fg',
                linkFocus,
              )}
            >
              <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5" />
              {back.label}
            </Anchor>
          )}
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted">
            {tag !== undefined && <span className="font-medium text-accent-strong">{tag}</span>}
            <time dateTime={isoDate(date)}>{formatDate(date, locale)}</time>
            {readingMinutes !== undefined && <span>{`${String(readingMinutes)} min read`}</span>}
          </p>
          <h1
            id={titleId}
            className="font-display text-4xl font-regular tracking-tight text-balance text-fg sm:text-5xl"
          >
            {title}
          </h1>
          {description !== undefined && (
            <p className="text-xl text-pretty text-fg-muted">{description}</p>
          )}
          <div className="flex items-center gap-3 border-t border-line pt-6">
            <Avatar name={author.name} src={author.avatar} />
            <div className="flex flex-col">
              <span className="font-medium text-fg">{author.name}</span>
              {author.role !== undefined && (
                <span className="text-sm text-fg-muted">{author.role}</span>
              )}
            </div>
          </div>
        </Reveal>
        {cover !== undefined && (
          <Reveal className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-panel border border-line">
            {cover}
          </Reveal>
        )}
        <div className="mx-auto mt-12 grid max-w-5xl gap-12 lg:grid-cols-12">
          {headings.length > 0 && (
            <nav aria-labelledby={tocId} className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-24 flex flex-col gap-3">
                <p id={tocId} className="text-sm font-medium text-fg">
                  On this page
                </p>
                <ul className="flex flex-col gap-2 border-s border-line">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className={cn(
                          '-ms-px block border-s border-transparent ps-4 text-sm text-fg-muted pointer-fine:hover:border-fg-subtle pointer-fine:hover:text-fg',
                          linkFocus,
                        )}
                      >
                        {heading.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
          <div className={cn(headings.length > 0 ? 'lg:col-span-9' : 'mx-auto lg:col-span-12')}>
            <Prose>{children}</Prose>
            {footer !== undefined && <div className="mt-16">{footer}</div>}
          </div>
        </div>
      </Container>
    </article>
  );
}
