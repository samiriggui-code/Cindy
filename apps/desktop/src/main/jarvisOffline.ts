/**
 * Jarvis offline mode: the desktop app runs fully self-hosted, without any
 * vendor cloud (auth, model gateway, relay, telemetry, auto-update, remote
 * endpoint manifest).
 *
 * On by default. Set `JARVIS_CLOUD=1` to restore the upstream cloud behaviour.
 */
export function isJarvisOffline(): boolean {
  return process.env.JARVIS_CLOUD !== '1';
}

/**
 * Endpoint manifest used in offline mode: every service URL is blank, which
 * the manifest schema parses to `''` and which consumers treat as "disabled".
 */
export function buildJarvisOfflineManifestText(region: string): string {
  return JSON.stringify({ schemaVersion: 1, region });
}
