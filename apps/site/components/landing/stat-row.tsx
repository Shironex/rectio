import type { KitFacts } from './kit-facts';

/**
 * A lead sentence beside the kit in numbers. Every figure is read from the packages at build time,
 * so the row cannot drift from what ships.
 */
export function StatRow({ kit }: { kit: KitFacts }) {
  const stats: { value: string; label: string; note: string }[] = [
    {
      value: String(kit.components),
      label: 'components',
      note: 'Each in light and dark',
    },
    {
      value: String(kit.blocks),
      label: 'blocks',
      note: 'Finance, SaaS, marketing and docs, installed as source',
    },
    { value: String(kit.templates), label: 'templates', note: 'Whole apps, live on this site' },
    { value: String(kit.tokens), label: 'tokens per theme mode', note: 'Every value a theme sets' },
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
            className={`site-reveal ${i === 0 ? '' : `site-step-${String(Math.min(i, 3))}`} grid grid-flow-col grid-rows-2 items-center justify-between gap-x-6 border-b border-line py-4 last:border-b-0`}
          >
            {/* dt and both dd sit straight in the row, as a definition list wants; the grid sets them. */}
            <dt className="text-base font-strong text-fg">{stat.label}</dt>
            <dd className="text-sm text-fg-muted">{stat.note}</dd>
            <dd className="row-span-2 font-display text-3xl font-heading text-fg tabular-nums md:text-4xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
