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
    (['app', 'motion', 'blocks', 'display', 'marketing', 'forms', 'shell', 'nav'] as const).find(
      (v) => v === params.get('view'),
    ) ?? 'matrix';
  const motion = params.get('motion') === 'on';
  return { theme, mode, view, motion } as const;
}
