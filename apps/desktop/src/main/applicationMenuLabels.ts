/**
 * macOS 原生应用菜单的四语标签。
 *
 * 单独成模块是为了**能被术语门禁扫到**。它和 i18next 的 locale JSON 一样是用户可见
 * 文案,但不走 i18next,check-i18n-glossary.mjs 只读 locale JSON 扫不到它——引入术语表
 * 时这里就漏掉了「议题」(Issue 的禁用译法)和三处 ASCII 省略号,而这是 macOS 上一直
 * 挂在屏幕顶端的菜单栏。
 *
 * 覆盖它的是 __tests__/applicationMenuLabels.test.ts,与 mobile 影子 catalog 同一套路子:
 * vitest 直接 import 运行时对象,复用 scripts/shared/glossary-rules.mjs 的判定。
 * 之所以要抽出来,是因为原先它嵌在 bootstrap-electron.ts 里,测试一 import 就会拉起
 * 整个 Electron 主进程模块。
 *
 * `installCli*` 一组里的 `{{cmd}}` 是**命令名占位符**,由调用侧按本构建 edition 品牌
 * 替换(global/cn → `cindy`,dev → `cindydev`,见 installCliCommand.ts 的
 * CLI_COMMAND_NAME);`{{path}}` 替换为 symlink 安装路径。文案里的 “Cindy” 指产品/应用
 * 本身,不随命令名变化,故保留。
 */
import type { SupportedLocale } from '../shared/locale.js';

export type ApplicationMenuLocale = SupportedLocale;

export interface ApplicationMenuLabels {
  about: string;
  hide: string;
  quit: string;
  settings: string;
  checkForUpdates: string;
  fileMenu: string;
  newMaker: string;
  viewMenu: string;
  toggleSidebar: string;
  windowMenu: string;
  helpMenu: string;
  help: string;
  releaseNotes: string;
  issues: string;
  installCli: string;
  installCliConfirmTitle: string;
  installCliConfirmDetail: string;
  installCliConfirmOk: string;
  installCliCancel: string;
  installCliSuccessTitle: string;
  installCliSuccessDetail: string;
  installCliErrorTitle: string;
  installCliErrorDetail: string;
  installCliDevOnlyTitle: string;
  installCliDevOnlyDetail: string;
  installCliUnsupportedTitle: string;
  installCliUnsupportedDetail: string;
  installCliNotInApplicationsTitle: string;
  installCliNotInApplicationsDetail: string;
  installCliMoveToApplications: string;
}

export const APPLICATION_MENU_LABELS: Record<ApplicationMenuLocale, ApplicationMenuLabels> = {
  en: {
    about: 'About {{appName}}',
    hide: 'Hide {{appName}}',
    quit: 'Quit {{appName}}',
    settings: 'Settings…',
    checkForUpdates: 'Check for Updates…',
    fileMenu: 'File',
    newMaker: 'New Session',
    viewMenu: 'View',
    toggleSidebar: 'Toggle Sidebar',
    windowMenu: 'Window',
    helpMenu: 'Help',
    help: 'Help',
    releaseNotes: "What's New",
    issues: 'Issues',
    installCli: "Install '{{cmd}}' Command in PATH",
    installCliConfirmTitle: "Install the '{{cmd}}' command in your PATH?",
    installCliConfirmDetail:
      'A symlink to Cindy will be created at {{path}}; if a file already exists there, it will be replaced. You can then run `{{cmd}} .` in a terminal to open the current directory as a working directory in Cindy. You will be asked for your administrator password to write to that location.',
    installCliConfirmOk: 'Install',
    installCliCancel: 'Cancel',
    installCliSuccessTitle: "'{{cmd}}' command installed",
    installCliSuccessDetail:
      'Installed at {{path}}. Open a new terminal window and run `{{cmd}} .`. If the command is not found, make sure that directory is on your PATH.',
    installCliErrorTitle: 'Installation failed',
    installCliErrorDetail: "Could not install the '{{cmd}}' command.",
    installCliDevOnlyTitle: 'Packaged build only',
    installCliDevOnlyDetail:
      'The command-line tool cannot be installed in development mode: the executable points at the Electron runtime rather than the Cindy app. Use this from an installed Cindy build.',
    installCliUnsupportedTitle: 'Not supported on this system',
    installCliUnsupportedDetail: "Installing the '{{cmd}}' command is currently supported on macOS only.",
    installCliNotInApplicationsTitle: 'Move Cindy to the Applications folder first',
    installCliNotInApplicationsDetail:
      'Cindy is running from a temporary location (not the Applications folder). A command installed now would point at that temporary path and break as soon as the app quits or the volume is ejected. Move Cindy to the Applications folder, then install the command.',
    installCliMoveToApplications: 'Move to Applications',
  },
  fr: {
    about: 'À propos de {{appName}}',
    hide: 'Masquer {{appName}}',
    quit: 'Quitter {{appName}}',
    settings: 'Paramètres…',
    checkForUpdates: 'Rechercher des mises à jour…',
    fileMenu: 'Fichier',
    newMaker: 'Nouvelle tâche',
    viewMenu: 'Affichage',
    toggleSidebar: 'Afficher/masquer la barre latérale',
    windowMenu: 'Fenêtre',
    helpMenu: 'Aide',
    help: 'Aide',
    releaseNotes: 'Nouveautés',
    issues: 'Signaler un problème',
    installCli: 'Installer la commande {{cmd}} dans le PATH',
    installCliConfirmTitle: 'Installer la commande {{cmd}} dans votre PATH ?',
    installCliConfirmDetail:
      'Un lien symbolique vers Cindy sera créé à {{path}} ; si un fichier existe déjà à cet emplacement, il sera remplacé. Vous pourrez ensuite exécuter {{cmd}} . dans un terminal pour ouvrir le répertoire courant comme dossier de travail dans Cindy. Votre mot de passe administrateur sera demandé pour écrire à cet emplacement.',
    installCliConfirmOk: 'Installer',
    installCliCancel: 'Annuler',
    installCliSuccessTitle: 'Commande {{cmd}} installée',
    installCliSuccessDetail:
      'Installée à {{path}}. Ouvrez un nouveau terminal et exécutez {{cmd}} . Si la commande est introuvable, vérifiez que ce répertoire est dans votre PATH.',
    installCliErrorTitle: 'Échec de l’installation',
    installCliErrorDetail: 'Impossible d’installer la commande {{cmd}}.',
    installCliDevOnlyTitle: 'Build empaqueté uniquement',
    installCliDevOnlyDetail:
      'L’outil en ligne de commande ne peut pas être installé en mode développement : l’exécutable pointe vers le runtime Electron et non vers l’application Cindy. Utilisez cette fonction depuis une installation Cindy empaquetée.',
    installCliUnsupportedTitle: 'Non pris en charge sur ce système',
    installCliUnsupportedDetail: 'L’installation de la commande {{cmd}} n’est actuellement prise en charge que sur macOS.',
    installCliNotInApplicationsTitle: 'Déplacez d’abord Cindy dans le dossier Applications',
    installCliNotInApplicationsDetail:
      'Cindy s’exécute depuis un emplacement temporaire (hors du dossier Applications). Une commande installée maintenant pointerait vers ce chemin temporaire et cesserait de fonctionner dès que l’application quitte ou que le volume est éjecté. Déplacez Cindy dans le dossier Applications, puis installez la commande.',
    installCliMoveToApplications: 'Déplacer vers Applications',
  },
};
