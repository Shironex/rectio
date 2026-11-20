'use client';

import { cn } from '@rectio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { PageHeader } from '../page-header';
import { SETTINGS_SECTIONS } from '../shell/sections';

/** The settings pages: one nav for every section, beside the page on a wide screen, above it on a phone. */
export function SettingsFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-4 lg:items-start lg:gap-10">
        <nav aria-label="Settings" className="lg:sticky lg:top-20">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0">
            {SETTINGS_SECTIONS.map((section) => {
              const current = pathname === section.href;
              return (
                <li key={section.href} className="shrink-0">
                  <Link
                    href={section.href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex flex-col rounded-control px-3 py-2 text-sm transition-colors duration-fast ease-standard pointer-coarse:py-3',
                      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                      current
                        ? 'bg-surface-selected font-medium text-fg'
                        : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
                    )}
                  >
                    {section.label}
                    <span className="text-xs font-normal text-fg-subtle max-lg:hidden">
                      {section.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <section
          aria-labelledby="settings-title"
          className="flex min-w-0 lg:col-span-3 flex-col gap-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="settings-title" className="font-display text-xl font-heading tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-fg-muted">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </>
  );
}
