const PRINCIPLES = [
  {
    title: 'Numbers first',
    body: 'Tabular, lining figures everywhere. A true minus sign. The currency always printed.',
  },
  {
    title: 'Never colour alone',
    body: 'Signs, icons and words carry meaning. Colour reinforces it for those who see it.',
  },
  {
    title: 'Keyboard complete',
    body: 'Every control reachable and operable without a pointer, with one focus ring everywhere.',
  },
  {
    title: 'Tokens only',
    body: 'No component hardcodes a colour, corner, typeface, elevation or timing. The lint checks it.',
  },
] as const;

const STEPS = ['', 'site-step-1', 'site-step-2', 'site-step-3'];

/** The four rules every component keeps, in a single row on wide screens. */
export function Principles() {
  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {PRINCIPLES.map((p, i) => (
        <li
          key={p.title}
          className={`site-reveal ${STEPS[i] ?? ''} flex flex-col gap-2 border-t-2 border-fg pt-5`}
        >
          <h3 className="font-display text-xl font-heading tracking-tight text-fg">{p.title}</h3>
          <p className="text-base text-pretty text-fg-muted">{p.body}</p>
        </li>
      ))}
    </ul>
  );
}
