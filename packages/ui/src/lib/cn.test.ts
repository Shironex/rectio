import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('lets a later token utility replace an earlier one of the same group', () => {
    expect(cn('rounded-control', 'rounded-panel')).toBe('rounded-panel');
    expect(cn('duration-fast', 'duration-slow')).toBe('duration-slow');
    expect(cn('shadow-raised', 'shadow-overlay')).toBe('shadow-overlay');
    expect(cn('shadow-raised', 'shadow-indicator')).toBe('shadow-indicator');
    expect(cn('font-medium', 'font-strong')).toBe('font-strong');
  });

  it('keeps utilities of different groups', () => {
    expect(cn('text-sm', 'text-fg-muted')).toBe('text-sm text-fg-muted');
    expect(cn('bg-surface', false, undefined, 'px-4')).toBe('bg-surface px-4');
  });
});
