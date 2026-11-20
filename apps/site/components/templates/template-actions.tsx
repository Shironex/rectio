'use client';

import { ArrowRightIcon, ArrowSquareOutIcon, BookOpenTextIcon } from '@phosphor-icons/react';
import { Button, cn, type ButtonSize } from '@rectio/ui';
import Link from 'next/link';

import { previewBase } from '@/lib/previews-url';
import type { SiteTemplate } from '@/lib/template-types';

/**
 * The ways into a template from a page about it: the live viewer first, then its docs or the whole
 * app in a new tab. Server pages render it; the kit's Button is a client component.
 */
export function TemplateActions({
  template,
  secondary = 'docs',
  size = 'md',
  className,
}: {
  template: Pick<SiteTemplate, 'name' | 'href' | 'previewHref'>;
  /** The second action: the docs page (from the gallery) or the full screen app (from the docs). */
  secondary?: 'docs' | 'full-screen';
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-wrap items-center gap-2', className)}>
      <Button
        size={size}
        nativeButton={false}
        render={<Link href={template.previewHref} />}
        className="max-sm:flex-1"
      >
        Live preview
        <ArrowRightIcon aria-hidden weight="bold" className="size-4 rtl:-scale-x-100" />
      </Button>
      {secondary === 'docs' ? (
        <Button
          size={size}
          variant="secondary"
          nativeButton={false}
          render={<Link href={template.href} />}
          className="max-sm:flex-1"
        >
          <BookOpenTextIcon aria-hidden weight="bold" className="size-4" />
          Docs
        </Button>
      ) : (
        <Button
          size={size}
          variant="secondary"
          nativeButton={false}
          render={
            <a href={`${previewBase(template.name)}/`} target="_blank" rel="noopener noreferrer" />
          }
          className="max-sm:flex-1"
        >
          <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
          Open full screen
          <span className="sr-only"> (opens in a new tab)</span>
        </Button>
      )}
    </div>
  );
}
