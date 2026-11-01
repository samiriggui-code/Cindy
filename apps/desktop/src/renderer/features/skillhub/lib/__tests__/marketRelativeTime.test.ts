import { describe, expect, it } from 'vitest';

import { i18n } from '@/i18n';
import { formatMarketRelativeTime } from '../../hooks/useMarketList';
import enCommon from '@/i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';

const NOW = Date.parse('2026-06-11T12:00:00.000Z');

describe('market relative time i18n', () => {
  it('formats market card relative time through the active locale', async () => {
    const previousLanguage = i18n.language;
    try {
      await i18n.changeLanguage('fr');

      expect(formatMarketRelativeTime('2026-06-11T09:00:00.000Z', i18n.t, NOW)).toBe('il y a 3 heures');
      expect(formatMarketRelativeTime('2026-06-10T09:00:00.000Z', i18n.t, NOW)).toBe('hier');
      expect(formatMarketRelativeTime('2026-06-11T11:59:45.000Z', i18n.t, NOW)).toBe('juste maintenant');

      await i18n.changeLanguage('en');
      expect(formatMarketRelativeTime('2026-06-11T09:00:00.000Z', i18n.t, NOW)).toBe('3 hours ago');
      expect(formatMarketRelativeTime('2026-06-10T09:00:00.000Z', i18n.t, NOW)).toBe('yesterday');
      expect(formatMarketRelativeTime('2026-06-11T11:59:45.000Z', i18n.t, NOW)).toBe('just now');
    } finally {
      await i18n.changeLanguage(previousLanguage);
    }
  });

  it('keeps market card keys aligned across supported locales', () => {
    // French also carries the CLDR `_many` plural category, which English lacks.
    const withoutMany = (keys: string[]) => keys.filter((key) => !key.endsWith('_many')).sort();
    const referenceKeys = withoutMany(Object.keys(enCommon.skillhub.marketCard.relativeTime));
    for (const common of [enCommon, fr]) {
      const relativeTime = common.skillhub.marketCard.relativeTime as Record<string, string>;
      expect(withoutMany(Object.keys(relativeTime))).toEqual(referenceKeys);
      expect(common.skillhub.marketCard.clone).toBeTruthy();
      expect(common.skillhub.marketCard.timeLabel).toBeTruthy();
      expect(common.skillhub.marketCard.downloadsLabel).toBeTruthy();
      expect(relativeTime.justNow).toBeTruthy();
      expect(relativeTime.minutes_one).toBeTruthy();
      expect(relativeTime.minutes_other).toBeTruthy();
      expect(relativeTime.hours_one).toBeTruthy();
      expect(relativeTime.hours_other).toBeTruthy();
      expect(relativeTime.yesterday).toBeTruthy();
      expect(relativeTime.days_one).toBeTruthy();
      expect(relativeTime.days_other).toBeTruthy();
      expect(relativeTime.weeks_one).toBeTruthy();
      expect(relativeTime.weeks_other).toBeTruthy();
      expect(relativeTime.months_one).toBeTruthy();
      expect(relativeTime.months_other).toBeTruthy();
      expect(relativeTime.years_one).toBeTruthy();
      expect(relativeTime.years_other).toBeTruthy();
    }
  });
});
