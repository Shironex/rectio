import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DocsLayout, DocsPageMeta, DocsProse, DocsToc, DocsBadge } from '@/components/blocks';
import { PageFeedback } from '@/components/feedback';
import { PageBreadcrumb, PagePager } from '@/components/page-nav';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { DocsSidebar } from '@/components/blocks';
import { getNav, getPage, getPages } from '@/lib/content';
import { renderMdx } from '@/lib/mdx';
import { SITE } from '@/data/site';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams() {
  return getPages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getPage((await params).slug ?? []);
  if (page === undefined) return {};
  return {
    title: page.frontmatter.title,
    ...(page.frontmatter.description === undefined
      ? {}
      : { description: page.frontmatter.description }),
  };
}

export default async function DocsPage({ params }: Props) {
  const page = getPage((await params).slug ?? []);
  if (page === undefined) notFound();
  const sections = getNav();
  const { content, headings } = await renderMdx(page.body);
  const tocHeadings = headings.filter((heading) => heading.level <= 3);
  const showToc = page.frontmatter.toc !== false && tocHeadings.length > 1;
  return (
    <DocsLayout
      header={<SiteHeader sections={sections} currentHref={page.href} />}
      sidebar={<DocsSidebar sections={sections} currentHref={page.href} />}
      toc={showToc ? <DocsToc headings={tocHeadings} /> : undefined}
      top={<PageBreadcrumb sections={sections} href={page.href} />}
      bottom={
        <>
          <PageFeedback page={page.href} />
          <DocsPageMeta
            editHref={`${SITE.editBase}${page.file}`}
            lastUpdated={page.frontmatter.updated}
            locale={SITE.locale}
          />
          <PagePager sections={sections} href={page.href} />
        </>
      }
      footer={<SiteFooter />}
    >
      <article>
        <header className="mb-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-heading tracking-tight text-balance text-fg sm:text-4xl">
              {page.frontmatter.title}
            </h1>
            {page.frontmatter.badge !== undefined && (
              <DocsBadge tone={page.frontmatter.badge.toLowerCase() === 'beta' ? 'beta' : 'new'}>
                {page.frontmatter.badge}
              </DocsBadge>
            )}
          </div>
          {page.frontmatter.description !== undefined && (
            <p className="max-w-prose text-lg text-pretty text-fg-muted">
              {page.frontmatter.description}
            </p>
          )}
        </header>
        <DocsProse>{content}</DocsProse>
      </article>
    </DocsLayout>
  );
}
