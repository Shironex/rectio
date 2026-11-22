import { ThemeScope } from '@rectio/ui';

import { MODES, THEMES } from '../themes';
import { Gallery } from './gallery';

/** The theme in both modes, side by side, so a token change can be judged everywhere at once. */
export function Matrix() {
  return (
    <ThemeScope theme="default" mode="light" className="min-h-dvh">
      <header className="flex flex-wrap items-baseline justify-between gap-4 px-4 pt-8 pb-6 sm:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-heading tracking-tight">rectio</h1>
          <p className="text-sm text-fg-muted">Every component and state, in each mode.</p>
        </div>
      </header>
      <div className="grid xl:grid-cols-2">
        {THEMES.flatMap((theme) =>
          MODES.map((mode) => (
            <ThemeScope
              key={`${theme.id}-${mode}`}
              theme={theme.id}
              mode={mode}
              data-panel={`${theme.id}-${mode}`}
              className="flex flex-col gap-6 p-4 sm:p-8"
            >
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-xl font-heading tracking-tight">{theme.name}</h2>
                <span className="text-sm text-fg-muted">
                  {theme.note}, {mode}
                </span>
                {/* Each panel links to the composition in its own theme, in that theme's accent. */}
                <a
                  href={`?view=app&theme=${theme.id}&mode=${mode}`}
                  className="ms-auto inline-flex items-center text-sm text-accent-strong underline pointer-coarse:min-h-(--rx-control-height-touch) decoration-line-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Expense report
                </a>
              </div>
              <Gallery />
            </ThemeScope>
          )),
        )}
      </div>
    </ThemeScope>
  );
}
