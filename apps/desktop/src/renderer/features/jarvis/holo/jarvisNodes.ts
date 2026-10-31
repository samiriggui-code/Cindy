/**
 * La constellation JARVIS : les 18 places de la constellation d'APEX (mêmes
 * coordonnées, mêmes tailles, mêmes rayons), occupées par les outils JARVIS.
 *
 *   cyan   (consultant) — ce qui réfléchit : Claude, mémoire, recherche…
 *   orange (doer)       — ce qui agit : code, maison, Plex, serveurs…
 *   bleu   (tool)       — les capteurs : réseau, ciel, notifications…
 *
 * Chaque nœud a sa fiche (rôle, capacités, exemples de phrases, état), qui
 * s'ouvre au clic et toute seule quand JARVIS utilise l'outil.
 */

// [id, label, couche, x, y, live, courbure, rayon] — format de ReasoningWeb.
export type RosterRow = [string, string, string, number, number, boolean, number, number];

export const JARVIS_ROSTER: RosterRow[] = [
  ["claude", "Claude", "consultant", 250, 212, true, 18, 9],
  ["memoire", "Mémoire", "consultant", 452, 250, true, -18, 8],
  ["web", "Recherche web", "consultant", 296, 118, true, -22, 6.5],
  ["navigateur", "Navigateur", "consultant", 182, 150, true, 24, 6.5],
  ["personnages", "Personnages", "consultant", 436, 148, true, -20, 6.5],
  ["ecran", "Écran", "consultant", 584, 208, true, -26, 6.5],
  ["vscode", "VS Code", "doer", 158, 266, true, 22, 6.5],
  ["github", "GitHub", "doer", 195, 298, true, 22, 6.5],
  ["serveurs", "Serveurs", "doer", 232, 330, true, 20, 6.5],
  ["youtube", "YouTube", "doer", 330, 374, true, -16, 6.5],
  ["plex", "Plex", "doer", 426, 350, true, -18, 6.5],
  ["maison", "Maison", "doer", 502, 312, true, -22, 6.5],
  ["console", "Console", "doer", 118, 356, true, 26, 6],
  ["reseau", "Réseau", "tool", 256, 388, true, 20, 5.5],
  ["video", "Lecteur vidéo", "tool", 414, 392, true, -18, 5.5],
  ["ciel", "Ciel", "tool", 560, 356, true, -24, 5.5],
  ["notifs", "Notifications", "tool", 608, 286, true, -26, 5.5],
  ["notes", "Notes", "tool", 582, 132, true, 24, 5.5],
];

const COLOR: Record<string, string> = { consultant: "#59ebff", doer: "#ff941f", tool: "#6b8cff" };
export const JARVIS_LIST = JARVIS_ROSTER.map((r) => ({ key: r[0], name: r[1], color: COLOR[r[2]] }));

export type NodeInfo = {
  role: string;
  caps: string[];
  asks?: string[];
  status: "online" | "standby" | "integration";
};

export const JARVIS_INFO: Record<string, NodeInfo> = {
  claude: { role: "Le cerveau — raisonne et choisit les outils", status: "online",
    caps: ["Comprend la demande et décide quoi faire", "Enchaîne plusieurs outils dans la même réponse", "Anticipe la suite logique"],
    asks: ["Prépare-moi la soirée film", "Qu'est-ce que tu me conseilles ?"] },
  memoire: { role: "Les proches et les souvenirs", status: "online",
    caps: ["Un profil par membre de la famille et ami", "Souvenirs datés, notés par importance", "Adapte le ton aux enfants"],
    asks: ["C'est Léa qui parle", "Retiens qu'elle adore les chevaux"] },
  web: { role: "Recherche sur internet", status: "online",
    caps: ["Actualité, météo, faits récents", "Lit et résume une page", "Cite ce qu'il trouve"],
    asks: ["Quel temps demain ?", "Les dernières news sur Omarchy"] },
  navigateur: { role: "Claude aux commandes du navigateur", status: "integration",
    caps: ["Ouvre une recherche ou un site à l'écran", "Bientôt : navigue, clique et remplit pour vous", "Confirmation vocale avant toute action engageante"],
    asks: ["Ouvre Google Maps sur Lyon", "Cherche un vol pour Alger"] },
  personnages: { role: "Historien, Conteur, Prof, Chef…", status: "online",
    caps: ["Chaque personnage a sa voix", "Conteur et Prof pensés pour les enfants", "Crée de nouveaux personnages à la voix"],
    asks: ["Passe-moi l'historien", "Mode conteur", "Reviens Jarvis"] },
  ecran: { role: "Voit et range l'écran", status: "online",
    caps: ["Regarde et décrit ce qui est affiché", "Fenêtres : fermer, plein écran, bureaux", "Ouvre les applications"],
    asks: ["Qu'est-ce qu'il y a sur mon écran ?", "Ferme la fenêtre", "Va sur le bureau 2"] },
  vscode: { role: "Ouvre et prépare vos projets", status: "online",
    caps: ["VS Code + terminal dans le bon dossier", "Clone le dépôt s'il manque", "IchiVol, gsms-platform, RestaurantOS…"],
    asks: ["On bosse sur IchiVol", "Ouvre gsms-qualiopi"] },
  github: { role: "Dépôts, PR et CI", status: "standby",
    caps: ["PR ouvertes et derniers runs Actions", "État de chaque dépôt", "À connecter : gh auth login"],
    asks: ["Où en est la CI d'IchiVol ?", "J'ai des PR ouvertes ?"] },
  serveurs: { role: "ProLiant, iLO et VPS", status: "online",
    caps: ["Santé, températures, ventilateurs du ProLiant", "Allumer / éteindre le serveur Plex", "VPS : conteneurs, logs, redémarrage"],
    asks: ["Comment va le serveur Plex ?", "Logs de traefik"] },
  youtube: { role: "Vidéos à la demande", status: "online",
    caps: ["Ouvre directement la recherche", "Pause, suivant, volume", "Mode film en un mot"],
    asks: ["Mets la vidéo d'Inoxtag", "Pause"] },
  plex: { role: "Bibliothèque du ProLiant", status: "online",
    caps: ["Trouve films et séries", "Reprend une série à l'épisode en cours", "Lance sur l'Apple TV ou la Freebox"],
    asks: ["Lance Avatar sur l'Apple TV", "J'ai Interstellar ?"] },
  maison: { role: "Home Assistant", status: "online",
    caps: ["Apple TV, Freebox, TV, lave-linge", "Allume, éteint, change de source", "Sait ce qui est allumé"],
    asks: ["Allume la télé de la chambre", "Lance Netflix sur la Freebox"] },
  console: { role: "Claude Code en console", status: "integration",
    caps: ["Délègue une tâche de code à Claude Code", "Vous le regardez travailler dans le terminal", "Vous prévient quand c'est fini"],
    asks: ["Corrige le build d'IchiVol", "Ajoute des tests à 304NotModified"] },
  reseau: { role: "Le réseau de la maison", status: "online",
    caps: ["Balaye et identifie chaque appareil", "Prévient quand un inconnu se connecte", "IP, fabricant, modèle"],
    asks: ["Qui est sur mon réseau ?", "Quelle est l'IP de la Bravia ?"] },
  video: { role: "Lecture et son", status: "online",
    caps: ["Lecture / pause / suivant partout", "Volume et sortie audio", "Mode film : silence et écran allumé"],
    asks: ["Mode film", "Mets le son à 30"] },
  ciel: { role: "Flightline — avions en direct", status: "online",
    caps: ["Avions au-dessus de la maison", "Suit un vol précis", "Globe à l'écran"],
    asks: ["Combien d'avions au-dessus de chez moi ?", "Suis le vol AF1234"] },
  notifs: { role: "Notifications et rappels", status: "online",
    caps: ["Lit les dernières notifications", "Ne pas déranger", "Rappels dans N minutes"],
    asks: ["Lis mes notifications", "Rappelle-moi dans 20 minutes"] },
  notes: { role: "Obsidian", status: "online",
    caps: ["Note du jour horodatée", "Listes : courses, idées…", "Retrouve ce que vous avez noté"],
    asks: ["Note que je dois rappeler le plombier", "Ma liste de courses ?"] },
};

/** Outil MCP (suffixe) → [nœuds allumés, légende]. */
const TOOL_MAP: Record<string, [string[], string]> = {
  weather: [["web"], "Météo"],
  ichivol: [["serveurs"], "Portefeuille IchiVol"],
  deploy: [["serveurs", "github"], "Déploiement"],
  self_overview: [["claude"], "Diagramme du système"],
  capabilities: [["claude"], "Mes capacités"],
  documentary: [["personnages"], "Documentaire"],
  brief: [["notes"], "Notes du brief"],
  WebSearch: [["web"], "Recherche sur internet"],
  WebFetch: [["web"], "Lecture d'une page"],
  open_url: [["navigateur"], "Ouverture du navigateur"],
  search_open: [["navigateur", "web"], "Recherche à l'écran"],
  open_project: [["vscode"], "Ouverture du projet"],
  open_app: [["ecran"], "Ouverture de l'application"],
  window: [["ecran"], "Fenêtres"],
  screen_look: [["ecran"], "Je regarde votre écran"],
  list_apps: [["ecran"], "Applications"],
  omarchy: [["ecran"], "Bureau Omarchy"],
  github_status: [["github"], "État GitHub"],
  project_brief: [["vscode", "github"], "Brief du projet"],
  vps: [["serveurs"], "Serveur de production"],
  plex_server: [["serveurs", "plex"], "Serveur Plex"],
  system_status: [["serveurs"], "État du PC"],
  network_scan: [["reseau"], "Balayage du réseau"],
  home_overview: [["maison", "reseau"], "Vue de la maison"],
  house_devices: [["maison"], "Consultation de la maison"],
  house_command: [["maison"], "Commande de la maison"],
  house_service: [["maison"], "Commande de la maison"],
  plex_search: [["plex"], "Recherche dans Plex"],
  plex_library: [["plex"], "Bibliothèque Plex"],
  plex_play: [["plex", "video"], "Lancement de la lecture"],
  media: [["video"], "Lecteur"],
  movie_mode: [["video"], "Mode film"],
  volume: [["video"], "Volume"],
  audio: [["video"], "Sortie audio"],
  note_write: [["notes"], "Note dans Obsidian"],
  note_read: [["notes"], "Lecture des notes"],
  note_search: [["notes"], "Recherche dans les notes"],
  persona: [["personnages"], "Changement de personnage"],
  people: [["memoire"], "Mémoire des proches"],
  shell_plugin: [["ciel"], "Plugins du bureau"],
  notifications_read: [["notifs"], "Lecture des notifications"],
  notify: [["notifs"], "Notification"],
  clipboard: [["ecran"], "Presse-papiers"],
  ai_usage: [["claude"], "Consommation IA"],
  // Outils des agents Cindy (Claude Code, Codex, Pi).
  Bash: [["console"], "Commande"],
  BashOutput: [["console"], "Sortie de commande"],
  shell: [["console"], "Commande"],
  exec_command: [["console"], "Commande"],
  Read: [["vscode"], "Lecture d'un fichier"],
  Write: [["vscode"], "Écriture d'un fichier"],
  Edit: [["vscode"], "Modification d'un fichier"],
  MultiEdit: [["vscode"], "Modification d'un fichier"],
  NotebookEdit: [["vscode"], "Modification d'un notebook"],
  apply_patch: [["vscode"], "Modification de fichiers"],
  Grep: [["vscode"], "Recherche dans le code"],
  Glob: [["vscode"], "Recherche de fichiers"],
  LS: [["vscode"], "Liste des fichiers"],
  web_search: [["web"], "Recherche sur internet"],
  Task: [["claude"], "Sous-agent"],
  Agent: [["claude"], "Sous-agent"],
  TodoWrite: [["notes"], "Liste de tâches"],
  update_plan: [["notes"], "Plan"],
};

export function toolNodes(name: string, detail: string): { ids: string[]; caption: string } {
  const short = name.split("__").pop() || name;
  if (short === "search_open" && /youtube/i.test(detail))
    return { ids: ["youtube"], caption: `YouTube · ${detail.replace(/youtube\s*·?\s*/i, "")}` };
  if (short === "shell_plugin" && !/flightline/i.test(detail)) return { ids: ["notifs"], caption: "Bureau Omarchy" };
  if (short.startsWith("browser_") || short.startsWith("playwright")) return { ids: ["navigateur"], caption: "Claude pilote le navigateur" };
  const hit = TOOL_MAP[short];
  if (!hit) return { ids: ["claude"], caption: short };
  return { ids: hit[0], caption: detail ? `${hit[1]} · ${detail}` : hit[1] };
}
