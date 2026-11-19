import { describe, expect, it } from 'vitest';

import {
  motionTokensFrom,
  parseBezier,
  parseDuration,
  parseLength,
  parseNumber,
} from '../src/lib/tokens';

const COMPLETE: Record<string, string> = {
  '--rx-motion-duration-fast': '120ms',
  '--rx-motion-duration-base': '180ms',
  '--rx-motion-duration-slow': '280ms',
  '--rx-motion-duration-count': '640ms',
  '--rx-motion-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  '--rx-motion-easing-enter': 'cubic-bezier(0, 0, 0.2, 1)',
  '--rx-motion-easing-exit': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--rx-motion-easing-settle': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--rx-motion-distance-shift': '0.25rem',
  '--rx-motion-distance-tick': '0.125rem',
  '--rx-motion-scale-from': '0.98',
  '--rx-motion-scale-press': '0.97',
  '--rx-motion-scale-dialog': '0.96',
  '--rx-motion-spring-press-stiffness': '720',
  '--rx-motion-spring-press-damping': '52',
  '--rx-motion-spring-press-mass': '1',
  '--rx-motion-spring-overlay-stiffness': '420',
  '--rx-motion-spring-overlay-damping': '41',
  '--rx-motion-spring-overlay-mass': '1',
};

describe('token parsers', () => {
  it('reads durations in ms and s as seconds', () => {
    expect(parseDuration('180ms')).toBe(0.18);
    expect(parseDuration(' 0.3s ')).toBe(0.3);
    expect(parseDuration('fast')).toBeNull();
    expect(parseDuration('')).toBeNull();
  });

  it('reads cubic-bezier easings and rejects anything else', () => {
    expect(parseBezier('cubic-bezier(0.2, 0, 0, 1)')).toEqual([0.2, 0, 0, 1]);
    expect(parseBezier('ease-out')).toBeNull();
    expect(parseBezier('cubic-bezier(0.2, 0, 1)')).toBeNull();
  });

  it('reads numbers and lengths', () => {
    expect(parseNumber(' 420 ')).toBe(420);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('stiff')).toBeNull();
    expect(parseLength('0.25rem')).toBe('0.25rem');
    expect(parseLength('0px')).toBe('0px');
    expect(parseLength('calc(1px + 1rem)')).toBeNull();
  });
});

describe('motionTokensFrom', () => {
  it('builds the whole set in Motion units', () => {
    const tokens = motionTokensFrom((name) => COMPLETE[name] ?? '');
    expect(tokens?.duration).toEqual({ fast: 0.12, base: 0.18, slow: 0.28, count: 0.64 });
    expect(tokens?.spring.overlay).toEqual({ stiffness: 420, damping: 41, mass: 1 });
    expect(tokens?.distance.tick).toBe('0.125rem');
  });

  it('gives no tokens, so no motion, when any one is missing', () => {
    for (const missing of Object.keys(COMPLETE)) {
      const tokens = motionTokensFrom((name) => (name === missing ? '' : (COMPLETE[name] ?? '')));
      expect(tokens, missing).toBeNull();
    }
  });
});
