"use client";

/**
 * JARVIS · HOLO — l'interface plein écran.
 *
 * Références : le halo de bord d'écran de Siri (Apple Intelligence), les
 * widgets de résultats de ChatGPT/Gemini Live, et le HUD du JARVIS des films
 * (Cantina Creative, Jayse Hansen) où les panneaux flottent sur une sphère
 * invisible autour de lui.
 *
 *   1. Aurore de bord d'écran aux couleurs de l'orbe : s'allume à l'écoute,
 *      vibre avec la voix.
 *   2. Anneau de jauges autour de l'orbe (CPU, mémoire, température, réseau,
 *      disque), graduations qui tournent.
 *   3. Panneaux holographiques en perspective sur une sphère invisible : la
 *      demande en haut, un panneau par outil, avec son RÉSULTAT mis en forme,
 *      empilés en profondeur comme Time Machine (le plus récent devant).
 *   4. Fenêtre média : YouTube, carte des vols, lecteur Plex, caméra.
 *   5. Décor : une image du thème (Wikimedia) remplace le bleu.
 */
import { loc } from "./locale";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Brain, BookUser, Search, Globe, Theater, Monitor, Code2, Github, Server, Play, Film, House, Terminal,
  Network, Clapperboard, Plane, Bell, NotebookPen, Cpu, MemoryStick, Thermometer, Wifi, HardDrive, Sparkles, type LucideIcon,
} from "lucide-react";
import { JARVIS_LIST, JARVIS_INFO, toolNodes } from "./jarvisNodes";
import { useJarvisLive } from "./useJarvisLive";
import { fmtVoice } from "./SystemHud";
import ResultWidget from "./ResultWidget";
import Stage, { type PanelSpec } from "./Stage";
import { buildScene, SCENE_CSS, type Theme } from "./Scenes";
import AmbianceBg from "./AmbianceBg";
import blackHole from "./black-hole.jpg";
import type { Media } from "./useJarvisLive";
import type { Sys, Env } from "./SystemHud";

// Cindy : chargée à part (three.js) pour ne pas alourdir le reste de l'app.
const JarvisOrb = lazy(() => import("./JarvisOrb")) as unknown as React.ComponentType<{
  analyser?: unknown; tempo?: number; sensitivity?: number; background?: string;
}>;

const CYAN = "#59ebff", BLUE = "#3861f2", VIOLET = "#7a2eeb", MAGENTA = "#c13fe0", RED = "#f2246b", ORANGE = "#ff941f";
const STATE_LABEL: Record<string, string> = { idle: "EN VEILLE", listening: "JE VOUS ÉCOUTE", thinking: "JE RÉFLÉCHIS", speaking: "JE RÉPONDS" };
const STATE_COLOR: Record<string, string> = { idle: BLUE, listening: CYAN, thinking: MAGENTA, speaking: ORANGE };
const ICON: Record<string, LucideIcon> = {
  claude: Brain, memoire: BookUser, web: Search, navigateur: Globe, personnages: Theater, ecran: Monitor,
  vscode: Code2, github: Github, serveurs: Server, youtube: Play, plex: Film, maison: House, console: Terminal,
  reseau: Network, video: Clapperboard, ciel: Plane, notifs: Bell, notes: NotebookPen,
};

/** Outils qui composent leur propre scène (pas de fenêtre de résultat brute). */
const SCENE_TOOLS = new Set(["weather", "plex_library", "project_brief", "ichivol", "deploy", "brief", "revision", "quiz", "capabilities", "self_overview", "document", "spreadsheet", "gmail", "agenda", "vps_health", "camera_look", "who_is_there", "face_enroll", "camera_live", "object_focus", "camera_scan", "scan_boxes", "social", "diagram", "project_diagrams", "display", "persona_cards", "password_prompt", "coding_agents", "system_monitor", "docker_view", "security_check", "player", "home_overview", "studio", "project_diagram", "documentary", "youtube_play",
  "flight_map", "plex_play", "camera_show", "ambiance", "persona", "people", "notify"]);

type Card = { id: number; key: string; tool: string; name: string; color: string; detail: string; result?: string; side: "L" | "R" };

/* ── 1. Aurore de bord d'écran ─────────────────────────────────────────── */
function EdgeAurora({ state, energy }: { state: string; energy: () => number }) {
  const ref = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const st = useRef(state); st.current = state;
  useEffect(() => {
    let raf = 0, a = 0, last = performance.now(), smooth = 0;
    const loop = (t: number) => {
      const dt = (t - last) / 1000; last = t;
      const s = st.current, e = energy();
      smooth += (e - smooth) * 0.15;
      a = (a + dt * (s === "thinking" ? 120 : s === "speaking" ? 70 : 35)) % 360;
      const base = s === "idle" ? 0 : s === "thinking" ? 0.55 + 0.25 * Math.sin(t / 260) : 0.6;
      const op = Math.min(1, base + (s === "idle" ? 0 : smooth * 0.8));
      for (const el of [ref.current, glow.current]) {
        if (!el) continue;
        el.style.setProperty("--a", `${a}deg`);
        el.style.opacity = String(op);
      }
      if (glow.current) glow.current.style.filter = `blur(${18 + smooth * 30}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [energy]);
  const ring: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 40, padding: 3, borderRadius: 2,
    background: `conic-gradient(from var(--a, 0deg), ${CYAN}, ${BLUE}, ${VIOLET}, ${MAGENTA}, ${RED}, ${ORANGE}, ${CYAN})`,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor", maskComposite: "exclude", transition: "opacity .4s",
  };
  return <><div ref={glow} style={{ ...ring, padding: 10, opacity: 0 }} /><div ref={ref} style={{ ...ring, opacity: 0 }} /></>;
}

/* ── 2. Anneau de jauges ───────────────────────────────────────────────── */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
  return `M${p0.x} ${p0.y} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
}
function GaugeRing({ cx, cy, R, sys, env, stateColor }: { cx: number; cy: number; R: number; sys: Sys | null; env: Env | null; stateColor: string }) {
  const net = sys ? Math.min(1, Math.log10(1 + (sys.rx + sys.tx) / 1000) / 4) : 0;   // 0 → 10 Mo/s, échelle log
  const gauges = [
    { label: "CPU", Icon: Cpu, v: (sys?.cpu ?? 0) / 100, txt: sys ? `${sys.cpu.toFixed(0)}%` : "—", color: CYAN },
    { label: "MÉMOIRE", Icon: MemoryStick, v: sys ? sys.mem / sys.mem_total : 0, txt: sys ? `${(sys.mem / 2 ** 30).toFixed(1)} Go` : "—", color: VIOLET },
    { label: "TEMPÉRATURE", Icon: Thermometer, v: Math.min(1, (sys?.temp ?? 0) / 100), txt: sys?.temp != null ? `${sys.temp.toFixed(0)}°C` : "—", color: RED },
    { label: "RÉSEAU", Icon: Wifi, v: net, txt: sys ? `${((sys.rx + sys.tx) / 1e6).toFixed(1)} Mo/s` : "—", color: BLUE },
    { label: "DISQUE", Icon: HardDrive, v: (sys?.disk ?? 0) / 100, txt: sys ? `${sys.disk.toFixed(0)}%` : "—", color: ORANGE },
    { label: "CLAUDE", Icon: Sparkles, v: Math.min(1, (env?.claude?.pct ?? 0) / 100), txt: env?.claude ? `${env.claude.pct}% auj.` : "—", color: MAGENTA },
  ];
  const span = 54, gap = 18, start = 180 - (gauges.length * (span + gap) - gap) / 2 + 180;   // centré en bas
  const ticks = Array.from({ length: 120 }, (_, i) => i * 3);
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none", overflow: "visible" }}>
      <defs>
        <filter id="hg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {/* graduations extérieures qui tournent */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "hgSpin 120s linear infinite" }}>
        {ticks.map((d) => {
          const long = d % 30 === 0, p0 = polar(cx, cy, R + 34, d), p1 = polar(cx, cy, R + (long ? 46 : 40), d);
          return <line key={d} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={CYAN} strokeWidth={long ? 1.4 : 0.8} opacity={long ? 0.55 : 0.22} />;
        })}
      </g>
      {/* anneau pointillé intérieur, sens inverse, couleur de l'état */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "hgSpin 70s linear infinite reverse" }}>
        <circle cx={cx} cy={cy} r={R - 26} fill="none" stroke={stateColor} strokeWidth={1} strokeDasharray="2 10" opacity={0.5} style={{ transition: "stroke .6s" }} />
      </g>
      {/* jauges */}
      {gauges.map((g, i) => {
        const a0 = start + i * (span + gap), a1 = a0 + span, av = a0 + span * Math.max(0.02, Math.min(1, g.v));
        const mid = polar(cx, cy, R + 66, a0 + span / 2), right = mid.x >= cx;
        return (
          <g key={g.label}>
            <path d={arc(cx, cy, R, a0, a1)} stroke={g.color} strokeWidth={6} fill="none" opacity={0.12} strokeLinecap="round" />
            <path d={arc(cx, cy, R, a0, av)} stroke={g.color} strokeWidth={6} fill="none" strokeLinecap="round" filter="url(#hg)"
              style={{ transition: "d .8s ease" }} />
            <g transform={`translate(${mid.x + (Math.abs(mid.x - cx) < 40 ? -7 : right ? -22 : 8)},${mid.y - 32})`} opacity={0.9}>
              <g.Icon width={14} height={14} color={g.color} strokeWidth={1.6} />
            </g>
            <text x={mid.x} y={mid.y - 6} textAnchor={Math.abs(mid.x - cx) < 40 ? "middle" : right ? "start" : "end"}
              fontFamily="ui-monospace, monospace" fontSize={9.5} letterSpacing="0.22em" fill={g.color} opacity={0.8}>{g.label}</text>
            <text x={mid.x} y={mid.y + 10} textAnchor={Math.abs(mid.x - cx) < 40 ? "middle" : right ? "start" : "end"}
              fontFamily="ui-monospace, monospace" fontSize={14} fill="#e6f3fa">{g.txt}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 3. Panneaux holographiques ────────────────────────────────────────── */
function Corners({ color }: { color: string }) {
  const c = (s: React.CSSProperties) => <span style={{ position: "absolute", width: 14, height: 14, borderColor: color, borderStyle: "solid", ...s }} />;
  return <>{c({ top: -1, left: -1, borderWidth: "2px 0 0 2px" })}{c({ top: -1, right: -1, borderWidth: "2px 2px 0 0" })}
    {c({ bottom: -1, left: -1, borderWidth: "0 0 2px 2px" })}{c({ bottom: -1, right: -1, borderWidth: "0 2px 2px 0" })}</>;
}
function Holo({ color, children, style }: { color: string; children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <div style={{
      position: "absolute", width: 340, background: `linear-gradient(160deg, ${color}14 0%, rgba(6,10,22,0.86) 40%, rgba(6,10,22,0.92) 100%)`,
      border: `1px solid ${color}40`, boxShadow: `0 0 40px ${color}22, inset 0 0 30px ${color}0d`, backdropFilter: "blur(14px)",
      padding: "14px 16px", color: "#e6f3fa", fontFamily: "system-ui, sans-serif", ...style,
    }}>
      <Corners color={color} />
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.25,
        background: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.03) 3px 4px)" }} />
      {children}
    </div>
  );
}

export default function JarvisHolo({ sessionId, onOrb, onSettings }: {
  sessionId: string | null; onOrb?: () => void; onSettings?: () => void;
}) {
  const live = useJarvisLive(sessionId);
  const st = live.state;
  const [geo, setGeo] = useState({ W: 1920, H: 1080 });
  useEffect(() => { const f = () => setGeo({ W: window.innerWidth, H: window.innerHeight }); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const k = Math.min(geo.W / 1920, geo.H / 1080), cx = geo.W / 2, cy = geo.H * 0.5, R = 270 * k;

  // Heure + météo
  const [now, setNow] = useState<Date | null>(null);
  const [wx, setWx] = useState<{ t: number; city: string } | null>(null);
  useEffect(() => {
    setNow(new Date()); const i = setInterval(() => setNow(new Date()), 15000);
    let alive = true;
    const ok = (r: Response) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); };
    fetch("https://ipapi.co/json/").then(ok).then((g) => {
      if (!Number.isFinite(g?.latitude) || !Number.isFinite(g?.longitude)) return;
      return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m`)
        .then(ok).then((d) => { const t = d?.current?.temperature_2m; if (alive && Number.isFinite(t)) setWx({ t, city: g.city || "" }); });
    }).catch(() => {});
    return () => { alive = false; clearInterval(i); };
  }, []);

  // Demande + réponse
  const [req, setReq] = useState<{ text: string; answer: string } | null>(null);
  useEffect(() => {
    if (!live.said) return;
    // Ce qu'a dit (ou cliqué) la personne s'affiche en haut, sous le titre.
    if (live.said.role === "user") {
      const t = live.said.text, clic = t.match(/« ([^»]+) » — (JUSTE|FAUX)/);
      setHeard({ who: live.said.who || "", text: clic ? `${clic[1]} ${clic[2] === "JUSTE" ? "✅" : "❌"}` : t.startsWith("▸") ? "" : t });
    }
    // Un clic de l'enfant (quiz) revient comme une phrase « ▸ … » : la scène reste.
    if (live.said.role === "user" && live.said.text.startsWith("▸")) return;
    if (live.said.role === "user") {
      // Nouvelle demande : on vide la scène pour rendre la place à l'orbe.
      // …sauf le chantier en cours (Mission Dev) : il reste jusqu'à la fin du travail.
      setReq({ text: live.said.text, answer: "" }); setPanels((ps) => ps.filter((p) => p.id === workRef.current)); setChips([]);
      termRef.current = workRef.current;
      setTheme({ title: "", subtitle: live.said.text, color: CYAN });
    }
    else if (!live.said.quiet) setReq((r) => (r ? { ...r, answer: live.said!.text } : { text: "", answer: live.said!.text }));   // brief : pas de sous-titres
  }, [live.said]);

  // Fenêtre média et décor (messages « media » du Core).
  const [panels, setPanels] = useState<PanelSpec[]>([]);
  const termRef = useRef<string | null>(null);
  const [flash, setFlash] = useState(false);       // retour visuel du clic sur l'orbe
  const workRef = useRef<string | null>(null);   // chantier Mission Dev en cours (fenêtre qui reste)
  const keepRef = useRef(false);                  // scène composée par Jarvis (display, lecteur) : reste jusqu'à la suite
  const [heard, setHeard] = useState<{ who: string; text: string } | null>(null);
  // Fenêtre Obsidian du brief : elle reste à l'écran d'une étape à l'autre.
  // `stack` : une fenêtre par note (brief, projet, sujet), la plus récente en dernier.
  type NoteWin = { title: string; kind: string; file: string; items: string[] };
  const [notes, setNotes] = useState<{ active: boolean; items: string[]; file: string; stack: NoteWin[] } | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [amb, setAmb] = useState<{ query: string; color: string; persona: string }>({ query: "", color: "", persona: "" });
  useEffect(() => {
    const m = live.media;
    if (!m) return;
    if (m.kind === "notes") {
      const items = (m.items as string[]) || [], file = String(m.file || "");
      const stack = Array.isArray(m.stack) ? (m.stack as NoteWin[]) : items.length || m.active ? [{ title: file.replace(/^Jarvis\//, ""), kind: "brief", file, items }] : [];
      setNotes({ active: !!m.active, items, file, stack });
      return;
    }
    if (m.kind === "ambiance") setAmb((a) => ({ query: String(m.query || ""), color: String(m.color || (m.persona === undefined ? a.color : "")),
      persona: m.persona === undefined ? a.persona : String(m.persona || "") }));
    else if (m.kind === "diagram_cmd") window.dispatchEvent(new CustomEvent("jarvis-diagram", { detail: m }));
    else if (m.kind === "player_cmd") window.dispatchEvent(new CustomEvent("jarvis-player", { detail: m }));
    else if (m.kind === "notice") setReq((r) => ({ text: r?.text ?? "", answer: String(m.text || "") }));
    else {
      const sc = buildScene(m);
      if (sc) keepRef.current = m.kind === "display";
      // Mise à jour d'un terminal : seulement s'il est encore à l'écran (on est peut-être passé à la suite).
      if (sc && (m.kind === "terminal" || m.kind === "workflow" || m.kind === "launch_board")) {
        const live = m.kind === "workflow" || m.kind === "launch_board";   // chantier, lancement : la fenêtre reste
        const id = sc.panels[0].id, ids = new Set(sc.panels.map((p) => p.id));
        if (live) workRef.current = m.done ? null : id;
        if (m.start) {
          termRef.current = id; setTheme(sc.theme);
          // chantier : nouvelle scène ; terminal (déploiement) : s'ajoute à la scène en cours (ex. marchés)
          setPanels(live ? sc.panels : (ps) => ps.filter((p) => !ids.has(p.id)).concat(sc.panels));
          return;
        }
        if (termRef.current !== id && !live) return;   // terminal : on est passé à la suite, il continue sans fenêtre
        if (termRef.current !== id) { termRef.current = id; setTheme(sc.theme); }   // chantier : il revient à l'écran
        if (m.done) setTheme(sc.theme);
        if (m.kind === "launch_board") { setTheme(sc.theme); setPanels(sc.panels); return; }   // la scène entière suit (fenêtres ajoutées)
        setPanels((ps) => { const out = ps.map((p) => ids.has(p.id) ? sc.panels.find((q) => q.id === p.id)! : p);
          return out.some((p) => ids.has(p.id)) ? out : out.concat(sc.panels); });
      } else if (sc && m.kind === "password_prompt") {
        // La fenêtre de mot de passe s'ajoute à la scène en cours (elle ne la remplace pas) et se retire quand c'est fini.
        setPanels((ps) => ps.filter((p) => !p.id.startsWith("pw-")).concat(sc.panels));
      } else if (sc && m.kind === "camera_live" && m.done) {
        // Caméra éteinte : le dernier cadre ne reste pas figé à l'écran — la fenêtre se ferme après un instant.
        setTheme({ ...sc.theme, subtitle: sc.theme.subtitle || req?.text }); setPanels(sc.panels);
        setTimeout(() => setPanels((ps) => ps.filter((p) => !p.id.startsWith("live-"))), 2500);
      } else if (sc && m.kind === "display" && m.mode === "add") {          // composants ajoutés à la scène en cours
        const ids = new Set(sc.panels.map((p) => p.id));
        setPanels((ps) => ps.filter((p) => !ids.has(p.id)).concat(sc.panels));
      } else if (sc) { setTheme({ ...sc.theme, subtitle: sc.theme.subtitle || req?.text }); setPanels(sc.panels); }
    }
  }, [live.media]);

  // Outils : une puce dans le bandeau du thème ; le résultat d'un outil
  // sans scène dédiée devient une fenêtre de la scène.
  const [chips, setChips] = useState<{ id: number; tool: string; name: string; color: string; done: boolean }[]>([]);
  const seq = useRef(0);
  useEffect(() => {
    if (!live.tool) return;
    const { ids } = toolNodes(live.tool.name, live.tool.detail);
    const node = JARVIS_LIST.find((x) => x.key === ids[0]);
    if (!node) return;
    setChips((cs) => [...cs, { id: ++seq.current, tool: live.tool!.name, name: node.name, color: node.color, done: false }].slice(-6));
  }, [live.tool]);
  useEffect(() => {
    if (!live.result) return;
    const r = live.result;
    setChips((cs) => cs.map((c) => (c.tool === r.name && !c.done ? { ...c, done: true } : c)));
    if (SCENE_TOOLS.has(r.name.replace(/^mcp__\w+__/, ""))) return;
    const { ids } = toolNodes(r.name, "");
    const node = JARVIS_LIST.find((x) => x.key === ids[0]);
    if (!node || !r.text.trim()) return;
    setPanels((ps) => {
      const side = ps.filter((x) => x.zone === "L").length <= ps.filter((x) => x.zone === "R").length ? "L" : "R";
      return [...ps, { id: `res-${r.n}`, zone: side, width: 440, color: node.color, title: node.name, subtitle: JARVIS_INFO[node.key]?.role,
        body: <ResultWidget name={r.name} text={r.text} color={node.color} /> }];
    });
  }, [live.result]);
  // Sortie de l'interface (mot, raccourci, bouton) : la scène est vidée.
  useEffect(() => {
    const clear = () => { setPanels([]); setChips([]); setReq(null); setTheme(null); termRef.current = null; keepRef.current = false; };
    window.addEventListener("jarvis-close", clear);
    return () => window.removeEventListener("jarvis-close", clear);
  }, []);

  // Des fenêtres à l'écran (quiz, fiche, vidéo…) : l'interface reste affichée.
  useEffect(() => {
    const tell = (m: string) => (window as any).webkit?.messageHandlers?.jarvis?.postMessage(m);
    tell(panels.length ? "hold" : "release");
  }, [panels.length > 0]);

  // Tout s'efface 25 s après la fin de la conversation — sauf avec un personnage
  // (révision en cours : le quiz reste le temps qu'il faut).
  useEffect(() => {
    if (st !== "idle" || amb.persona) return;
    if (workRef.current || keepRef.current) return;   // un chantier tourne, ou une scène composée : elle reste
    const t = setTimeout(() => { setPanels([]); setChips([]); setReq(null); setTheme(null); }, 25000);
    const t2 = setTimeout(() => setAmb((a) => (a.persona ? a : { query: "", color: "", persona: "" })), 60000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [st, amb.persona]);

  const sc = STATE_COLOR[st];
  const busy = panels.length > 0;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", userSelect: "none",
      background: "#04070d" }}>
      {/* Fond par défaut : le trou noir d'Event Horizon (OldJobobo, thème Omarchy),
          assombri pour la lisibilité, lent zoom. Les décors de personnage passent devant. */}
      <div aria-hidden style={{ position: "absolute", inset: "-3%", zIndex: 0, pointerEvents: "none",
        backgroundImage: `url(${blackHole})`, backgroundSize: "cover", backgroundPosition: "center 40%",
        animation: "bhZoom 60s ease-in-out infinite alternate", opacity: amb.query ? 0 : 1, transition: "opacity 1.5s" }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(4,7,13,0.35) 0%, rgba(4,7,13,0.78) 100%)" }} />
      <AmbianceBg query={amb.query} color={amb.color} />
      <EdgeAurora state={st} energy={live.energy} />

      {/* halo d'état derrière l'orbe */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "background .8s",
        background: `radial-gradient(circle at 50% 50%, ${sc}26 0%, transparent ${Math.round(30 * k + 10)}%)` }} />

      {/* jauges : s'effacent quand la scène a des fenêtres */}
      <div style={{ position: "absolute", inset: 0, opacity: busy ? 0.12 : 1, transition: "opacity 1s", pointerEvents: "none" }}>
        <GaugeRing cx={cx} cy={cy} R={R} sys={live.sys} env={live.env} stateColor={sc} />
      </div>

      {/* l'orbe */}
      <div style={{ position: "absolute", left: cx, top: cy, width: 480 * k, height: 480 * k, transform: "translate(-50%,-50%)", zIndex: 2, pointerEvents: "none" }}>
        <Suspense fallback={null}>
          <JarvisOrb analyser={live.analyser} background="transparent"
            tempo={st === "idle" ? 1.0 : st === "thinking" ? 1.3 : 1.15} sensitivity={1.15} />
        </Suspense>
      </div>

      {/* UN CLIC sur l'orbe = stop (parole, réflexion, brief) ; un second clic = reprise du brief */}
      <div role="button" aria-label="Stop / reprise" onClick={() => {
          onOrb?.();
          setFlash(true); setTimeout(() => setFlash(false), 600);
        }}
        style={{ position: "absolute", left: cx, top: cy, width: 330 * k, height: 330 * k, transform: "translate(-50%,-50%)", zIndex: 30,
          borderRadius: "50%", cursor: "pointer", pointerEvents: "auto",
          boxShadow: flash ? `0 0 0 6px ${CYAN}, 0 0 60px ${CYAN}` : "none", transition: "box-shadow .4s" }} />

      {/* état, sous l'orbe dans l'anneau */}
      <div style={{ position: "absolute", left: cx, top: cy + R - 52 * k, transform: "translateX(-50%)", zIndex: 3,
        fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.45em", color: sc, textShadow: `0 0 12px ${sc}`,
        transition: "color .6s", whiteSpace: "nowrap" }}>{STATE_LABEL[st]}</div>

      {/* coin haut gauche : identité, heure, météo */}
      <div style={{ position: "absolute", top: 30, left: 38, zIndex: 5, fontFamily: "ui-monospace, monospace" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.7em", color: amb.color || CYAN, textShadow: `0 0 16px ${amb.color || CYAN}`, transition: "color 1s" }}>
          J.A.R.V.I.S{amb.persona && <span style={{ letterSpacing: "0.2em", marginLeft: 6, opacity: 0.85 }}>· {amb.persona.toUpperCase()}</span>}</div>
        {now && <div style={{ fontSize: 34, fontWeight: 200, color: "#f0ede8", marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
          {now.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" })}</div>}
        {now && <div style={{ fontSize: 10.5, letterSpacing: "0.22em", color: "rgba(240,237,232,0.5)", textTransform: "uppercase", marginTop: 4 }}>
          {now.toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" })}
          {wx && <span style={{ color: CYAN, marginLeft: 12 }}>{Math.round(wx.t)}°C · {wx.city}</span>}</div>}
      </div>

      {/* coin haut droit : la maison */}
      {live.env && (
        <div style={{ position: "absolute", top: 34, right: 40, zIndex: 5, display: "flex", gap: 18, fontFamily: "ui-monospace, monospace",
          fontSize: 10, letterSpacing: "0.2em", color: "rgba(230,243,250,0.6)" }}>
          {([["PLEX", live.env.plex], ["MAISON", live.env.ha], ["SERVEUR", live.env.server?.power === "On"]] as [string, boolean | undefined][])
            .map(([l, ok]) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: ok ? "#34d399" : ok === false ? "#f43f5e" : "#546a7d", boxShadow: ok ? "0 0 8px #34d399" : "none" }} />{l}</span>)}
          {live.env.devices ? <span>{live.env.devices} APPAREILS</span> : null}
          {live.env.planes != null ? <span>{live.env.planes} AVIONS</span> : null}
          {fmtVoice(live.env.voice) ? <span title="Caractères ElevenLabs consommés ce mois">VOIX {fmtVoice(live.env.voice)}</span> : null}
        </div>
      )}

      {/* le thème, annoncé en haut */}
      {(theme || req) && (
        <div key={theme?.title || "req"} style={{ position: "absolute", top: 26 * k, left: "50%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center",
          maxWidth: "52vw", pointerEvents: "none", animation: "thIn .8s cubic-bezier(.2,.9,.3,1) both" }}>
          {theme?.title && <div style={{ fontSize: 30 * Math.max(.8, k), fontWeight: 200, letterSpacing: "0.32em", textTransform: "uppercase", color: "#f0ede8",
            textShadow: `0 0 24px ${theme.color}, 0 0 60px ${theme.color}66` }}>{theme.title}</div>}
          <div style={{ height: 1, margin: "8px auto", width: theme?.title ? "70%" : "40%", background: `linear-gradient(90deg, transparent, ${theme?.color || CYAN}, transparent)` }} />
          <div style={{ fontSize: 13, color: "rgba(230,243,250,.7)", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {theme?.subtitle || req?.text}</div>
          {chips.length > 0 && <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {chips.map((c) => { const Icon = ICON[JARVIS_LIST.find((x) => x.name === c.name)?.key ?? ""] ?? Brain; return (
              <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 12, fontSize: 9.5,
                fontFamily: "ui-monospace, monospace", letterSpacing: ".14em", color: c.color, border: `1px solid ${c.color}55`, background: `${c.color}12`,
                animation: c.done ? "none" : "hoPulse 1s infinite" }}><Icon size={11} /> {c.name.toUpperCase()} {c.done ? "✓" : ""}</span>); })}
          </div>}
        </div>
      )}

      {/* ce que la personne vient de dire ou de cliquer */}
      {heard?.text && (
        <div key={heard.text} style={{ position: "absolute", top: (theme?.title ? 150 : 110) * k, left: "50%", transform: "translateX(-50%)", zIndex: 21,
          maxWidth: "50vw", padding: "8px 18px", borderRadius: 22, background: "rgba(255,111,181,.14)", border: "1px solid rgba(255,111,181,.45)",
          fontSize: 17, color: "#fff", textAlign: "center", animation: "thIn .5s ease-out both", pointerEvents: "none" }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: ".2em", color: "#ff6fb5", marginRight: 10 }}>
            {(heard.who || "VOUS").toUpperCase()} ›</span>{heard.text}</div>
      )}

      {/* la réponse, discrète, sous l'orbe */}
      {req?.answer && !busy && (
        <div style={{ position: "absolute", left: "50%", top: cy + R + 70 * k, transform: "translateX(-50%)", width: "min(760px, 60vw)", zIndex: 6, textAlign: "center",
          fontSize: 15, lineHeight: 1.5, color: "rgba(230,243,250,.82)", textShadow: "0 1px 8px #000", animation: "hoIn .5s" }}>{req.answer}</div>
      )}

      {/* Notes Obsidian en cascade : la plus récente au-dessus, les anciennes décalées, lisibles par leur titre */}
      {notes && notes.stack.map((w, i, all) => {
        const top = i === all.length - 1, depth = all.length - 1 - i, nw = 330 * Math.max(.85, k), HEAD = 30;
        const label = w.kind === "projet" ? "PROJET" : w.kind === "sujet" ? "SUJET" : "NOTES DU BRIEF";
        const live = w.kind === "brief" && notes.active;
        return (
          <div key={w.file} style={{ position: "absolute", left: 38 + i * 12, top: 128 + i * HEAD, width: nw, zIndex: 25 + i, pointerEvents: "none",
            background: "linear-gradient(160deg, rgba(167,139,250,.14), rgba(6,10,22,.94) 45%)", border: "1px solid rgba(167,139,250," + (top ? .45 : .28) + ")",
            boxShadow: top ? "0 0 34px rgba(167,139,250,.22)" : "0 0 14px rgba(167,139,250,.1)", backdropFilter: "blur(12px)",
            padding: "8px 14px " + (top ? 12 : 0) + "px", height: top ? undefined : HEAD, overflow: "hidden", opacity: top ? 1 : Math.max(.55, 1 - depth * .12),
            animation: "hoIn .6s", transition: "top .5s ease, left .5s ease, opacity .5s", fontFamily: "system-ui, sans-serif", color: "#e6f3fa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: ".18em", color: "#a78bfa", whiteSpace: "nowrap" }}>
              <NotebookPen size={13} style={{ flex: "none" }} /> OBSIDIAN · {label}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", letterSpacing: ".04em", color: "rgba(230,243,250,.75)", fontFamily: "system-ui, sans-serif", fontSize: 11 }}>{w.kind === "brief" ? "" : w.title}</span>
              <span style={{ marginLeft: "auto", flex: "none", width: 7, height: 7, borderRadius: "50%", background: live ? "#f2246b" : "#546a7d",
                animation: live ? "hoPulse 1.2s infinite" : "none" }} /></div>
            {top && <>
              <div style={{ fontSize: 9.5, color: "rgba(230,243,250,.4)", margin: "3px 0 8px" }}>{w.file}.md</div>
              {w.items.length === 0 && <div style={{ fontSize: 12, color: "rgba(230,243,250,.5)", fontStyle: "italic" }}>J'écoute et je note ce que vous me demandez…</div>}
              {w.items.slice(-7).map((t, j, arr) => (
                <div key={t} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.4, marginBottom: 4, animation: j === arr.length - 1 ? "rwIn .5s ease-out" : "none" }}>
                  <span style={{ color: "#a78bfa" }}>☐</span><span>{t}</span></div>))}
              {w.items.length > 7 && <div style={{ fontSize: 10, color: "rgba(230,243,250,.4)", fontFamily: "ui-monospace, monospace" }}>+ {w.items.length - 7} plus haut</div>}
            </>}
          </div>);
      })}

      {/* Les Paramètres de Cindy : seule autre page accessible */}
      <button onClick={() => onSettings?.()}
        title="Paramètres"
        style={{ position: "absolute", top: 74, right: 40, zIndex: 60, display: "inline-flex", alignItems: "center", gap: 8,
          padding: "7px 14px", borderRadius: 18, cursor: "pointer", fontFamily: "ui-monospace, monospace", fontSize: 11,
          letterSpacing: ".18em", color: "#e6f3fa", background: "rgba(6,10,22,.7)", border: "1px solid rgba(255,255,255,.25)",
          backdropFilter: "blur(8px)" }}>⚙ PARAMÈTRES</button>

      <Stage panels={panels} W={geo.W} H={geo.H} cx={cx} cy={cy} k={k} orbR={250 * k}
        shiftL={notes && notes.stack.length > 0 ? 70 * k : 0} />

      <style>{`
        @property --a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        @keyframes hgSpin { to { transform: rotate(360deg) } }
        @keyframes bhZoom { from { transform: scale(1) } to { transform: scale(1.08) translate(-1%, 1%) } }
        @keyframes hoIn { from { opacity: 0; filter: blur(6px); } }
        @keyframes hoPulse { 50% { opacity: .3 } }
        @keyframes hoBar { from { transform: translateX(-100%) } to { transform: translateX(250%) } }
        @keyframes rwIn { from { opacity: 0; transform: translateX(-6px) } }
        @keyframes thIn { from { opacity: 0; transform: translate(-50%, -14px); letter-spacing: .6em } }
        ${SCENE_CSS}
      `}</style>
    </div>
  );
}
