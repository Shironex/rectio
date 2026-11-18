import { describe, expect, it } from 'vitest';

import { cssVarName, tailwindColorName } from '../scripts/naming.ts';
import { cssValue } from '../scripts/values.ts';

describe('cssVarName', () => {
  it('drops the component group and a trailing default', () => {
    expect(cssVarName(['component', 'button', 'height', 'md'])).toBe('--rx-button-height-md');
    expect(cssVarName(['surface', 'default'])).toBe('--rx-surface');
    expect(cssVarName(['text', 'muted'])).toBe('--rx-text-muted');
  });
});

describe('tailwindColorName', () => {
  it('renames text to fg and border to line', () => {
    expect(tailwindColorName(['text', 'muted'])).toBe('fg-muted');
    expect(tailwindColorName(['border'])).toBe('line');
    expect(tailwindColorName(['accent', 'hover'])).toBe('accent-hover');
  });
});

describe('cssValue', () => {
  it('writes DTCG 2025.10 value objects as CSS', () => {
    expect(
      cssValue({ colorSpace: 'oklch', components: [0.53, 0.19, 263], alpha: 1 }, 'color'),
    ).toBe('oklch(53% 0.19 263)');
    expect(
      cssValue({ colorSpace: 'oklch', components: [0.21, 0.01, 75], alpha: 0.32 }, 'color'),
    ).toBe('oklch(21% 0.01 75 / 0.32)');
    expect(cssValue({ value: 0.375, unit: 'rem' }, 'dimension')).toBe('0.375rem');
    expect(cssValue({ value: 180, unit: 'ms' }, 'duration')).toBe('180ms');
    expect(cssValue([0.2, 0, 0, 1], 'cubicBezier')).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(cssValue(['IBM Plex Sans', 'system-ui'], 'fontFamily')).toBe(
      '"IBM Plex Sans", system-ui',
    );
  });

  it('refuses a colour space the pipeline does not handle', () => {
    expect(() => cssValue({ colorSpace: 'srgb', components: [1, 0, 0] }, 'color')).toThrow(Error);
  });
});
