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

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
