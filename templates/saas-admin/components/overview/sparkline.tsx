import { cn } from '@rectio/ui';

/**
 * A trend line for a stat tile: the values scaled into a small box, last point marked. Decorative,
 * so the tile says the change in words beside it.
 */
export function Sparkline({
  values,
  favourable,
  className,
}: {
  values: readonly number[];
  /** Colours the line by whether the move is good news. */
  favourable: boolean;
  className?: string;
}) {
  const width = 72;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => [i * step, height - 3 - ((v - min) / span) * (height - 6)]);
  const last = points.at(-1);
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      className={cn(
        'h-7 w-18 overflow-visible',
        favourable ? 'text-positive' : 'text-negative',
        className,
      )}
      aria-hidden
    >
      <polyline
        points={points.map(([x, y]) => `${String(x)},${String(y)}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {last !== undefined && <circle cx={last[0]} cy={last[1]} r={2.5} fill="currentColor" />}
    </svg>
  );
}
