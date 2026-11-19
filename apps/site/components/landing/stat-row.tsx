import type { KitFacts } from './kit-facts';

/**
 * A lead sentence beside the kit in numbers. Every figure is read from the packages at build time,
 * so the row cannot drift from what ships.
 */
export function StatRow({ kit }: { kit: KitFacts }) {
  const stats: { value: string; unit?: string; label: string; note: string }[] = [
    { value: String(kit.components), label: 'components', note: 'Free, with both themes' },
    { value: String(kit.blocks), label: 'finance blocks', note: 'Pro, installed as source' },
    { value: String(kit.tokens), label: 'tokens per theme mode', note: 'Every value a theme sets' },
    {
      value: kit.motionKb,
      unit: 'kB',
      label: 'motion add-on, gzip',
      note: 'Measured in the build',
    },
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
      <p className="site-reveal font-display text-2xl font-regular text-pretty text-fg md:text-3xl lg:col-span-5">
        Built for the screens where a wrong sign costs money:{' '}
        <span className="font-heading">expense reports, invoices, ledgers and approvals.</span>
      </p>
      <dl className="grid grid-cols-2 border-t border-line-strong lg:col-span-7 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`site-reveal ${i === 0 ? '' : `site-step-${String(Math.min(i, 3))}`} flex flex-col gap-1 border-b border-line py-5 pe-4 lg:border-b-0`}
          >
            <dd className="font-display text-4xl font-heading text-fg tabular-nums md:text-5xl">
              {stat.value}
              {stat.unit !== undefined && (
                <span className="ms-1 text-xl font-strong text-fg-muted md:text-2xl">
                  {stat.unit}
                </span>
              )}
            </dd>
            <dt className="text-sm font-strong text-fg">{stat.label}</dt>
            <dd className="text-sm text-fg-muted">{stat.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
