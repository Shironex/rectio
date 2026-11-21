import Link from 'next/link';

import { Wordmark } from '@/components/wordmark';
import { repoUrl } from '@/lib/site';

const LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/components/button', label: 'Components' },
  { href: '/templates', label: 'Templates' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/docs/cli', label: 'CLI' },
  { href: '/docs/mcp', label: 'MCP' },
  { href: repoUrl, label: 'GitHub' },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1">
          <Wordmark />
          <p className="text-sm text-fg-muted">Made by noctcore. Free and MIT licensed.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 min-w-6 items-center text-sm text-fg-muted pointer-fine:hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:min-h-6"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
