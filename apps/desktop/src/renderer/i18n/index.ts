/**
 * i18n 入口 —— 同步 init i18next，导出常量与类型。
 *
 * 设计要点：
 * - 资源同步 import (零网络/零 IO)，i18n.init 同步完成 → React 首屏不闪。
 * - 默认 namespace 为 'common'；体积较小、边界清晰的功能文案可独立拆分。
 * - fallbackLng：缺 key 时不显示 key 本身,直接回退英文。
 * - 不接 LanguageDetector backend，初始化与 useLocale 共用现有语言偏好。
 *   'system' 的实际语言由 main 侧读取 OS 首选语言后传入 renderer。
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { BRAND_NAME } from '@cindy/maker-shared/branding';

import enCommon from './locales/en/common.json';
import enAiRename from './locales/en/aiRename.json';
import frCommon from './locales/fr/common.json';
import frAiRename from './locales/fr/aiRename.json';
import { GHOST_OFFICIAL_ID_PREFIX } from '../../shared/ghost';
import { DEFAULT_LOCALE, type SupportedLocale } from '../../shared/locale';
import { getEffectiveLocale } from '../lib/localePreference';

const DEFAULT_PRONOUN_BY_LOCALE: Record<SupportedLocale, string> = {
  en: 'this teammate',
  fr: 'ce coéquipier',
};

export {
  DEFAULT_LOCALE,
  resolvePreferredSystemLocale,
  resolveSystemLocale,
  SUPPORTED_LOCALES,
} from '../../shared/locale';
export type { LocalePreference, SupportedLocale } from '../../shared/locale';

// 凭证写入逃生口必须在各 locale 里共用同一条安全命令；集中覆盖防止某个 locale 又退回
// “手动设置环境变量”的危险指引。对应跨 locale 契约由 devOAuthWritePolicy.test 锁住。
const resources = {
  en: {
    common: {
      ...enCommon,
      chatgptAuthRecovery: {
        ...enCommon.chatgptAuthRecovery,
        devWriteBlocked: 'Development builds use this computer’s ChatGPT sign-in read-only by default and cannot start OAuth or change its credentials. To test OAuth, run: pnpm restart:desktop:remote -- --isolated-auth --isolated. The restart script enables writes only after verifying the sandbox.',
      },
    },
    aiRename: enAiRename,
  },
  fr: {
    common: {
      ...frCommon,
      chatgptAuthRecovery: {
        ...frCommon.chatgptAuthRecovery,
        devWriteBlocked:
          'Les builds de développement utilisent par défaut la connexion ChatGPT de cet ordinateur en lecture seule et ne peuvent pas lancer OAuth ni modifier les identifiants. Pour tester OAuth, exécutez : pnpm restart:desktop:remote -- --isolated-auth --isolated. Le script de redémarrage n’autorise les écritures qu’après vérification du bac à sable.',
      },
    },
    aiRename: frAiRename,
  },
} as const;

// 同步 init —— 没有 backend / detector / suspense，i18n.init 立即返回。
// 不 await 也安全：所有 t() 调用之前 init 已经完成 (本文件 import 即 init)。
void i18n.use(initReactI18next).init({
  resources,
  // 翻译资源热更新会重新执行本模块，不能把用户已选语言重置为默认英文。
  lng: getEffectiveLocale(),
  // 缺 key 先回退默认 locale，再回退英文。
  fallbackLng: { default: [DEFAULT_LOCALE, 'en'] },
  defaultNS: 'common',
  ns: ['common', 'aiRename'],
  interpolation: {
    escapeValue: false, // React 已转义
    defaultVariables: {
      appName: BRAND_NAME,
      pronoun: DEFAULT_PRONOUN_BY_LOCALE[getEffectiveLocale()] ?? DEFAULT_PRONOUN_BY_LOCALE[DEFAULT_LOCALE],
      reservedGhostIdPrefixes: GHOST_OFFICIAL_ID_PREFIX,
    },
  },
  parseMissingKeyHandler(key: string, defaultValue?: string) {
    if (
      (key.startsWith('ipcError.') || key.startsWith('chat.remoteError.')) &&
      key !== 'ipcError.INTERNAL'
    ) {
      const lng = i18n.resolvedLanguage || i18n.language;
      const fallback =
        i18n.getResource(lng, 'common', 'ipcError.INTERNAL') ??
        i18n.getResource('en', 'common', 'ipcError.INTERNAL');
      if (typeof fallback === 'string') return fallback;
    }
    return defaultValue ?? key;
  },
  returnNull: false,
});

export { i18n };
export default i18n;
