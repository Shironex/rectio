import { describe, expect, it } from 'vitest';

import { isExternalHref, isHashHref } from './href';

describe('isExternalHref', () => {
  it('keeps paths inside the app', () => {
    for (const href of ['/', '/docs', 'docs/intro', '?tab=2', '#top', './next', '../up']) {
      expect(isExternalHref(href), href).toBe(false);
    }
  });

  it('sends schemes and hosts out of the app', () => {
    for (const href of ['https://example.com', 'mailto:a@b.c', 'tel:+1', '//cdn.example/x.js']) {
      expect(isExternalHref(href), href).toBe(true);
    }
  });

  it('reads the address as a browser does: trimmed, without tabs or line breaks', () => {
    for (const href of [
      ' https://example.com',
      '  //evil.example',
      '/\t/evil.example',
      '\n//evil',
    ]) {
      expect(isExternalHref(href), JSON.stringify(href)).toBe(true);
    }
  });

  it('treats backslashes as the slashes browsers read them as', () => {
    for (const href of ['\\\\evil.example', '/\\evil.example', '\\/evil.example', '\\evil']) {
      expect(isExternalHref(href), href).toBe(true);
    }
  });
});

describe('isHashHref', () => {
  it('knows an in-page address, even with spaces around it', () => {
    expect(isHashHref('#pricing')).toBe(true);
    expect(isHashHref(' #pricing ')).toBe(true);
    expect(isHashHref('/#pricing')).toBe(false);
  });
});
