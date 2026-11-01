import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './locale.js';
import en from '../renderer/i18n/locales/en/common.json';
import fr from '../renderer/i18n/locales/fr/common.json';
export { verifiedOwnerRequestText } from '@cindy/maker-shared/auto-review-intent';

// The same locale resources serve persisted text and host task context.
const FORWARDED_REQUEST_COPY = {
  en: en.forwardedRequest,
  fr: fr.forwardedRequest,
} satisfies Record<SupportedLocale, typeof en.forwardedRequest>;

/** Pre-fr/en UI hosts; wire matching only (not a supported app locale). */
const LEGACY_ZH_CN_FORWARDED_REQUEST = {
  sourceMissing: '[来源] 未找到可核验的用户原话。',
  sourcePresent: '[来源] 用户原话由宿主从已接收的输入原样保留。',
  userPrefix: '用户原话：',
  agentPrefix: 'agent补充：',
} as const;

/** Host-owned source evidence. It describes authorship, never execution permission. */
export interface ForwardedRequestSource {
  userText: string | null;
  sessionId?: string;
  clientId?: string;
  /**
   * The sending host admitted this relay as the owner's request or its accepted continuation.
   * Only then does the receiver treat userText as the owner's
   * request for this task. Optional on the wire; older hosts drop or never send it.
   */
  ownerVerified?: true;
}

/** Kept under the existing protected, non-human input receipt. */
export interface AgentRequestReceipt {
  kind: 'agent-request' | 'delegated-continuation';
  request?: ForwardedRequestSource;
}

export function readForwardedRequestSource(value: unknown): ForwardedRequestSource | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.userText === null) return { userText: null };
  if (typeof source.userText !== 'string' || typeof source.sessionId !== 'string'
    || !source.sessionId || typeof source.clientId !== 'string' || !source.clientId) return null;
  return { userText: source.userText, sessionId: source.sessionId, clientId: source.clientId,
    ...(source.ownerVerified === true ? { ownerVerified: true as const } : {}) };
}

/** JSON string quoting keeps an agent-written label inside the supplement. No trimming or summarizing. */
export function formatForwardedRequest(source: ForwardedRequestSource, supplement: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const copy = FORWARDED_REQUEST_COPY[locale];
  return [
    source.userText === null ? copy.sourceMissing : copy.sourcePresent,
    `${copy.userPrefix}${JSON.stringify(source.userText ?? '')}`,
    `${copy.agentPrefix}${JSON.stringify(supplement)}`,
  ].join('\n');
}

/** Validate the sender's locale independently of this computer's language. Includes the original Chinese format. */
export function matchesForwardedRequest(source: ForwardedRequestSource, body: string): boolean {
  const lines = body.split('\n');
  if (lines.length !== 3) return false;
  const tryLocale = (locale: SupportedLocale): boolean => {
    const prefix = FORWARDED_REQUEST_COPY[locale].agentPrefix;
    if (!lines[2].startsWith(prefix)) return false;
    try {
      const supplement: unknown = JSON.parse(lines[2].slice(prefix.length));
      if (typeof supplement !== 'string') return false;
      return formatForwardedRequest(source, supplement, locale) === body;
    } catch {
      return false;
    }
  };
  if (SUPPORTED_LOCALES.some(tryLocale)) return true;
  const legacyPrefix = LEGACY_ZH_CN_FORWARDED_REQUEST.agentPrefix;
  if (!lines[2].startsWith(legacyPrefix)) return false;
  try {
    const supplement: unknown = JSON.parse(lines[2].slice(legacyPrefix.length));
    if (typeof supplement !== 'string') return false;
    const legacySource =
      source.userText === null
        ? LEGACY_ZH_CN_FORWARDED_REQUEST.sourceMissing
        : LEGACY_ZH_CN_FORWARDED_REQUEST.sourcePresent;
    return [
      legacySource,
      `${LEGACY_ZH_CN_FORWARDED_REQUEST.userPrefix}${JSON.stringify(source.userText ?? '')}`,
      `${legacyPrefix}${JSON.stringify(supplement)}`,
    ].join('\n') === body;
  } catch {
    return false;
  }
}

/** Main-process persistence capability: JSON / IPC cannot mint this key. */
export const FORWARDED_REQUEST_RECEIPT = Symbol('forwarded-request-receipt');
