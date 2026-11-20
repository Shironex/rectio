import { GithubLogoIcon } from '@phosphor-icons/react/dist/ssr';

import { repoUrl } from '@/lib/site';

/** The secondary action beside "Read the docs": the source on GitHub. */
export function GithubButton() {
  return (
    <a
      href={repoUrl}
      className="site-press inline-flex h-11 items-center gap-2 rounded-control border border-line-strong px-5 text-base font-medium text-fg transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <GithubLogoIcon aria-hidden weight="bold" className="size-4" />
      View on GitHub
    </a>
  );
}
