/**
 * RSB WebAuthn 原生账户选择框的四语文案。
 *
 * 这份 catalog 不走 renderer i18next，单独成模块是为了让主进程测试能够在
 * 不加载 Electron 启动入口的前提下执行术语与标点门禁。
 */
import type { SupportedLocale } from '../shared/locale.js';

export interface RsbBrowserWebAuthnLabels {
  title: string;
  message: string;
  detail: string;
  cancel: string;
  unknownAccount: string;
  unknownRelyingParty: string;
  touchIdPromptReason: string;
}

export const RSB_BROWSER_WEBAUTHN_LABELS: Record<
  SupportedLocale,
  RsbBrowserWebAuthnLabels
> = {
  en: {
    title: 'Choose a Passkey',
    message: 'Choose a passkey for {{relyingPartyId}}',
    detail:
      'Cindy only passes your selection to the authenticator; the passkey secret stays in the authenticator.',
    cancel: 'Cancel Passkey Sign-In',
    unknownAccount: 'Passkey {{index}}',
    unknownRelyingParty: 'this website',
    touchIdPromptReason: 'verify your identity on $1',
  },
  fr: {
    title: 'Choisir une clé d’accès',
    message: 'Choisissez une clé d’accès pour {{relyingPartyId}}',
    detail:
      'Cindy transmet uniquement votre choix à l’authentificateur ; le secret de la clé d’accès reste dans l’authentificateur.',
    cancel: 'Annuler la connexion par clé d’accès',
    unknownAccount: 'Clé d’accès {{index}}',
    unknownRelyingParty: 'ce site',
    touchIdPromptReason: 'vérifiez votre identité sur $1',
  },
};
