import { describe, expect, it } from 'vitest';

import {
  COOKIE_POLICY_TEMPLATE,
  LEGAL_TEMPLATE_NOTICE,
  PRIVACY_POLICY_TEMPLATE,
  TERMS_TEMPLATE,
  acceptAll,
  chooseConsent,
  formatStat,
  hasDecided,
  initialChoices,
  isAllowed,
  isEmail,
  loadConsent,
  readingMinutes,
  rejectAll,
  saveConsent,
  slugify,
  tableOfContents,
  validateContact,
  EMPTY_CONTACT,
  type CookieCategory,
} from '../src/marketing';

const CATEGORIES: CookieCategory[] = [
  { id: 'necessary', title: 'Necessary', description: 'Needed.', required: true },
  { id: 'analytics', title: 'Analytics', description: 'Counts.' },
  { id: 'marketing', title: 'Marketing', description: 'Ads.' },
];
const NOW = new Date('2026-03-19T10:00:00Z');

describe('cookie consent', () => {
  it('accepts and rejects with one call each, keeping required categories on', () => {
    expect(acceptAll(CATEGORIES, 'v1', NOW).choices).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
    });
    expect(rejectAll(CATEGORIES, 'v1', NOW).choices).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  });

  it('saves only what the visitor chose, and never turns a required category off', () => {
    const record = chooseConsent(CATEGORIES, { analytics: true, necessary: false }, 'v1', NOW);
    expect(record).toEqual({
      version: 'v1',
      decidedAt: '2026-03-19T10:00:00.000Z',
      choices: { necessary: true, analytics: true, marketing: false },
    });
  });

  it('starts the switches from the saved decision, or required only', () => {
    expect(initialChoices(CATEGORIES, null)).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    const saved = acceptAll(CATEGORIES, 'v1', NOW);
    expect(initialChoices(CATEGORIES, saved).marketing).toBe(true);
  });

  it('asks again when the category list changes version', () => {
    const saved = acceptAll(CATEGORIES, 'v1', NOW);
    expect(hasDecided(saved, 'v1')).toBe(true);
    expect(hasDecided(saved, 'v2')).toBe(false);
    expect(isAllowed(saved, 'analytics', 'v1')).toBe(true);
    expect(isAllowed(saved, 'analytics', 'v2')).toBe(false);
    expect(isAllowed(null, 'necessary', 'v1')).toBe(false);
  });

  it('round-trips through storage and survives bad or blocked storage', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    const record = rejectAll(CATEGORIES, 'v1', NOW);
    expect(saveConsent(storage, 'consent', record)).toBe(true);
    expect(loadConsent(storage, 'consent')).toEqual(record);

    store.set('broken', '{not json');
    expect(loadConsent(storage, 'broken')).toBeNull();
    store.set('wrong', JSON.stringify({ version: 1, choices: {} }));
    expect(loadConsent(storage, 'wrong')).toBeNull();
    expect(loadConsent(storage, 'missing')).toBeNull();

    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(loadConsent(blocked, 'consent')).toBeNull();
    expect(saveConsent(blocked, 'consent', record)).toBe(false);
  });
});

describe('contact validation', () => {
  it('names every missing field in words', () => {
    const errors = validateContact(EMPTY_CONTACT, { needsTopic: true, needsConsent: true });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'message', 'name', 'topic']);
  });

  it('accepts a complete message and rejects a malformed address', () => {
    const values = {
      ...EMPTY_CONTACT,
      name: 'Ingrid',
      email: 'ingrid@halden.example',
      message: 'We would like a demo for three entities.',
    };
    expect(validateContact(values, { needsTopic: false, needsConsent: false })).toEqual({});
    expect(
      validateContact({ ...values, email: 'ingrid@' }, { needsTopic: false, needsConsent: false })
        .email,
    ).toMatch(/such as/);
  });
});

describe('stats', () => {
  it('formats each kind with its suffix', () => {
    expect(
      formatStat({ id: 'a', value: 1240, format: 'number', label: '', suffix: '+' }, 1240, 'en-GB'),
    ).toBe('1,240+');
    expect(
      formatStat({ id: 'b', value: 0, format: 'compact', label: '' }, 14_200_000, 'en-GB'),
    ).toMatch(/^14\.2m$/i);
    expect(
      formatStat(
        { id: 'c', value: 0, format: 'percent', label: '', fractionDigits: 2 },
        0.9995,
        'en-GB',
      ),
    ).toBe('99.95%');
    expect(
      formatStat(
        { id: 'd', value: 0, format: 'currency', label: '', currency: 'EUR' },
        2_500_000,
        'en-GB',
      ),
    ).toMatch(/^€2\.5m$/i);
  });
});

describe('legal templates', () => {
  it('builds unique anchors, even for repeated titles', () => {
    expect(tableOfContents(['Your rights', 'Your rights', '!!!']).map((entry) => entry.id)).toEqual(
      ['your-rights', 'your-rights-2', 'section'],
    );
  });

  it('marks every template as a template that is not legal advice', () => {
    expect(LEGAL_TEMPLATE_NOTICE).toContain('This is not legal advice.');
    for (const template of [PRIVACY_POLICY_TEMPLATE, TERMS_TEMPLATE, COOKIE_POLICY_TEMPLATE]) {
      expect(template.sections.length).toBeGreaterThan(3);
      expect(JSON.stringify(template)).toContain('[');
    }
  });
});

describe('helpers', () => {
  it('checks email shape, slugs and reading time', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(slugify('Who we share it with?')).toBe('who-we-share-it-with');
    expect(readingMinutes('word '.repeat(460))).toBe(2);
    expect(readingMinutes('')).toBe(1);
  });
});
