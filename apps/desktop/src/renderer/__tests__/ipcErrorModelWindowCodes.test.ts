import { describe, expect, it } from 'vitest';

import en from '../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';
import { extractIpcError, mapIpcErrorToI18nKey } from '../utils/ipcError';

const codes = [
  'MODEL_CONTEXT_USAGE_UNKNOWN',
  'MODEL_WINDOW_CURRENT_CONTEXT_UNKNOWN',
  'MODEL_WINDOW_TARGET_CONTEXT_UNKNOWN',
  'MODEL_WINDOW_REMOTE_REBUILD_UNSUPPORTED',
  'MODEL_WINDOW_PROTECTION_UNAVAILABLE',
  'MODEL_SWITCH_TASK_RUNNING',
  'MODEL_WINDOW_PREPARATION_IN_PROGRESS',
] as const;

const locales = { en, fr } as const;

describe('model-window switch IPC errors', () => {
  it.each(codes)('decodes %s after Electron wraps the main-process error', (code) => {
    const error = new Error(
      `Error invoking remote method 'maker:set-model': Error: [${code}] internal detail`,
    );

    expect(extractIpcError(error)).toEqual({ code, message: 'internal detail' });
    expect(mapIpcErrorToI18nKey(error)).toBe(`ipcError.${code}`);
  });

  it('provides actionable copy for every supported Desktop locale', () => {
    for (const [locale, catalog] of Object.entries(locales)) {
      for (const code of codes) {
        expect(catalog.ipcError[code], `${locale}:${code}`).toEqual(expect.any(String));
        expect(catalog.ipcError[code].length, `${locale}:${code}`).toBeGreaterThan(20);
      }
      expect(
        catalog.newChat.chatInput.modelWindowUnknown.custom,
        `${locale}:custom recovery`,
      ).toContain('{{model}}');
      expect(
        catalog.newChat.chatInput.modelWindowUnknown.builtin,
        `${locale}:builtin recovery`,
      ).toContain('{{provider}}');
      expect(
        catalog.newChat.chatInput.modelWindowUnknown.openSettings,
        `${locale}:settings action`,
      ).toEqual(expect.any(String));
    }
    expect(fr.ipcError.MODEL_WINDOW_CURRENT_CONTEXT_UNKNOWN).toBe(
      "Modèle non changé : Cindy ne peut pas vérifier la fenêtre contextuelle du modèle actuel. Vérifiez le paramètre de fenêtre pour un modèle personnalisé. S'il ne peut pas être modifié, conservez le modèle actuel ou démarrez une nouvelle tâche.",
    );
    expect(en.ipcError.MODEL_WINDOW_TARGET_CONTEXT_UNKNOWN).toBe(
      'Model not switched: Cindy can’t verify the target model’s context window. Check the window setting for a custom model. If it can’t be changed, choose another model or start a new task.',
    );
    expect(fr.ipcError.MODEL_WINDOW_REMOTE_REBUILD_UNSUPPORTED).toBe(
      "Modèle non changé : cette tâche distante ne peut pas préparer son contexte en toute sécurité pour la fenêtre plus petite. Conservez le modèle actuel ou choisissez le modèle cible dans une nouvelle tâche.",
    );
  });
});
