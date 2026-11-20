import type { KitFacts } from './kit-facts';

/**
 * A lead sentence beside the kit in numbers. Every figure is read from the packages at build time,
 * so the row cannot drift from what ships.
 */
export function StatRow({ kit }: { kit: KitFacts }) {
  const stats: { value: string; unit?: string; label: string; note: string }[] = [
    { value: String(kit.components), label: 'components', note: 'With both themes, MIT licensed' },
    {
      value: String(kit.blocks),
      label: 'blocks',
      note: 'Finance, SaaS, marketing and docs, installed as source',
    },
    { value: String(kit.templates), label: 'templates', note: 'Whole apps, live on this site' },
    { value: String(kit.tokens), label: 'tokens per theme mode', note: 'Every value a theme sets' },
    {
      value: kit.motionKb,
      unit: 'kB',
      label: 'motion add-on, gzip',
      note: 'Measured in the build',
    },
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
      <p className="site-reveal font-display text-2xl font-regular text-balance text-fg md:text-3xl lg:col-span-5">
        Built for the screens where a wrong sign costs money:{' '}
        <span className="font-heading">expense reports, invoices, ledgers and approvals.</span>
      </p>
      {/* Set like a statement: a ruled line per figure, the label on the left, the amount right. */}
      <dl className="flex flex-col border-y border-line-strong lg:col-span-7">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`site-reveal ${i === 0 ? '' : `site-step-${String(Math.min(i, 3))}`} flex items-baseline justify-between gap-6 border-b border-line py-4 last:border-b-0`}
          >
            <div className="flex min-w-0 flex-col">
              <dt className="text-base font-strong text-fg">{stat.label}</dt>
              <dd className="text-sm text-fg-muted">{stat.note}</dd>
            </div>
            <dd className="shrink-0 font-display text-3xl font-heading text-fg tabular-nums md:text-4xl">
              {stat.value}
              {stat.unit !== undefined && (
                <span className="ms-1 text-lg font-strong text-fg-muted md:text-xl">
                  {stat.unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
