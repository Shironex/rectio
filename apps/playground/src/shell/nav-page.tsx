import { ThemeScope } from '@rectio/ui';

import { NavigationGallery } from '../gallery/navigation';
import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';

/** The navigation and overlay components in one theme and mode, for shots and open states. */
export function NavPage({ theme, mode, motion }: { theme: ThemeId; mode: Mode; motion: boolean }) {
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-heading tracking-tight">
            Navigation and overlays
          </h1>
          <p className="text-sm text-fg-muted">
            {motion ? 'With the motion add-on.' : 'Plain components.'}{' '}
            <a
              href={`?view=shell&theme=${theme}&mode=${mode}`}
              className="text-accent-strong underline decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              App shell
            </a>
          </p>
        </header>
        <NavigationGallery motion={motion} />
      </main>
    </ThemeScope>
  );
}
