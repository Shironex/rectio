/**
 * The sample product's mark: three fronds drawn on a 24 unit grid in the accent, and the name in
 * the display face.
 */
export function Brand() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-heading tracking-tight">
      <svg aria-hidden viewBox="0 0 24 24" className="size-6 text-accent" fill="none">
        <path
          d="M12 21V4M12 9c-2.5-.5-4.5-2-5.5-4.5M12 9c2.5-.5 4.5-2 5.5-4.5M12 14.5c-3-.4-5.6-2.1-7-5M12 14.5c3-.4 5.6-2.1 7-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      Fernhill
    </span>
  );
}

const PROOF = [
  ['Close the month in days', 'Every approval, receipt and journal in one ledger.'],
  ['Know what is owed', 'Ageing, reminders and payment runs without a spreadsheet.'],
  ['Hand auditors a link', 'Each figure traces back to the document behind it.'],
] as const;

/** The brand panel beside the account forms: what the product does, and who says so. */
export function AuthAside() {
  return (
    <div className="flex h-full flex-col gap-10">
      <p className="font-display text-3xl font-heading tracking-tight text-balance">
        The finance workspace your auditors will thank you for.
      </p>
      <ol className="flex flex-col border-t border-line">
        {PROOF.map(([title, line], index) => (
          <li key={title} className="flex gap-4 border-b border-line py-4">
            <span className="numeric font-display text-sm text-fg-muted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{title}</span>
              <span className="text-sm text-pretty text-fg-muted">{line}</span>
            </span>
          </li>
        ))}
      </ol>
      <figure className="mt-auto flex flex-col gap-3 border-t border-line pt-6">
        <blockquote className="font-display text-xl font-heading tracking-tight text-pretty text-fg">
          “We closed March four days early, and nobody opened a spreadsheet.”
        </blockquote>
        <figcaption className="text-sm text-fg-muted">
          Greta Lindner, Controller at Nordwind Logistik
        </figcaption>
      </figure>
    </div>
  );
}
