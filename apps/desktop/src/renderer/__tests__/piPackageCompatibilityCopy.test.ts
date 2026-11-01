import { describe, expect, it } from 'vitest';

import en from '../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';

describe('Pi package compatibility copy', () => {
  it.each([
    ['en', en, 'question cards', 'timer', 'task transcript'],
    ['fr', fr, 'cartes de questions', 'minuteur', 'transcription de la tâche'],
  ])('%s describes the implemented dialog and notification bridges', (
    _locale,
    catalog,
    cardCopy,
    timedCopy,
    transcriptCopy,
  ) => {
    const issues = catalog.settings.piPackages.issues;
    expect(issues['interactive-dialogs']).toContain(cardCopy);
    expect(issues['interactive-dialogs']).toContain(timedCopy);
    expect(issues.notifications).toContain(transcriptCopy);
  });
});
