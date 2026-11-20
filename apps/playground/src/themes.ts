export const THEMES = [
  { id: 'default', name: 'Default', note: 'Calm back-office' },
  { id: 'ledger', name: 'Ledger', note: 'Editorial finance' },
] as const;

export const MODES = ['light', 'dark'] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type Mode = (typeof MODES)[number];

export function readView(search: string) {
  const params = new URLSearchParams(search);
  const theme = THEMES.find((t) => t.id === params.get('theme'))?.id ?? 'default';
  const mode = MODES.find((m) => m === params.get('mode')) ?? 'light';
  const view =
    (
      [
        'app',
        'motion',
        'blocks',
        'display',
        'marketing',
        'docs',
        'forms',
        'shell',
        'nav',
        'gaps',
      ] as const
    ).find((v) => v === params.get('view')) ?? 'matrix';
  const motion = params.get('motion') === 'on';
  return { theme, mode, view, motion } as const;
}

/**
 * Dark proposals from @rectio/tokens/proposals.css, opt in with `?dark=<name>`: the default
 * theme's dark mode switches to the proposal. Without the parameter nothing changes.
 */
export const DARK_PROPOSALS = ['graphite', 'ink', 'onyx'] as const;

export function readDarkProposal(search: string) {
  const name = new URLSearchParams(search).get('dark');
  return DARK_PROPOSALS.find((p) => p === name);
}
