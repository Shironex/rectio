import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';

const QUESTIONS = [
  {
    q: 'Is this another restyled component kit?',
    a: 'No. rectio is its own library on Base UI primitives, with its own registry and CLI. It installs as source you own, and components are styled only through design tokens, so a theme restyles everything without a fork.',
  },
  {
    q: 'What does the free tier include?',
    a: 'Every component in these docs, the default and ledger themes, the rectio CLI, the registry and the MCP server. Pro adds the motion add-on, theme packs and the Pro finance blocks as they ship.',
  },
  {
    q: 'Which stacks does it support?',
    a: 'React 19 with Tailwind CSS v4. rectio init detects TanStack Start, Next.js and Vite, finds your CSS entry and import alias, and stops with the exact fix when something is missing, such as Tailwind v3.',
  },
  {
    q: 'What happens with reduced motion?',
    a: 'Every motioned component collapses to its plain twin when the system asks for reduced motion, when the app turns motion off, or when the browser cannot run it. Content still fades where a fade helps; nothing moves across the screen.',
  },
  {
    q: 'How do updates reach code I have edited?',
    a: 'rectio records what it wrote in rectio.lock.json. rectio diff shows the patch from your file to the latest version and marks your edits. rectio update reports what is newer today; the three-way merge is planned.',
  },
  {
    q: 'Can my coding agent use rectio?',
    a: 'Yes. rectio mcp runs a read-only MCP server with tools to list, search and read items, tokens and docs, and to get the exact add command. It works with Claude Code, Cursor and VS Code.',
  },
] as const;

/** Short answers in native disclosure widgets: keyboard and screen reader support for free. */
export function Faq() {
  return (
    <div className="flex flex-col border-t border-line">
      {QUESTIONS.map(({ q, a }, i) => (
        <details key={q} open={i === 0} className="group site-reveal border-b border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-baseline gap-4 py-4 text-lg font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:gap-6 [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="w-6 shrink-0 font-mono text-sm text-fg-muted tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex-1">{q}</span>
            <CaretDownIcon
              aria-hidden
              weight="bold"
              className="size-4 shrink-0 text-fg-muted transition-transform duration-base ease-enter group-open:rotate-180"
            />
          </summary>
          <p className="max-w-3xl ps-10 pb-6 text-base text-pretty text-fg-muted md:ps-12">{a}</p>
        </details>
      ))}
    </div>
  );
}
