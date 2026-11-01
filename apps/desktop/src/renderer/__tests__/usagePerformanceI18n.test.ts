import { describe, expect, it } from 'vitest';

import en from '../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';


describe('usage performance units', () => {
  it.each([
    ['en', en],
    ['fr', fr],
  ] as const)('keeps TPS in %s templates', (_locale, messages) => {
    const values = [
      messages.quotaCard.timeAndRateValue,
      messages.usageDetails.performanceLine,
      messages.usageDetails.performanceRateLine,
    ];
    for (const value of values) expect(value).toContain('TPS');
  });
});
