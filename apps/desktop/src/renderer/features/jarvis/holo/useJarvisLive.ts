/**
 * Flux en direct de Jarvis, version Cindy.
 *
 * L'interface d'origine écoutait le Core Python sur un WebSocket. Ici, la même
 * forme de données est tirée d'une session Cindy (makerChatStore) :
 *
 *   state   idle | listening | thinking | speaking  ← agentStatus + message en cours
 *   said    dernier message de la personne ou réponse de l'agent (en flux)
 *   tool    un outil vient d'être appelé (tool_use)
 *   result  son résultat (tool_result)
 *
 * sys / env / media restent vides pour l'instant : ils venaient du Core.
 * Expose aussi un faux AnalyserNode : l'orbe JARVIS (JarvisOrb) lit un
 * spectre ; on lui synthétise un spectre crédible à partir de l'état.
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { makerChatStore, type ChatMessage } from "@/lib/makerChatStore";
import type { Sys, Env } from "./SystemHud";

export type LiveState = "idle" | "listening" | "thinking" | "speaking";
export type ToolEvent = { n: number; name: string; detail: string };
export type ToolResult = { n: number; name: string; text: string };
export type Media = { n: number; kind: string; [k: string]: unknown };

const NOOP_UNSUBSCRIBE = () => {};
const NO_MESSAGES: ChatMessage[] = [];

/** Une ligne lisible à partir de l'entrée d'un outil (commande, fichier, requête…). */
function toolDetail(input: unknown): string {
  if (!input || typeof input !== "object") return typeof input === "string" ? input.slice(0, 120) : "";
  const o = input as Record<string, unknown>;
  for (const k of ["description", "command", "query", "url", "file_path", "path", "pattern", "prompt"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim().split("\n")[0].slice(0, 120);
  }
  return "";
}

export function useJarvisLive(sessionId: string | null) {
  const snapshot = useSyncExternalStore(
    (cb) => (sessionId ? makerChatStore.subscribe(sessionId, cb) : NOOP_UNSUBSCRIBE),
    () => (sessionId ? makerChatStore.getSnapshot(sessionId) : null),
    () => (sessionId ? makerChatStore.getSnapshot(sessionId) : null),
  );
  // Comme useCCAgentChat : la session est « vue », donc suivie en direct par le store.
  useEffect(() => {
    if (!sessionId) return;
    const dispose = makerChatStore.enterView(sessionId);
    makerChatStore.ensureInitialMessages(sessionId);
    return dispose;
  }, [sessionId]);
  const messages = snapshot?.messages ?? NO_MESSAGES;
  const running = !!snapshot?.agentStatus?.isRunning;
  const last = messages[messages.length - 1];
  const state: LiveState = !running ? "idle"
    : last?.role === "assistant" && last.isStreaming ? "speaking"
    : "thinking";

  const [tool, setTool] = useState<ToolEvent | null>(null);
  const [said, setSaid] = useState<{ role: string; text: string; who?: string; quiet?: boolean } | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [sys] = useState<Sys | null>(null);
  const [env] = useState<Env | null>(null);
  const [media] = useState<Media | null>(null);
  const level = useRef(0);
  const n = useRef(0);
  const seen = useRef<{ sessionId: string | null; keys: Set<string>; toolNames: Map<string, string>; answer: string }>(
    { sessionId: null, keys: new Set(), toolNames: new Map(), answer: "" },
  );

  // Rejoue les nouveaux messages de la session sous forme d'événements Jarvis.
  // La page Jarvis crée toujours une session neuve : tout son contenu est rejoué.
  useEffect(() => {
    const s = seen.current;
    if (s.sessionId !== sessionId) { s.sessionId = sessionId; s.keys = new Set(); s.toolNames = new Map(); s.answer = ""; }
    let answer: string | null = null;
    messages.forEach((m, i) => {
      const key = m.clientId || m.id || `${i}`;
      if (m.role === "tool_use" && m.toolUseId && m.toolName) s.toolNames.set(m.toolUseId, m.toolName);
      if (m.role === "assistant" && m.content.trim()) answer = m.content;
      if (s.keys.has(key)) return;
      s.keys.add(key);
      if (m.role === "user") { setSaid({ role: "user", text: m.content }); s.answer = ""; answer = null; }
      else if (m.role === "tool_use") setTool({ n: ++n.current, name: m.toolName ?? "outil", detail: toolDetail(m.toolInput) });
      else if (m.role === "tool_result") {
        const name = (m.toolUseId && s.toolNames.get(m.toolUseId)) || "outil";
        setResult({ n: ++n.current, name, text: m.content });
      }
    });
    if (answer !== null && answer !== s.answer) { s.answer = answer; setSaid({ role: "assistant", text: answer }); }
  }, [sessionId, messages]);

  // Faux AnalyserNode pour JarvisOrb : l'orbe vit toujours — respiration au
  // repos, frémissement en écoute, agitation en réflexion, voix en parole.
  const stateRef = useRef<LiveState>("idle");
  stateRef.current = state;
  // Énergie 0..1 de l'orbe shader : la voix réelle, sinon respiration + battements.
  const energy = useMemo(() => () => {
    const t = performance.now() / 1000;
    const st = stateRef.current;
    const wobble = (a: number, f: number) => a * (0.5 + 0.5 * Math.sin(t * f) * Math.sin(t * f * 0.37 + 1.3));
    const beat = (period: number, amp: number) => ((t % period) < 0.13 ? amp : 0);
    const base =
      st === "speaking" ? 0.3 + wobble(0.12, 5.3)
      : st === "thinking" ? 0.35 + wobble(0.2, 3.1) + beat(0.9, 0.25)
      : st === "listening" ? 0.25 + wobble(0.12, 2.2) + beat(1.4, 0.25)
      : 0.12 + wobble(0.1, 0.9) + beat(2.4, 0.3);
    return Math.min(1, Math.max(level.current * 1.3, base));
  }, []);

  const analyser = useMemo(() => ({
    frequencyBinCount: 128,
    getByteFrequencyData(arr: Uint8Array) {
      const t = performance.now() / 1000;
      const st = stateRef.current;
      const wobble = (a: number, f: number) => a * (0.5 + 0.5 * Math.sin(t * f) * Math.sin(t * f * 0.37 + 1.3));
      // Battement : une impulsion brève déclenche une onde à la surface de l'orbe.
      const beat = (period: number, amp: number) => ((t % period) < 0.13 ? amp : 0);
      // Orbe JSX : au repos une sphère lisse qui respire (pas d'étoile),
      // l'agitation monte avec l'état ; la vraie voix prend le dessus.
      const base =
        st === "speaking" ? 0.18 + wobble(0.1, 5.3)
        : st === "thinking" ? 0.1 + wobble(0.08, 3.1) + 0.03 * Math.random() + beat(1.1, 0.16)
        : st === "listening" ? 0.1 + wobble(0.08, 2.2) + beat(1.6, 0.18)
        : 0.03 + wobble(0.04, 0.9) + beat(2.8, 0.14);
      const v = Math.min(1, Math.max(level.current * 1.3, base));
      for (let i = 0; i < arr.length; i++) {
        const f = i / arr.length;
        const shape = Math.exp(-f * 2.6) * (0.75 + 0.25 * Math.sin(t * 9 + i * 0.7));
        arr[i] = Math.max(0, Math.min(255, Math.round(255 * v * shape * 1.4)));
      }
    },
  }), []);

  return { state, level, tool, said, analyser, energy, sys, env, result, media };
}
