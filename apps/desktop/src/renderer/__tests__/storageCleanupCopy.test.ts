import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';

describe('storage cleanup copy', () => {
  it.each([
    ['en', en, 'Clear image cache', 'Clear attachment cache'],
    ['fr', fr, 'Vider le cache des images', 'Vider le cache des pièces jointes'],
  ] as const)(
    '%s names the target in settings and native confirmation actions',
    (_locale, messages, imageAction, attachmentAction) => {
      const storage = messages.settings.about.storage;

      expect(storage.legacyImagesClearButton).toBe(imageAction);
      expect(storage.legacyImagesClearConfirmButton).toBe(imageAction);
      expect(storage.chatAttachmentsClearButton).toBe(attachmentAction);
      expect(storage.chatAttachmentsClearConfirmButton).toBe(attachmentAction);
    },
  );

  it.each([
    ['en', en, ['database backup', 'review or undo', 'cannot be restored']],
    ['fr', fr, ['sauvegarde de la base de données', 'examiner ou annuler', 'ne peuvent pas être restaurés']],
  ] as const)(
    '%s states that file-change review and undo records are excluded from the database backup',
    (_locale, messages, expectedFragments) => {
      const description =
        messages.settings.about.storage.dbSlimmingIncludeActiveConfirmDescription;

      for (const fragment of expectedFragments) expect(description).toContain(fragment);
    },
  );
});
