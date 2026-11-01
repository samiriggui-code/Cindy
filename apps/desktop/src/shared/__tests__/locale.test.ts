import { describe, expect, it } from 'vitest';

import { resolvePreferredSystemLocale, resolveSystemLocale } from '../locale';

describe('desktop locale resolution', () => {
  it('maps French and English system tags', () => {
    expect(resolveSystemLocale('fr-FR')).toBe('fr');
    expect(resolveSystemLocale('en-US')).toBe('en');
    expect(resolveSystemLocale('en-GB')).toBe('en');
  });

  it('falls back to the default locale for unsupported system languages', () => {
    expect(resolveSystemLocale('ja-JP')).toBe('fr');
    expect(resolveSystemLocale('zh-CN')).toBe('fr');
  });

  it('uses the first supported locale in the OS preference list', () => {
    expect(resolvePreferredSystemLocale(['fr-FR', 'en-US'])).toBe('fr');
    expect(resolvePreferredSystemLocale(['en-US', 'fr-FR'])).toBe('en');
    expect(resolvePreferredSystemLocale(['ja-JP'])).toBe('fr');
  });
});
