import type { Metadata } from 'next';
import Link from 'next/link';

import { CopyCommand } from '@/components/landing/copy-command';
import { Footer } from '@/components/landing/footer';
import { ProBadge } from '@/components/pro-badge';
import { TemplateActions } from '@/components/templates/template-actions';
import { TemplateFrame } from '@/components/templates/template-frame';
import { CATEGORY_LABELS, readTemplates } from '@/lib/templates';

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'Complete Next.js apps built from the rectio kit. Open any of them live, page by page, in both themes.',
};

/**
 * Every template with a template.json, read at build time: a new template folder appears here with
 * no change to the site. Each one opens live in the viewer.
 */
export default function TemplatesPage() {
  const templates = readTemplates();
  return (
    <>
      <div id="content" className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-8 md:pt-20">
        <header className="flex max-w-2xl flex-col gap-4">
          <h1 className="site-enter font-display text-4xl font-heading tracking-tight text-balance text-fg md:text-5xl">
            Templates
          </h1>
          <p className="site-enter site-step-1 text-lg text-pretty text-fg-muted">
            Whole apps built only from the kit. Open one to use it as it ships: every page, at
            desktop, tablet or phone width, in both themes.
          </p>
        </header>

        {templates.length === 0 ? (
          <p className="mt-16 rounded-panel border border-dashed border-line-strong p-8 text-base text-fg-muted">
            No templates yet. Every template is built from the same components and blocks as the
            docs.
          </p>
        ) : (
          <ol className="mt-14 flex flex-col md:mt-20">
            {templates.map((template, i) => (
              <li
                key={template.name}
                className="site-reveal group grid grid-cols-1 items-center gap-6 border-t border-line py-10 first:border-t-0 sm:gap-8 first:pt-0 md:py-16 lg:grid-cols-12 lg:gap-12"
              >
                <Link
                  href={template.previewHref}
                  tabIndex={-1}
                  aria-hidden
                  className="site-gallery-frame lg:col-span-7"
                >
                  <TemplateFrame template={template} phone eager={i === 0} />
                </Link>
                <div className="flex min-w-0 flex-col items-start gap-4 lg:col-span-5">
                  <p className="flex items-center gap-2 text-base text-fg-muted">
                    <ProBadge />
                    {CATEGORY_LABELS[template.category]}, {template.pages.length}{' '}
                    {template.pages.length === 1 ? 'page' : 'pages'}
                  </p>
                  <h2 className="font-display text-3xl font-heading tracking-tight text-fg">
                    {template.title}
                  </h2>
                  <p className="max-w-prose text-base text-pretty text-fg-muted">
                    {template.description}
                  </p>
                  <TemplateActions template={template} size="lg" className="mt-2" />
                  <div className="mt-2 flex w-full flex-col items-start gap-2 border-t border-line pt-5">
                    <p className="text-sm text-fg-muted">Start a project from it</p>
                    <CopyCommand command={template.command} />
                    <p className="text-sm text-fg-muted">
                      The command asks for your Pro license key.
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <Footer />
    </>
  );
}
