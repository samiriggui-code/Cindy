import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';

import en from '../../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';
import { formatCompactionDuration, formatSessionDuration, formatShellDuration } from '../sessionDurationFormat';

function translator(catalog: Record<string, unknown>): TFunction {
  return ((key: string, values: Record<string, string | number>) => {
    const template = key.split('.').reduce<unknown>((node, part) =>
      (node as Record<string, unknown>)[part], catalog);
    if (typeof template !== 'string') throw new Error(`Missing translation: ${key}`);
    return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name]));
  }) as TFunction;
}

describe('Desktop task durations', () => {
  it.each([
    [en, '21h 31m', '2d 3h 4m', '1h 0m', '1d 0h 0m'],
    [fr, '21h 31m', '2j 3h 4m', '1h 0m', '1j 0h 0m'],
  ] as const)('localizes promoted units with real catalog %#', (catalog, hours, days, hour, day) => {
    const t = translator(catalog);
    expect(formatSessionDuration(77_516_000, t)).toBe(hours);
    expect(formatSessionDuration(183_845_000, t)).toBe(days);
    expect(formatSessionDuration(3_599_600, t)).toBe(hour);
    expect(formatSessionDuration(86_399_600, t)).toBe(day);
  });

  it('uses localized units in work summaries and preserves live padding', () => {
    const t = translator(fr);
    expect(t('chat.workGroup.worked', { duration: formatSessionDuration(183_845_000, t) }))
      .toBe('A travaillé pendant 2j 3h 4m');
    const options = { minimumSeconds: 0, alwaysShowRemainder: true, padRemainder: true };
    expect(formatSessionDuration(0, t, options)).toBe('0s');
    expect(formatSessionDuration(65_000, t, options)).toBe('1m 05s');
    expect(formatSessionDuration(7_509_000, t, options)).toBe('2h 05m');
    expect(formatSessionDuration(86_400_000, t, options)).toBe('1j 00h 00m');
  });

  it('keeps exact shell milliseconds below an hour', () => {
    const t = translator(en);
    expect(formatShellDuration(1500, t)).toBe('1500ms');
    expect(formatShellDuration(59_999, t)).toBe('59999ms');
    expect(formatShellDuration(3_599_999, t)).toBe('3599999ms');
    expect(formatShellDuration(3_600_000, t)).toBe('1h 0m');
    expect(formatShellDuration(86_400_000, translator(fr))).toBe('1j 0h 0m');
  });

  it('keeps fractional compaction seconds below an hour', () => {
    const t = translator(en);
    expect(formatCompactionDuration(1500, t)).toBe('1.5s');
    expect(formatCompactionDuration(75_500, t)).toBe('75.5s');
    expect(formatCompactionDuration(3_599_900, t)).toBe('3599.9s');
    expect(formatCompactionDuration(3_600_000, t)).toBe('1h 0m');
  });
});
