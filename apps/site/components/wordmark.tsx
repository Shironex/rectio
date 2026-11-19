/** The rectio wordmark: the name set in the theme's display face, with a ruled underline. */
export function Wordmark() {
  return (
    <span className="inline-flex items-baseline gap-1.5 font-display text-lg font-heading tracking-tight text-fg">
      rectio
      <span aria-hidden className="block h-0.5 w-3 translate-y-0.5 bg-accent" />
    </span>
  );
}
