'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import Link from 'next/link';
import { useState } from 'react';

import { Segmented } from '@/components/segmented';
import { TemplateFrame } from '@/components/templates/template-frame';
import {
  CATEGORY_LABELS,
  TEMPLATE_CATEGORIES,
  type SiteTemplate,
  type TemplateCategory,
} from '@/lib/template-types';

import { CopyCommand } from './copy-command';

type Filter = 'all' | TemplateCategory;

/** A template given the room of a whole row: capture on one side, what it is on the other. */
function WideTemplate({
  template,
  reverse = false,
}: {
  template: SiteTemplate;
  reverse?: boolean;
}) {
  return (
    <article
      aria-labelledby={`template-${template.name}`}
      className="site-gallery-item group grid items-center gap-8 md:col-span-2 lg:grid-cols-12 lg:gap-12"
    >
      <Link
        href={template.href}
        tabIndex={-1}
        aria-hidden
        className={cn('site-gallery-frame lg:col-span-8', reverse && 'lg:order-last')}
      >
        <TemplateFrame template={template} phone />
      </Link>
      <TemplateText template={template} className="lg:col-span-4" large />
    </article>
  );
}

/** A template in a column of the grid: capture above, text below. */
function TemplateCard({ template }: { template: SiteTemplate }) {
  return (
    <article
      aria-labelledby={`template-${template.name}`}
      className="site-gallery-item group flex flex-col gap-6"
    >
      <Link href={template.href} tabIndex={-1} aria-hidden className="site-gallery-frame">
        <TemplateFrame template={template} />
      </Link>
      <TemplateText template={template} />
    </article>
  );
}

function TemplateText({
  template,
  large = false,
  className,
}: {
  template: SiteTemplate;
  large?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-4', className)}>
      <p className="text-sm text-fg-muted">
        {CATEGORY_LABELS[template.category]}, {template.pages.length} pages
      </p>
      <h3
        id={`template-${template.name}`}
        className={cn(
          'font-display font-heading tracking-tight text-fg',
          large ? 'text-3xl' : 'text-2xl',
        )}
      >
        {template.title}
      </h3>
      <p className="max-w-prose text-base text-pretty text-fg-muted">{template.description}</p>
      {large && <CopyCommand command={template.command} className="max-w-full overflow-x-auto" />}
      <Link
        href={template.href}
        className="site-press inline-flex min-h-11 items-center gap-2 rounded-control text-base font-medium text-fg underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        See the {template.title.toLowerCase()} template
        <ArrowRightIcon aria-hidden weight="bold" className="size-4 rtl:-scale-x-100" />
      </Link>
    </div>
  );
}

/**
 * The gallery with its category filter. The first template of the choice gets a wide row; the rest
 * share a two-column grid, and an odd last one takes a wide row of its own, mirrored, so the grid
 * never ends on a hole. An empty category says so and offers the way back.
 */
export function TemplateGallery({ templates }: { templates: SiteTemplate[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const count = (category: Filter) =>
    category === 'all' ? templates.length : templates.filter((t) => t.category === category).length;
  const shown = filter === 'all' ? templates : templates.filter((t) => t.category === filter);
  const [first, ...rest] = shown;
  const lastWide = rest.length % 2 === 1;
  const options = (['all', ...TEMPLATE_CATEGORIES] as const).map((value) => ({
    value,
    label: (
      <>
        {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
        <span className="numeric text-fg-subtle">{count(value)}</span>
      </>
    ),
  }));

  return (
    <div className="flex flex-col gap-10">
      <Segmented
        label="Template category"
        value={filter}
        options={options}
        onChange={setFilter}
        size="md"
        className="site-reveal site-step-2 max-w-full self-start overflow-x-auto"
      />
      <p role="status" className="sr-only">
        {shown.length === 1 ? '1 template' : `${String(shown.length)} templates`}
      </p>
      {/* Keyed by the filter: a new choice replays the short entrance of what it shows. */}
      <div key={filter} className="grid gap-x-8 gap-y-14 md:grid-cols-2">
        {first === undefined ? (
          <div className="site-gallery-item flex flex-col items-start gap-4 rounded-panel border border-dashed border-line-strong p-8 md:col-span-2 md:p-12">
            <h3 className="font-display text-2xl font-heading text-fg">
              No {filter === 'all' ? '' : `${CATEGORY_LABELS[filter].toLowerCase()} `}templates yet
            </h3>
            <p className="max-w-prose text-base text-fg-muted">
              More templates are on the way. Every one is built from the same components and blocks
              as the ones here.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('all');
              }}
              className="site-press inline-flex min-h-11 cursor-pointer items-center rounded-control text-base font-medium text-fg underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Show all templates
            </button>
          </div>
        ) : (
          <WideTemplate template={first} />
        )}
        {rest.map((template, i) =>
          lastWide && i === rest.length - 1 ? (
            <WideTemplate key={template.name} template={template} reverse />
          ) : (
            <TemplateCard key={template.name} template={template} />
          ),
        )}
      </div>
    </div>
  );
}
