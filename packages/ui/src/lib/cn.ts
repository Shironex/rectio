import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge taught the token utilities, so a consumer's `rounded-panel` replaces a component's
 * `rounded-control` and `duration-slow` replaces `duration-fast` instead of both landing.
 */
/** The backdrop filter parts Tailwind composes into one `backdrop-filter`. */
const BACKDROP_PARTS = [
  'blur',
  'brightness',
  'contrast',
  'grayscale',
  'hue-rotate',
  'invert',
  'opacity',
  'saturate',
  'sepia',
] as const;

const merge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['control', 'panel', 'badge'],
      shadow: ['raised', 'overlay', 'indicator', 'panel'],
      ease: ['standard', 'enter', 'exit'],
      tracking: ['tight', 'normal', 'caps'],
      'font-weight': ['regular', 'medium', 'strong', 'heading'],
      font: ['sans', 'display', 'mono', 'numeric'],
    },
    classGroups: {
      duration: [{ duration: ['fast', 'base', 'slow'] }],
      // The skin hooks: a consumer's background image or backdrop filter replaces them, so it wins in
      // a theme too, where they paint nothing and filter nothing.
      'bg-image': ['canvas-wash'],
      'backdrop-filter': ['backdrop-surface'],
    },
    conflictingClassGroups: Object.fromEntries(
      BACKDROP_PARTS.map((part) => [`backdrop-${part}`, ['backdrop-filter']]),
    ),
  },
});

/**
 * Hit area for a small pressable (icon buttons, small buttons, a checkbox, a short toggle) on touch
 * screens: a transparent box centred on the control, at least the touch height square, so a finger
 * lands on it while the drawn control keeps its size. Mouse and pen layouts are unchanged, and it
 * follows no density or skin: the touch height is fixed. The kit's one way to reach a touch target;
 * the control must be positioned (`relative` or `absolute`).
 *
 * Space neighbours so their areas never overlap: `pointer-coarse:gap-touch-gap` between small
 * controls (the touch height less the small control height, so it holds at compact density and in
 * the dense skin, where a fixed gap falls short).
 */
export const touchHitArea = cn(
  'pointer-coarse:after:absolute pointer-coarse:after:inset-auto pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2',
  'pointer-coarse:after:size-full pointer-coarse:after:-translate-1/2',
  'pointer-coarse:after:min-h-(--rx-button-height-touch) pointer-coarse:after:min-w-(--rx-button-height-touch)',
);

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
