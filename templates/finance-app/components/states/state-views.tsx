'use client';

import { ArrowClockwiseIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button, EmptyState, SkeletonChart, SkeletonLine, SkeletonTable } from '@rectio/ui';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

/** The frame of a panel while it loads, matching the block it stands in for. */
export function LoadingPanel({
  kind = 'table',
  rows = 6,
  className,
}: {
  kind?: 'table' | 'chart' | 'figures' | 'list';
  rows?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`flex min-w-0 flex-col gap-5 rounded-panel border border-line bg-surface px-5 pt-4 pb-5 ${className ?? ''}`}
    >
      <div className="flex flex-col gap-2">
        <SkeletonLine size="lg" width="40%" />
        <SkeletonLine size="sm" width="25%" />
      </div>
      {kind === 'chart' && <SkeletonChart className="h-56" />}
      {kind === 'table' && <SkeletonTable rows={rows} columns={4} numeric />}
      {kind === 'list' && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine size="2xl" width="2rem" index={i} />
              <div className="flex flex-1 flex-col gap-1.5">
                <SkeletonLine size="base" width="60%" index={i} />
                <SkeletonLine size="sm" width="35%" index={i} />
              </div>
            </div>
          ))}
        </div>
      )}
      {kind === 'figures' && (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonLine size="sm" width="50%" index={i} />
              <SkeletonLine size="2xl" width="80%" index={i} />
              <SkeletonLine size="xs" width="40%" index={i} />
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
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A load that failed: what failed, that nothing was lost, and a way to try again. */
export function ErrorPanel({ title, description }: { title: string; description?: ReactNode }) {
  const router = useRouter();
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
              router.replace(location.pathname);
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
