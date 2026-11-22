import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('lets a later token utility replace an earlier one of the same group', () => {
    expect(cn('rounded-control', 'rounded-panel')).toBe('rounded-panel');
    expect(cn('duration-fast', 'duration-slow')).toBe('duration-slow');
    expect(cn('shadow-raised', 'shadow-overlay')).toBe('shadow-overlay');
    expect(cn('shadow-raised', 'shadow-indicator')).toBe('shadow-indicator');
    expect(cn('shadow-panel', 'shadow-raised')).toBe('shadow-raised');
    // A consumer's background image or backdrop filter replaces the skin hooks.
    expect(cn('canvas-wash', 'bg-[url(/a.png)]')).toBe('bg-[url(/a.png)]');
    expect(cn('canvas-wash', 'bg-linear-to-b')).toBe('bg-linear-to-b');
    expect(cn('canvas-wash', 'bg-none')).toBe('bg-none');
    expect(cn('backdrop-surface', 'backdrop-blur-[8px]')).toBe('backdrop-blur-[8px]');
    expect(cn('backdrop-surface', 'backdrop-saturate-150')).toBe('backdrop-saturate-150');
    expect(cn('backdrop-surface', 'backdrop-filter-none')).toBe('backdrop-filter-none');
    // A colour, or a translucency without blur, keeps them.
    expect(cn('canvas-wash', 'bg-surface')).toBe('canvas-wash bg-surface');
    expect(cn('backdrop-surface', 'translucent-surface')).toBe(
      'backdrop-surface translucent-surface',
    );
    expect(cn('font-medium', 'font-strong')).toBe('font-strong');
  });

  it('keeps utilities of different groups', () => {
    expect(cn('text-sm', 'text-fg-muted')).toBe('text-sm text-fg-muted');
    expect(cn('bg-surface', false, undefined, 'px-4')).toBe('bg-surface px-4');
  });
});
