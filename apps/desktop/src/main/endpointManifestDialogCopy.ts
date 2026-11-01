/**
 * 启动期「端点清单获取失败」系统弹框的四语文案与内容组装。
 *
 * 这个框弹在 createWindow 之前,renderer 与 i18next 都还不存在,所以文案只能手写在
 * main 侧。原实现把中英两段直接拼在同一个 detail 里(「无法获取服务器配置 … Failed to
 * load the server endpoint manifest …」),用户看到的是一屏中英混排;这里改成按系统
 * 语言选一种语言输出。
 *
 * 单独成模块的理由与 applicationMenuLabels / oauthResultPage 相同:
 * `scripts/check-i18n-glossary.mjs` 只读 renderer 的 locale JSON,扫不到手写 catalog,
 * 抽出来才能被 __tests__/endpointManifestDialogCopyGlossary.test.ts 直接 import 扫描;
 * 也避免测试为了拿文案去 import 整个 Electron 主进程模块。
 *
 * 组装逻辑(buildEndpointManifestDialogContent)是纯函数:失败分类、按钮集合与
 * detail 排版都不碰 Electron,由 clientEndpointsService 负责真正弹框。弹框直接展示
 * 简短错误信息；清单来源、网络探针与本机路径默认只进日志，用户主动点击「复制诊断
 * 信息」时才组装进剪贴板文本。
 */
import type { SupportedLocale } from '../shared/locale.js';

export type EndpointManifestDialogLocale = SupportedLocale;

/**
 * 失败分类。**判定规则的唯一事实源是 clientEndpointsService 的
 * classifyManifestFailure**;下面只是举例说明两类的意图,不要按举例反推边界。
 *
 * network = 拿不到清单但重试 / 离线出口有意义:传输层失败(超时 / DNS / 代理 / ERR_*)、
 * 5xx,以及 407 / 408 / 425 / 429 这类**非配置 4xx**(407 只可能来自代理,描述的是本机
 * 网络环境;其余是瞬时)。可重试、可能给离线出口。
 * config = 拿不到**可用**清单且重试无意义:正文内容不合法、region 不匹配、烘焙基址为空,
 * 以及**永久性** HTTP 3xx/4xx(路径 / 权限 / 部署错)。这一类不给离线出口。
 */
export type EndpointManifestFailureKind = 'network' | 'config';

/** 用户在弹框上做出的选择。 */
export type EndpointManifestDialogChoice = 'retry' | 'offline' | 'exit';
/** 弹框内部动作;复制诊断后仍停留在当前弹框,不会进入阻断循环。 */
export type EndpointManifestDialogAction = EndpointManifestDialogChoice | 'copy-diagnostics';
/** 复制诊断的结果,用于在同一个弹框里明确反馈成功或失败。 */
export type EndpointManifestDialogCopyStatus = 'idle' | 'success' | 'failed';

export interface EndpointManifestDialogCopy {
  networkTitle: string;
  configTitle: string;
  networkBody: string;
  configBody: string;
  errorLine: string;
  diagnosticsHint: string;
  copyDiagnosticsButton: string;
  copiedHint: string;
  copyFailedHint: string;
  noSavedConfigurationHint: string;
  offlineHint: string;
  retryButton: string;
  offlineButton: string;
  quitButton: string;
}

export const ENDPOINT_MANIFEST_DIALOG_COPY: Record<
  EndpointManifestDialogLocale,
  EndpointManifestDialogCopy
> = {
  en: {
    networkTitle: "Cindy Couldn't Connect",
    configTitle: "Cindy Couldn't Start",
    networkBody:
      "Cindy couldn't connect to its services during startup. Check that this device is online, then try starting again. If you're using a proxy or company network, try switching networks.",
    configBody:
      "Cindy couldn't finish starting right now. Try again later. If the problem continues, contact support.",
    errorLine: 'Error: {{error}}',
    diagnosticsHint: 'If you need help, copy the diagnostics into your support message.',
    copyDiagnosticsButton: 'Copy Diagnostics',
    copiedHint: 'Diagnostics copied. Paste them into your support message.',
    copyFailedHint: "Diagnostics couldn't be copied. Try again.",
    noSavedConfigurationHint:
      'This device has no saved configuration yet, so Cindy needs to reconnect before it can start.',
    offlineHint:
      'You can also start offline with the configuration Cindy last fetched ({{savedAt}}). Features that need a network connection will be unavailable.',
    retryButton: 'Try Starting Cindy Again',
    offlineButton: 'Use Last Configuration',
    quitButton: 'Quit Cindy',
  },
  fr: {
    networkTitle: 'Cindy n’a pas pu se connecter',
    configTitle: 'Cindy n’a pas pu démarrer',
    networkBody:
      'Cindy n’a pas pu se connecter à ses services au démarrage. Vérifiez que cet appareil est en ligne, puis réessayez. Si vous utilisez un proxy ou un réseau d’entreprise, essayez un autre réseau.',
    configBody:
      'Cindy n’a pas pu terminer le démarrage pour le moment. Réessayez plus tard. Si le problème persiste, contactez le support.',
    errorLine: 'Erreur : {{error}}',
    diagnosticsHint: 'Si vous avez besoin d’aide, copiez les informations de diagnostic dans votre message au support.',
    copyDiagnosticsButton: 'Copier les diagnostics',
    copiedHint: 'Diagnostics copiés. Collez-les dans votre message au support.',
    copyFailedHint: 'Impossible de copier les diagnostics. Réessayez.',
    noSavedConfigurationHint:
      'Cet appareil n’a pas encore de configuration enregistrée ; Cindy doit se reconnecter avant de pouvoir démarrer.',
    offlineHint:
      'Vous pouvez aussi démarrer hors ligne avec la configuration récupérée la dernière fois ({{savedAt}}). Les fonctionnalités nécessitant le réseau seront indisponibles.',
    retryButton: 'Réessayer de démarrer Cindy',
    offlineButton: 'Utiliser la dernière configuration',
    quitButton: 'Quitter Cindy',
  },
};

export interface EndpointManifestDialogInput {
  locale: EndpointManifestDialogLocale;
  kind: EndpointManifestFailureKind;
  /** 失败原因会以简短形态展示,并完整进入 diagnosticsText。 */
  reason: string;
  source?: string;
  diagnosis?: string | null;
  logPath?: string | null;
  /** 复制后在同一个弹框中显示成功或失败反馈。 */
  copyStatus?: EndpointManifestDialogCopyStatus;
  /** 上次成功配置的获取时间(已格式化);有值即提供离线启动按钮。 */
  offlineSavedAt?: string | null;
}

export interface EndpointManifestDialogContent {
  /** showMessageBoxSync 的 message(macOS 上是加粗标题行)。 */
  message: string;
  detail: string;
  buttons: string[];
  defaultId: number;
  cancelId: number;
  /** 按钮下标 → 语义,避免调用方按 index 猜。 */
  choices: EndpointManifestDialogAction[];
  /** 复制按钮使用的技术文本;永远不放进 message/detail。 */
  diagnosticsText: string;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

/** 去掉内部传输包装,直接向用户展示真正有用的错误码或校验原因。 */
export function formatEndpointManifestVisibleError(reason: string): string {
  return reason.startsWith('fetch-failed:') ? reason.slice('fetch-failed:'.length) : reason;
}

/** 供复制按钮使用的完整技术上下文;不参与普通用户可见文案。 */
export function buildEndpointManifestDiagnosticsText(
  input: Pick<EndpointManifestDialogInput, 'kind' | 'reason' | 'source' | 'diagnosis' | 'logPath'>,
): string {
  return [
    'Cindy startup diagnostics',
    `kind=${input.kind}`,
    `reason=${input.reason}`,
    `source=${input.source ?? 'n/a'}`,
    `diagnosis=${input.diagnosis ?? 'n/a'}`,
    `logPath=${input.logPath ?? 'n/a'}`,
  ].join('\n');
}

/**
 * 组装弹框内容。离线按钮只在 kind === 'network' 且确实有可用缓存时出现——配置内容
 * 非法时给离线出口等于让用户绕过一次真实的配置事故。
 */
export function buildEndpointManifestDialogContent(
  input: EndpointManifestDialogInput,
): EndpointManifestDialogContent {
  const copy = ENDPOINT_MANIFEST_DIALOG_COPY[input.locale];
  const offlineAvailable = input.kind === 'network' && Boolean(input.offlineSavedAt);

  const lines = [input.kind === 'network' ? copy.networkBody : copy.configBody];
  if (input.kind === 'network' && !offlineAvailable) {
    lines.push('', copy.noSavedConfigurationHint);
  }
  lines.push(
    '',
    fill(copy.errorLine, { error: formatEndpointManifestVisibleError(input.reason) }),
    copy.diagnosticsHint,
  );
  if (input.copyStatus === 'success') {
    lines.push('', copy.copiedHint);
  } else if (input.copyStatus === 'failed') {
    lines.push('', copy.copyFailedHint);
  }
  if (offlineAvailable) {
    lines.push('', fill(copy.offlineHint, { savedAt: input.offlineSavedAt ?? '' }));
  }

  const buttons = [copy.retryButton, copy.copyDiagnosticsButton];
  const choices: EndpointManifestDialogAction[] = ['retry', 'copy-diagnostics'];
  if (offlineAvailable) {
    buttons.push(copy.offlineButton);
    choices.push('offline');
  }
  buttons.push(copy.quitButton);
  choices.push('exit');

  return {
    message: input.kind === 'network' ? copy.networkTitle : copy.configTitle,
    detail: lines.join('\n'),
    buttons,
    defaultId: 0,
    cancelId: buttons.length - 1,
    choices,
    diagnosticsText: buildEndpointManifestDiagnosticsText(input),
  };
}
