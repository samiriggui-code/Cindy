import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPreferredSystemLanguages: () => ['en'],
    getLocale: () => 'en',
  },
}));

import { setMainLocale } from '../i18n';
import {
  getSessionExternalNotificationText,
  getSessionNotificationBody,
  getSessionNotificationUntitled,
  getTeammateNotificationFallback,
} from '../sessionNotificationCopy';
import type { SupportedLocale } from '../../shared/locale';

const CASES: Array<{
  locale: SupportedLocale;
  title: string;
  untitled: string;
  done: string;
  error: string;
  needsReply: string;
  externalDone: string;
  externalError: string;
  externalNeedsReply: string;
}> = [
  {
    locale: 'fr',
    title: 'Rapport',
    untitled: 'Séance sans titre',
    done: 'Terminé ✓',
    error: 'Échec',
    needsReply: 'Réponse nécessaire',
    externalDone: 'Cindy · Séance « Rapport » terminée ✓',
    externalError: 'Cindy · La session « Rapport » a échoué',
    externalNeedsReply: 'Cindy · La session « Rapport » a besoin de votre réponse',
  },
  {
    locale: 'en',
    title: 'Report',
    untitled: 'Untitled session',
    done: 'Completed ✓',
    error: 'Failed',
    needsReply: 'Reply needed',
    externalDone: 'Cindy · Session “Report” completed ✓',
    externalError: 'Cindy · Session “Report” failed',
    externalNeedsReply: 'Cindy · Session “Report” needs your reply',
  },
];

describe('session notification copy', () => {
  it.each(CASES)('$locale 使用当前语言生成三种状态与外部通知', (entry) => {
    setMainLocale(entry.locale);

    expect(getSessionNotificationUntitled()).toBe(entry.untitled);
    expect(getSessionNotificationBody('done')).toBe(entry.done);
    expect(getSessionNotificationBody('error')).toBe(entry.error);
    expect(getSessionNotificationBody('needs-reply')).toBe(entry.needsReply);
    expect(getSessionExternalNotificationText(entry.title, 'done')).toBe(entry.externalDone);
    expect(getSessionExternalNotificationText(entry.title, 'error')).toBe(entry.externalError);
    expect(getSessionExternalNotificationText(entry.title, 'needs-reply')).toBe(
      entry.externalNeedsReply,
    );
  });

  it('运行时切换语言后下一条通知立即跟随', () => {
    setMainLocale('en');
    expect(getSessionNotificationBody('needs-reply')).toBe('Reply needed');
    setMainLocale('fr');
    expect(getSessionNotificationBody('needs-reply')).toBe('Réponse nécessaire');
  });

  it.each(['foo$&bar', 'foo$`bar', "foo$'bar", 'foo$$bar'])(
    '将包含 JavaScript replacement token 的标题 %s 原样插入三种外部通知',
    (title) => {
      setMainLocale('en');
      expect(getSessionExternalNotificationText(title, 'done')).toBe(
        `Cindy · Session “${title}” completed ✓`,
      );
      expect(getSessionExternalNotificationText(title, 'error')).toBe(
        `Cindy · Session “${title}” failed`,
      );
      expect(getSessionExternalNotificationText(title, 'needs-reply')).toBe(
        `Cindy · Session “${title}” needs your reply`,
      );
    },
  );
});


it.each([
  ['en', 'New reply'], ['fr', 'Nouvelle réponse'],
] as const)('uses the current %s locale for a reply with no preview', (locale, expected) => {
  setMainLocale(locale);
  expect(getTeammateNotificationFallback()).toBe(expected);
});
