import type { ReactNode } from 'react';

/** The top of a page: its title, one line of context, and the page's own actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-2xl font-heading tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {description !== undefined && (
          <p className="text-sm text-fg-muted" aria-live="polite">
            {description}
          </p>
        )}
      </div>
      {actions !== undefined && (
        <div className="flex items-center gap-2 max-sm:w-full max-sm:*:flex-1">{actions}</div>
      )}
    </div>
  );
}
