# HANDOFF — Cindy → Jarvis

> Pour l'agent qui reprend ce projet (machine Omarchy / Arch Linux).
> Dernière mise à jour : 2026-10-31.

## 1. Objectif

Faire de **Cindy** (client agent IA open source, Apache-2.0, Electron) un **Jarvis** :

- **Garder** le backend Cindy en local : agents, fournisseurs de modèles, paramètres, base SQLite, outils.
- **Déconnecter** Cindy de ses serveurs cloud (auth, passerelle LLM, télémétrie, mises à jour). ✅ Fait.
- **Traduire** l'app : français en premier, anglais en second. ⏳ À faire.
- **Remplacer l'interface principale** par une UI Jarvis (orbe animé, voix, wake word, fenêtres qui s'affichent quand on demande quelque chose). La référence est la **version Omarchy de Jarvis** dans le projet `www` de samir, à recopier ou adapter. ⏳ À faire.

## 2. Règles de travail (samir)

- **Donner des nouvelles en continu.** Une ligne courte en français avant chaque étape et après chaque résultat. Ne jamais enchaîner de longues tâches en silence : samir déteste ça et finit par interrompre.
- Une fois une action approuvée, l'exécuter soi-même (merge, push…) au lieu de renvoyer les commandes.
- Travailler sur une branche, avec une PR. Les changements sont additifs par défaut. **Aucune suppression** (fichier, langue, fonctionnalité) sans l'accord explicite de samir.
- **Aucun secret dans le repo.** Les clés API (OpenRouter, etc.) se saisissent dans l'UI de l'app, où elles sont stockées chiffrées via safeStorage.
- Langues : français principal, anglais secondaire.
- Le quota de samir compte. Pour les gros volumes (traduction), utiliser des sous-agents moins chers (Sonnet) et annoncer le coût avant.

## 3. État git

- Repo : `https://github.com/samiriggui-code/Cindy`, branche principale `main`.
- Branche de travail : **`jarvis/local-mode`**.
  - Commit `be257da780` — `feat(desktop): Jarvis offline mode — run without the Cindy cloud`.
  - Ce `HANDOFF.md` est committé sur la même branche.
- **Pas encore poussé sur GitHub, pas de PR.** Demander à samir avant de pousser.

## 4. Ce qui a été fait : mode hors ligne (étape 1)

Un interrupteur unique se trouve dans [apps/desktop/src/main/jarvisOffline.ts](apps/desktop/src/main/jarvisOffline.ts). Le mode hors ligne est **actif par défaut**, et `JARVIS_CLOUD=1` restaure le comportement d'origine de Cindy.

| Fichier | Changement |
|---|---|
| `apps/desktop/src/main/clientEndpointsService.ts` | `initClientEndpoints()` n'interroge plus le CDN. Il utilise un manifeste interne dont toutes les URL sont vides (`buildJarvisOfflineManifestText`). Une URL vide est parsée en `''`, et chaque service se désactive tout seul (auth, passerelle `model-access`, device-link, hooks IM, plugin market, voix cloud, skillhub…). |
| `apps/desktop/src/main/appSessionState.ts` | `ensureLoaded()` démarre toujours en mode `local` : session sans compte, plus d'écran de login. |
| `apps/desktop/src/main/authManager.ts` | `exitLocalMode()` est un no-op en mode hors ligne. |
| `apps/desktop/src/main/manifestService.ts` | `fetchManifest()` renvoie `null` : aucune vérification de mise à jour. |
| `apps/desktop/src/main/analytics-settings-store.ts` | `isReportingBuild()` renvoie `false` : TapDB est coupé. |
| `apps/desktop/vitest.config.ts` | `env: { JARVIS_CLOUD: '1' }` : les tests upstream gardent la sémantique cloud. |
| `apps/desktop/src/main/__tests__/jarvisOffline.test.ts` | Nouveaux tests du mode hors ligne. |

Le heartbeat, la passerelle LLM Cindy (`model-access`) et le canary flag s'arrêtent déjà d'eux-mêmes hors du mode `cloud`. Il n'a pas fallu y toucher.

**Vérifié sur Windows :**
- 304 tests passent : jarvisOffline, clientEndpointsService, heartbeat, authManager, appSessionState, manifestService, updateService, analytics.
- `pnpm typecheck` ne remonte aucune erreur.
- Lancement réel :
  - Le log affiche `resolved from local manifest file (Jarvis offline): auth= cdn=`.
  - L'app arrive sur `/cc-agent/new` avec « Not signed in ».
  - Aucun appel vers `cindy.com` / `cindy.app`.
- samir a connecté **Anthropic (Claude.ai Max)** et **OpenAI** dans Paramètres → Fournisseurs, et les deux fonctionnent.

## 5. Lancer l'app

```bash
pnpm install                              # ~25 min la 1re fois (Node >= 22.12, pnpm 10)
pnpm dev:desktop --isolated=jarvis        # dev, profil de données isolé
pnpm --filter desktop typecheck
pnpm --filter desktop exec vitest run --project standard <fichiers>
```

- **`--isolated=jarvis` est obligatoire.** Sans lui, le garde-fou `localDb/officialProfileMigrationPolicy.ts` refuse qu'une version dev migre la base du profil « officiel » (`MIGRATE_FAILED`). Avec lui, les données vont dans `<userData>-dev2-jarvis`. Sous Linux, c'est probablement `~/.config/CindyGlobal-dev2-jarvis`.
- **Le 1er lancement est lent** (2 à 3 min). On voit une page blanche, le `renderer-guard` recharge 2 fois, puis « Waking Cindy... » pendant la création de la base. C'est normal : Vite compile des milliers de modules à la volée.
- **Débogage** : le renderer expose CDP sur `127.0.0.1:9222`, et la page principale est `http://localhost:5174/`. On peut lire les erreurs ou faire une capture via le WebSocket CDP.
- Les modules natifs Windows (barre des tâches, capture d'écran) demandent `cargo`. Sans `cargo`, ça fait juste un warning, rien de bloquant.
- `node_modules` **n'a pas été copié** sur la clé USB : relancer `pnpm install`. Les binaires d'agents (Claude Code, Codex, Pi, ripgrep) sont retéléchargés par `scripts/ensure-agent-binaries.mjs`.

## 6. Carte du code (l'essentiel)

- Monorepo pnpm : `apps/desktop` (Electron 42 + React 19 + Vite + Tailwind + SQLite/drizzle), `apps/mobile` (Expo, client distant), `packages/*`. Les règles du repo sont dans `AGENTS.md` et `docs/dev-rules/` (en chinois).
- **Main** : `apps/desktop/src/main/index.ts` → `bootstrap-electron.ts` (fenêtre principale ~l.4005, init des services ~l.9200-9950).
- **Preload** : `src/preload/preload.ts` expose `window.electronAPI` (namespaces `maker`, `voiceConversation`, `voiceInput`…).
- **Renderer** :
  - Chaîne d'entrée : `src/renderer/main-entry.tsx` → `App.tsx` → `router.tsx` (hash router).
  - L'**interface principale** est `/cc-agent/*` (`features/cc-agent/`), dans `components/layout/MainLayout.tsx`. La redirection d'accueil passe par `MainEntryRedirect.tsx` et `lib/mainEntryPreference.ts`.
  - Les **paramètres** sont sur `/settings` (`components/settings/`, ~190 sections) : à garder.
- **Agents / LLM** :
  - Les appels LLM passent par des harness (Claude Code SDK, Codex, Pi) dans `packages/maker-core`, câblés par `src/main/maker-host/`.
  - Envoi : `electronAPI.maker.send(...)` → IPC `maker:send`. Retour : stream sur `maker:event`, réduit dans `renderer/lib/makerChatStore.ts` (types `text`, `tool_use`, `tool_result`).
  - Fournisseurs : catalogue dans `packages/model-providers/catalog/` (OpenRouter, DeepSeek, Gemini, xAI, LM Studio, llama.cpp, vLLM, Ollama…). Les clés sont dans `src/main/secrets/providerSecretStore.ts`.
- **i18n** :
  - `src/renderer/i18n/index.ts` (i18next).
  - Fichiers de traduction : `src/renderer/i18n/locales/{en,zh-CN,zh-TW,ja,ko}/{common,aiRename}.json`.
  - Côté main : `src/main/i18n.ts` (avec `FALLBACK_CHAIN`).
  - Langues supportées : `src/shared/locale.ts` (`SUPPORTED_LOCALES`, `DEFAULT_LOCALE = 'en'`).
  - Contrôles : `pnpm check:i18n` et `pnpm check:i18n-glossary`, avec le glossaire `i18n/glossary.json`.
- **Voix (existant)** :
  - `src/main/voice-input/` : dictée (STT), raccourci global, overlay flottant.
  - `src/main/voice-conversation/` : dialogue vocal bidirectionnel STT ↔ agent ↔ TTS, IPC `voice-conversation:*`. Utilisé dans `renderer/features/bots/voice/`.
  - **Aucun wake word** n'existe.
- **Fenêtres flottantes** (modèle pour les popups Jarvis) : `src/main/voice-input/global.ts` (~l.2264 / 2418 : fenêtres frameless, transparentes, always-on-top, qui chargent `index.html?flag`) et `src/main/resource-usage-window/`.
  - ⚠️ Les IPC `voice-conversation` exigent `assertTrustedAppRendererEvent` (fenêtre top-level de confiance).

## 7. À faire (dans l'ordre proposé)

### 7.1 Traduction FR (prioritaire, demandée par samir)

- Volume : `en/common.json` contient **14 666 chaînes (~570 000 caractères)**, plus `aiRename.json` et `src/main/i18n.ts` (~175 lignes).
- Plan validé dans les grandes lignes :
  1. Ajouter `'fr'` à `SUPPORTED_LOCALES` et mettre `DEFAULT_LOCALE = 'fr'`.
  2. Créer `locales/fr/common.json` + `aiRename.json` et les enregistrer dans `renderer/i18n/index.ts`, y compris l'override `chatgptAuthRecovery.devWriteBlocked`.
  3. Côté main : `resources` et `FALLBACK_CHAIN.fr = ['fr', 'en']`.
  4. Ajouter « Français » dans le sélecteur de langue des paramètres.
  5. Garder les autres langues, sauf accord de samir.
- Traduire **par lots en parallèle (sous-agents Sonnet)** en préservant :
  - les `{{variables}}` ;
  - les balises `<0>…</0>` et le HTML ;
  - les clés de pluriel : le français utilise `_one`, `_many` et `_other` ; prendre `_other` comme base.
  - les noms de marque et les termes du glossaire.
- Valider ensuite avec un script qui compare les clés et les placeholders `en` ↔ `fr`, puis `pnpm check:i18n`.
- samir n'a pas encore tranché entre **tout traduire** et **d'abord l'interface principale + les paramètres** (~30 %) pour économiser le quota. Lui demander.

### 7.2 Fournisseurs

- Masquer ou retirer l'entrée **« Cindy AI (Recommended) »** dans Paramètres → Fournisseurs (passerelle `xd`, inutilisable hors ligne). Demander avant de la supprimer.
- Le modèle par défaut d'une nouvelle session (« GPT-6-Luna ») venait de la passerelle Cindy. Choisir un défaut parmi les fournisseurs connectés (Anthropic / OpenAI), ou OpenRouter si samir fournit une clé **via l'UI**.

### 7.3 Interface Jarvis (étape 2)

- Lire d'abord la **version Omarchy de Jarvis** dans le `www` de samir (UI, orbe, wake word, TTS, fenêtres) pour savoir quoi recopier.
- Point d'insertion propre :
  1. Nouvelle route `jarvis` dans `renderer/router.tsx`, avec ou sans `MainLayout`.
  2. Pointer `MainEntryRedirect` / `mainEntryPreference` dessus.
  3. Garder `/settings`, `/cc-agent` (accessible), `/bots`, etc.
- Envoyer les demandes avec `electronAPI.maker.send` et lire les réponses et outils dans `makerChatStore`.
- Voix : réutiliser la boucle `electronAPI.voiceConversation` (`taskBridge` / `submit-turn`).
- Wake word : à ajouter, par exemple un worker audio à côté de `renderer/voice-input/WebMicAudioEngine.ts`, ou côté main près de `voice-input/speaker/`. Privilégier un moteur local, sans cloud.
- Popups de résultats : copier le motif de fenêtre transparente de `voice-input/global.ts`.

### 7.4 Plus tard

- Donner à Jarvis son **propre dossier userData / nom d'app**, pour se passer de `--isolated=jarvis` et ne jamais entrer en collision avec un Cindy officiel (voir `regionUserData.ts`, `devCliFlags.ts`).
- Les **binaires d'agents** et le **modèle speaker** venaient du CDN Cindy (`cdnBaseUrl`, maintenant vide). En build packagé, il faudra une source locale ou alternative (voir `main/agent-binaries/`, `voice-input/speaker/index.ts`).
- Retirer les hôtes TapDB de la CSP (`main/security/csp.ts`) et les liens légaux Cindy (`shared/legalLinks.ts`).
- Device-link / relais auto-hébergé : `packages/device-link-relay` existe, mais `device-link/index.ts` (~l.728, 1330) exige encore `isAuthenticated`.
- Rebranding (nom, icônes, textes « Cindy »).
