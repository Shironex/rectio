import { describe, expect, it } from 'vitest';

import {
  dayLabel,
  formatBytes,
  hasErrors,
  initials,
  isEmail,
  passwordAccepted,
  passwordChecks,
  passwordStrength,
  plural,
  relativeTime,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);

describe('saas core', () => {
  it('takes up to two initials', () => {
    expect(initials('Niamh Walsh')).toBe('NW');
    expect(initials('Kenji Hiro Arakawa')).toBe('KA');
    expect(initials('cher')).toBe('C');
    expect(initials('  ')).toBe('?');
  });

  it('checks email addresses loosely', () => {
    expect(isEmail('ines@fernhill.io')).toBe(true);
    expect(isEmail(' ines@fernhill.io ')).toBe(true);
    expect(isEmail('ines@fernhill')).toBe(false);
    expect(isEmail('ines fernhill.io')).toBe(false);
  });

  it('grades passwords by the rules they meet, with length as the gate', () => {
    expect(passwordStrength('')).toBe('empty');
    expect(passwordStrength('Short1!')).toBe('weak');
    expect(passwordStrength('longbutlowercase')).toBe('weak');
    expect(passwordStrength('longButMixedCase')).toBe('fair');
    expect(passwordStrength('longButMixedCase7')).toBe('good');
    expect(passwordStrength('longButMixedCase7!')).toBe('strong');
    expect(passwordAccepted('longButMixedCase7!')).toBe(true);
    expect(passwordChecks('abc').map((c) => c.met)).toEqual([false, false, false, false]);
  });

  it('says moments and days as people do', () => {
    expect(relativeTime(new Date(NOW.getTime() - 20_000), NOW, 'en-GB')).toBe('now');
    expect(relativeTime(new Date(NOW.getTime() - 5 * 60_000), NOW, 'en-GB')).toBe('5 minutes ago');
    expect(relativeTime(new Date(NOW.getTime() - 26 * 3_600_000), NOW, 'en-GB')).toBe('yesterday');
    expect(relativeTime(new Date(NOW.getTime() + 3 * 86_400_000), NOW, 'en-GB')).toBe('in 3 days');
    expect(dayLabel(NOW, NOW, 'en-GB')).toBe('Today');
    expect(dayLabel(new Date(2026, 2, 18, 9), NOW, 'en-GB')).toBe('Yesterday');
    expect(dayLabel(new Date(2026, 2, 12), NOW, 'en-GB')).toBe('Thursday 12 March');
  });

  it('formats sizes and counts', () => {
    expect(formatBytes(512, 'en-GB')).toBe('512 bytes');
    expect(formatBytes(1_400_000, 'en-GB')).toBe('1.4 MB');
    expect(formatBytes(24_300_000_000, 'en-GB')).toBe('24 GB');
    expect(plural(1, 'member')).toBe('1 member');
    expect(plural(3, 'member')).toBe('3 members');
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: undefined })).toBe(false);
    expect(hasErrors({ email: 'Enter your email address.' })).toBe(true);
  });
});
