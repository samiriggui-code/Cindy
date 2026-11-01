import { describe, expect, it } from 'vitest';

import en from '../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';

describe('desktop model-picker compact translations', () => {
  it('uses Sub for the English subscription badge', () => {
    expect(en.newChat.modelSelector.meta.subscriptionBadgeCompact).toBe('Sub');
  });

  it('keeps the French subscription badge short enough for a narrow model row', () => {
    expect(Array.from(fr.newChat.modelSelector.meta.subscriptionBadgeCompact).length).toBeLessThanOrEqual(4);
  });
});
