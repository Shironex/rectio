import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge taught the token utilities, so a consumer's `rounded-panel` replaces a component's
 * `rounded-control` and `duration-slow` replaces `duration-fast` instead of both landing.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['control', 'panel', 'badge'],
      shadow: ['raised', 'overlay'],
      ease: ['standard', 'enter', 'exit'],
      tracking: ['tight', 'normal', 'caps'],
      'font-weight': ['regular', 'medium', 'strong', 'heading'],
      font: ['sans', 'display', 'mono', 'numeric'],
    },
    classGroups: {
      duration: [{ duration: ['fast', 'base', 'slow'] }],
    },
  },
});

/**
 * Hit area for a small pressable (icon buttons, small buttons, a checkbox) on touch screens: a
 * transparent box centred on the control, at least the touch height square, so a finger lands on it
 * while the drawn control keeps its size. Mouse and pen layouts are unchanged. The control must be
 * positioned (`relative` or `absolute`). Space neighbours so their areas never overlap: under
 * `pointer-coarse`, a gap of at least 12px (`gap-3`) between small controls, 16px (`gap-4`) for the
 * 28px toast buttons.
 */
export const touchHitArea = cn(
  'pointer-coarse:after:absolute pointer-coarse:after:inset-auto pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2',
  'pointer-coarse:after:size-full pointer-coarse:after:-translate-1/2',
  'pointer-coarse:after:min-h-(--rx-button-height-touch) pointer-coarse:after:min-w-(--rx-button-height-touch)',
);

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
