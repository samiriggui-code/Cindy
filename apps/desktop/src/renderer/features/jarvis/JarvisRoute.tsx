/**
 * Page Jarvis : l'interface holographique (portée depuis jarvis-omarchy) branchée
 * sur une session Cindy. La session est créée au premier message, avec le
 * modèle choisi sur la page « Nouvelle tâche », puis réutilisée tant que la
 * page reste ouverte.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCCSessions } from '@/hooks/useCCSessions';
import { makerChatStore } from '@/lib/makerChatStore';
import { getDraft } from '@/state/newMakerDraft';
import type { Session } from '@/lib/ccAgent.types';
import { dbToMakerAgentKind, normalizeDbAgentKind } from '../../../shared/agentKindConversion';

const JarvisHolo = lazy(() => import('./holo/JarvisHolo'));

const CYAN = '#59ebff';

export function JarvisRoute() {
  const navigate = useNavigate();
  const { createSession } = useCCSessions();
  const [session, setSession] = useState<Session | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Jarvis est l'accueil de l'app : seuls les Paramètres restent accessibles.
  const openSettings = useCallback(() => navigate('/settings'), [navigate]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const ensureSession = useCallback(async (): Promise<Session | null> => {
    if (session) return session;
    const draft = getDraft();
    const agentKind = normalizeDbAgentKind(draft.vendor);
    const prefs = draft.lastByVendor[draft.vendor];
    const created = await createSession({
      agentKind,
      model: prefs?.model,
      effort: prefs?.effort,
      permissionMode: prefs?.permissionMode,
      workspaceKind: 'dialogue',
      providerId: prefs?.providerId ?? null,
    });
    if (!created) return null;
    makerChatStore.setSessionRuntime(created.id, {
      agentKind: dbToMakerAgentKind(agentKind),
      fastMode: false,
      planModeEnabled: false,
      remoteHostId: null,
    });
    setSession(created);
    return created;
  }, [createSession, session]);

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || pending) return;
    setPending(true);
    setError(null);
    try {
      const s = await ensureSession();
      if (!s || !s.workingDir) { setError('Impossible de créer la tâche Jarvis.'); return; }
      setText('');
      const accepted = await makerChatStore.sendMessage(s.id, message, s.model, s.effort, s.permissionMode, s.workingDir);
      if (!accepted) setError("Le message n'a pas été accepté.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [ensureSession, pending, text]);

  const stop = useCallback(() => {
    if (session) void makerChatStore.stopSession(session.id);
  }, [session]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#04070d', color: '#f0ede8', overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <JarvisHolo sessionId={session?.id ?? null} onOrb={stop} onSettings={openSettings} />
      </Suspense>
      <form onSubmit={submit} style={{ position: 'absolute', left: '50%', bottom: 36, transform: 'translateX(-50%)', zIndex: 70,
        width: 'min(720px, calc(100vw - 32px))', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 6px 18px',
        borderRadius: 26, background: 'rgba(6,10,22,.78)', border: `1px solid ${CYAN}44`, backdropFilter: 'blur(14px)',
        boxShadow: `0 0 30px ${CYAN}18` }}>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} disabled={pending}
          placeholder="Demandez à Jarvis…" aria-label="Demande à Jarvis"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#f0ede8', fontSize: 16 }} />
        <button type="submit" disabled={pending || !text.trim()}
          style={{ padding: '9px 18px', borderRadius: 20, border: `1px solid ${CYAN}66`, background: `${CYAN}1a`, color: CYAN,
            fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer',
            opacity: pending || !text.trim() ? 0.5 : 1 }}>ENVOYER</button>
      </form>
      {error && (
        <div role="alert" style={{ position: 'absolute', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 70,
          padding: '6px 14px', borderRadius: 14, background: 'rgba(242,36,107,.16)', border: '1px solid rgba(242,36,107,.5)',
          color: '#ffd5e3', fontSize: 13 }}>{error}</div>
      )}
    </div>
  );
}
