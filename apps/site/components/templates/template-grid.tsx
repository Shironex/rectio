import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { Badge, cn } from '@rectio/ui';
import Link from 'next/link';

import { CATEGORY_LABELS, readTemplates } from '@/lib/templates';

import { ProBadge } from '../pro-badge';

import { TemplateFrame } from './template-frame';

/** Every template on the docs index: capture, name, category and one sentence each. */
export function TemplateGrid() {
  const templates = readTemplates();
  return (
    <ul className="not-prose my-8 grid gap-8 sm:grid-cols-2">
      {templates.map((template, i) => (
        <li
          key={template.name}
          // An odd count gives the first template the whole row, so the grid never ends on a hole.
          className={cn(
            'group relative flex flex-col gap-4',
            i === 0 && templates.length % 2 === 1 && 'sm:col-span-2',
          )}
        >
          <TemplateFrame template={template} />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-strong text-fg">
                <Link
                  href={template.href}
                  className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                >
                  {template.title}
                </Link>
              </h2>
              <Badge>{CATEGORY_LABELS[template.category]}</Badge>
              <ProBadge />
            </div>
            <p className="max-w-prose text-sm text-pretty text-fg-muted">{template.description}</p>
            {/* Positioned after the title's stretched link, so it sits above it and stays its own target. */}
            <Link
              href={template.previewHref}
              className="relative inline-flex min-h-11 items-center gap-1.5 self-start rounded-control text-sm font-medium text-fg underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:min-h-8"
            >
              Live preview
              <ArrowRightIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
