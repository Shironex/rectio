'use client';

import { ArrowClockwiseIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button, EmptyState, SkeletonChart, SkeletonLine, SkeletonTable, cn } from '@rectio/ui';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

/** A row of figure cells, like the KPI strip and the summary at the top of a list. */
const STRIP_COLUMNS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

function SkeletonFigures({ count, className }: { count: number; className: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 divide-line sm:divide-x',
        STRIP_COLUMNS[count] ?? 'sm:grid-cols-4',
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 p-4">
          <SkeletonLine size="sm" width="w-1/2" index={i} />
          <SkeletonLine size="2xl" width="w-3/4" index={i} />
          <SkeletonLine size="xs" width="w-2/5" index={i} />
        </div>
      ))}
    </div>
  );
}

/** A row of tabs while the page loads: short labels over a rule. */
export function LoadingTabs({ count }: { count: number }) {
  return (
    <div aria-hidden className="flex gap-6 border-b border-line pb-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonLine key={i} size="sm" width="w-18" index={i} />
      ))}
    </div>
  );
}

/**
 * The frame of a panel while it loads, laid out like the block it stands in for: the title, then
 * optionally a figure strip, a toolbar control and a row of filter tabs, then the body.
 */
export function LoadingPanel({
  kind = 'table',
  rows = 6,
  columns = 4,
  strip = 0,
  tabs = 0,
  toolbar = false,
  className,
}: {
  kind?: 'table' | 'chart' | 'figures' | 'list';
  rows?: number;
  columns?: number;
  /** Figure cells above the body, as in the summary of a list. */
  strip?: number;
  /** Filter tabs above the body. */
  tabs?: number;
  /** One control, such as an account or period select, beside the title. */
  toolbar?: boolean;
  className?: string;
}) {
  if (kind === 'figures') {
    return (
      <div aria-hidden className={className}>
        <SkeletonFigures count={4} className="rounded-panel border border-line bg-surface" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        'flex min-w-0 flex-col gap-5 rounded-panel border border-line bg-surface px-5 pt-4 pb-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <SkeletonLine size="lg" width="w-2/5" />
          <SkeletonLine size="sm" width="w-1/4" />
        </div>
        {toolbar && <SkeletonLine size="2xl" width="w-40" />}
      </div>
      {strip > 0 && (
        <SkeletonFigures count={strip} className="rounded-control border border-line" />
      )}
      {tabs > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: tabs }, (_, i) => (
            <SkeletonLine key={i} size="xl" width="w-22" index={i} />
          ))}
        </div>
      )}
      {kind === 'chart' && <SkeletonChart className="h-56" />}
      {kind === 'table' && <SkeletonTable rows={rows} columns={columns} numeric />}
      {kind === 'list' && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine size="2xl" width="w-8" index={i} />
              <div className="flex flex-1 flex-col gap-1.5">
                <SkeletonLine size="base" width="w-3/5" index={i} />
                <SkeletonLine size="sm" width="w-1/3" index={i} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Announces that the page is loading, once, for assistive technology. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A load that failed: what failed, that nothing was lost, and a way to try again. */
export function ErrorPanel({ title, description }: { title: string; description?: ReactNode }) {
  const router = useRouter();
  // The path without the base path: the router adds it back, so a sub-path deploy keeps working.
  const pathname = usePathname();
  return (
    <div role="alert" className="rounded-panel border border-line bg-surface">
      <EmptyState
        size="lg"
        icon={<WarningCircleIcon aria-hidden weight="bold" className="text-negative-strong" />}
        title={title}
        description={
          description ??
          'The connection to the server dropped before the data arrived. Nothing was changed.'
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              router.replace(pathname);
            }}
          >
            <ArrowClockwiseIcon aria-hidden weight="bold" className="size-4" />
            Try again
          </Button>
        }
      />
    </div>
  );
}

/** A page with nothing in it yet: what will appear here and the first step. */
export function EmptyPanel({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-line bg-surface">
      <EmptyState
        size="lg"
        icon={icon}
        title={title}
        description={description}
        {...(actions === undefined ? {} : { actions })}
      />
    </div>
  );
}
