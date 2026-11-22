import type { ReactNode } from 'react';

/** One group of specimens: a heading, then labelled rows. */
export function Section({
  title,
  note,
  children,
}: {
  title: string;
  /** One line of usage guidance: when to reach for which variant. */
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-medium tracking-caps text-fg-subtle uppercase">{title}</h3>
        {note !== undefined && <p className="max-w-prose text-sm text-fg-muted">{note}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** A labelled row of specimens. The label names the state shown, so screenshots read alone. */
export function Row({
  label,
  children,
  center = false,
}: {
  label: string;
  children: ReactNode;
  /** Centre specimens of different heights, such as button sizes. */
  center?: boolean;
}) {
  return (
    <div className="grid items-start gap-2 sm:grid-cols-6 sm:gap-4">
      <span className="text-sm text-fg-muted sm:col-span-1 sm:pt-2">{label}</span>
      <div
        className={`flex flex-wrap gap-3 pointer-coarse:gap-touch-gap sm:col-span-5 ${center ? 'items-center' : 'items-start'}`}
      >
        {children}
      </div>
    </div>
  );
}
