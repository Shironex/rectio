import type { ReactNode } from 'react';

/** One group of specimens: a heading, then labelled rows. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5">
      <h3 className="text-xs font-medium tracking-caps text-fg-subtle uppercase">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** A labelled row of specimens. The label names the state shown, so screenshots read alone. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid items-start gap-2 sm:grid-cols-6 sm:gap-4">
      <span className="text-sm text-fg-muted sm:col-span-1 sm:pt-2">{label}</span>
      <div className="flex flex-wrap items-start gap-3 sm:col-span-5">{children}</div>
    </div>
  );
}
