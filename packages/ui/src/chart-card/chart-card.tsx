import { useId, type ComponentProps, type ReactNode } from 'react';

import { Card, CardFooter, type CardVariant } from '../card/card';
import { cn } from '../lib/cn';
import { Skeleton } from '../skeleton/skeleton';

export interface ChartCardProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** What the chart measures: `Revenue`. Names the card's region. */
  title: ReactNode;
  /** The period or scope, under the title: `Last 90 days`. */
  description?: ReactNode;
  /** The headline figure, formatted: `€48,210`. Rendered in tabular figures. */
  value?: ReactNode;
  /** How the figure moved, usually a TrendChip. */
  delta?: ReactNode;
  /** Controls on the title's row: a range switch, a menu. */
  actions?: ReactNode;
  /** Meta or a link at the end, above a hairline. */
  footer?: ReactNode;
  /** Shows a placeholder in place of the figure while it loads; the chart shows its own. */
  loading?: boolean | undefined;
  /** The title's heading level, to fit the page outline. */
  headingLevel?: 2 | 3 | 4 | undefined;
  variant?: CardVariant | undefined;
  /** The chart, or any content under the figure. */
  children?: ReactNode;
}

/**
 * A chart with its title, headline figure and change: the frame of a dashboard tile. The figure
 * is read first, the chart shows how it got there. A region named by its title, so a page of
 * tiles is a list of landmarks a screen reader can jump between.
 */
export function ChartCard({
  title,
  description,
  value,
  delta,
  actions,
  footer,
  loading = false,
  headingLevel = 3,
  variant = 'outline',
  className,
  children,
  ...props
}: ChartCardProps) {
  const titleId = useId();
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
      variant={variant}
      data-slot="chart-card"
      className={cn('flex min-w-0 flex-col', className)}
      {...props}
    >
      <div className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-5">
        <header className="flex items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Heading id={titleId} className="text-sm font-strong text-fg">
              {title}
            </Heading>
            {description !== undefined && <p className="text-xs text-fg-subtle">{description}</p>}
          </div>
          {actions !== undefined && (
            <div className="-me-1 -mt-1 flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
        {(value !== undefined || delta !== undefined || loading) && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                {value !== undefined && (
                  <span className="text-3xl font-strong tracking-tight text-fg numeric">
                    {value}
                  </span>
                )}
                {delta}
              </>
            )}
          </div>
        )}
        {children}
      </div>
      {footer !== undefined && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
