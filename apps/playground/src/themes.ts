export interface PlaygroundTheme {
  id: string;
  name: string;
  note: string;
}

/** The themes the playground shows. The kit ships one; a theme in progress can be added here. */
export const THEMES: readonly PlaygroundTheme[] = [
  { id: 'default', name: 'Default', note: 'Calm back-office' },
];

export const MODES = ['light', 'dark'] as const;

/** The skins @rectio/tokens ships, picked by `&skin=`. Unset is the theme as it is. */
export const SKINS = ['dense', 'editorial'] as const;
export type Skin = (typeof SKINS)[number];

/** The skin in the URL, or undefined for none. */
export function readSkin(search: string): Skin | undefined {
  const asked = new URLSearchParams(search).get('skin');
  return SKINS.find((s) => s === asked);
}

export type ThemeId = PlaygroundTheme['id'];
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
        'primitives',
      ] as const
    ).find((v) => v === params.get('view')) ?? 'matrix';
  const motion = params.get('motion') === 'on';
  return { theme, mode, view, motion } as const;
}
