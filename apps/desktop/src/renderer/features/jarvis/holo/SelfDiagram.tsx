"use client";

/**
 * Diagramme vivant de JARVIS sur le NUC (données de l'outil self_overview).
 * Il se construit sous les yeux : le cadre de la machine, la chaîne vocale
 * (réveil → écoute → cerveau → voix → orbe), le moyeu d'outils, puis ce qui
 * est branché autour. Les flux circulent ; chaque nœud porte son état réel.
 */
import { Mic, Ear, AudioLines, Brain, Volume2, CircleDot, Wrench, Monitor, House, Film, Network, Plane, Github, NotebookPen, type LucideIcon } from "lucide-react";

const CYAN = "#59ebff", BLUE = "#3861f2", VIOLET = "#7a2eeb", MAGENTA = "#c13fe0", ORANGE = "#ff941f", GREEN = "#34d399", RED = "#f2246b";
const MONO = "ui-monospace, monospace";

type N = { id: string; x: number; y: number; label: string; sub?: string; Icon: LucideIcon; color: string; ok?: boolean | null; big?: boolean };

export default function SelfDiagram({ d }: { d: any }) {
  const m = d.machine || {}, v = d.voix || {}, a = d.autour || {}, o = d.outils || {};
  const svc = (name: string) => (d.services || []).find((s: any) => s.nom === name)?.actif;
  const chain: N[] = [
    { id: "mic", x: 52, y: 92, label: "MICRO", sub: "caméra LG", Icon: Mic, color: CYAN, ok: true },
    { id: "wake", x: 158, y: 92, label: "RÉVEIL", sub: "« Hey Jarvis »", Icon: Ear, color: BLUE, ok: true },
    { id: "stt", x: 264, y: 92, label: "ÉCOUTE", sub: "Scribe", Icon: AudioLines, color: VIOLET, ok: true },
    { id: "brain", x: 384, y: 92, label: "CERVEAU", sub: String(v.cerveau || "Claude").replace("Claude Agent SDK · ", ""), Icon: Brain, color: MAGENTA, ok: svc("jarvis-core"), big: true },
    { id: "tts", x: 504, y: 92, label: "VOIX", sub: v.persona && v.persona !== "Jarvis" ? v.persona : "ElevenLabs", Icon: Volume2, color: ORANGE, ok: true },
    { id: "orb", x: 600, y: 92, label: "ORBE", sub: "Quickshell", Icon: CircleDot, color: CYAN, ok: svc("quickshell") },
  ];
  const world: N[] = [
    { id: "desk", x: 60, y: 368, label: "BUREAU", sub: "Hyprland", Icon: Monitor, color: CYAN, ok: true },
    { id: "ha", x: 148, y: 368, label: "MAISON", sub: "Home Assistant", Icon: House, color: ORANGE, ok: a.home_assistant },
    { id: "plex", x: 236, y: 368, label: "PLEX", sub: a.proliant ? `ProLiant ${a.proliant}` : "ProLiant", Icon: Film, color: ORANGE, ok: a.plex },
    { id: "net", x: 324, y: 368, label: "RÉSEAU", sub: `${a.appareils_reseau ?? "?"} appareils`, Icon: Network, color: BLUE, ok: true },
    { id: "sky", x: 412, y: 368, label: "CIEL", sub: a.avions != null ? `${a.avions} avions` : "Flightline", Icon: Plane, color: BLUE, ok: a.avions != null },
    { id: "gh", x: 500, y: 368, label: "GITHUB", sub: "projets", Icon: Github, color: VIOLET, ok: true },
    { id: "notes", x: 588, y: 368, label: "NOTES", sub: "Obsidian", Icon: NotebookPen, color: GREEN, ok: true },
  ];
  const hub = { x: 384, y: 214 };
  let step = 0;
  const delay = () => `${0.35 + (step++) * 0.16}s`;

  const node = (n: N) => {
    const r = n.big ? 30 : 22, col = n.ok === false ? RED : n.color;
    return (
      <g key={n.id} style={{ animation: `sdPop .5s cubic-bezier(.2,.9,.3,1.3) ${delay()} both`, transformOrigin: `${n.x}px ${n.y}px` }}>
        <circle cx={n.x} cy={n.y} r={r + 7} fill="none" stroke={col} strokeOpacity={0.25} strokeDasharray="2 5"
          style={{ transformOrigin: `${n.x}px ${n.y}px`, animation: "sdSpin 14s linear infinite" }} />
        <circle cx={n.x} cy={n.y} r={r} fill="rgba(6,10,22,.9)" stroke={col} strokeWidth={1.4} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
        <foreignObject x={n.x - 11 - (n.big ? 4 : 0)} y={n.y - 11 - (n.big ? 4 : 0)} width={n.big ? 30 : 22} height={n.big ? 30 : 22}>
          <n.Icon size={n.big ? 30 : 22} color={col} strokeWidth={1.6} />
        </foreignObject>
        <circle cx={n.x + r * 0.72} cy={n.y - r * 0.72} r={3.6} fill={n.ok === false ? RED : n.ok == null ? "#546a7d" : GREEN}
          style={{ filter: n.ok ? `drop-shadow(0 0 4px ${GREEN})` : "none" }} />
        <text x={n.x} y={n.y + r + 15} textAnchor="middle" fontFamily={MONO} fontSize={9} letterSpacing="0.16em" fill={col}>{n.label}</text>
        {n.sub && <text x={n.x} y={n.y + r + 27} textAnchor="middle" fontSize={9} fill="rgba(230,243,250,.6)">{n.sub.length > 18 ? n.sub.slice(0, 17) + "…" : n.sub}</text>}
      </g>
    );
  };
  const flow = (x1: number, y1: number, x2: number, y2: number, col: string, key: string, curve = false) => {
    const dpath = curve ? `M${x1} ${y1} C${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`;
    return (
      <g key={key} style={{ animation: `sdFade .6s ease-out ${delay()} both` }}>
        <path d={dpath} stroke={col} strokeOpacity={0.22} strokeWidth={1.2} fill="none" />
        <path d={dpath} stroke={col} strokeWidth={1.6} fill="none" strokeDasharray="4 14" style={{ animation: "sdFlow 1.2s linear infinite", filter: `drop-shadow(0 0 3px ${col})` }} />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 650 440" style={{ width: "100%", display: "block" }}>
      {/* le NUC : cadre de la machine */}
      <g style={{ animation: "sdFade .8s ease-out .05s both" }}>
        <rect x={10} y={22} width={630} height={262} rx={10} fill="rgba(89,235,255,.025)" stroke={CYAN} strokeOpacity={0.35} strokeDasharray="6 6" />
        <text x={22} y={16} fontFamily={MONO} fontSize={9.5} letterSpacing="0.2em" fill={CYAN}>
          {`${String(m.hote || "jarvis").toUpperCase()} · ${m.modele || "NUC"} · ${m.ram_go ?? "?"} GO`}</text>
        <text x={630} y={16} textAnchor="end" fontFamily={MONO} fontSize={9.5} letterSpacing="0.14em" fill="rgba(230,243,250,.55)">
          {`${String(m.os || "Omarchy").replace(/-\d+$/, "")} · HYPRLAND ${m.hyprland || ""}`}</text>
      </g>
      {/* chaîne vocale */}
      {chain.slice(1).map((n, i) => flow(chain[i].x + (chain[i].big ? 30 : 22), chain[i].y, n.x - (n.big ? 30 : 22), n.y, n.color, `c${i}`))}
      {chain.map(node)}
      {/* moyeu d'outils */}
      {flow(hub.x, chain[3].y + 30, hub.x, hub.y - 24, MAGENTA, "h")}
      <g style={{ animation: `sdPop .5s cubic-bezier(.2,.9,.3,1.3) ${delay()} both`, transformOrigin: `${hub.x}px ${hub.y}px` }}>
        <rect x={hub.x - 62} y={hub.y - 24} width={124} height={48} rx={8} fill="rgba(6,10,22,.92)" stroke={MAGENTA} strokeWidth={1.3} style={{ filter: `drop-shadow(0 0 10px ${MAGENTA})` }} />
        <foreignObject x={hub.x - 52} y={hub.y - 11} width={22} height={22}><Wrench size={20} color={MAGENTA} /></foreignObject>
        <text x={hub.x - 24} y={hub.y - 2} fontSize={20} fontWeight={300} fill="#fff">{o.total ?? "—"}</text>
        <text x={hub.x - 24} y={hub.y + 13} fontFamily={MONO} fontSize={8.5} letterSpacing="0.18em" fill={MAGENTA}>OUTILS MCP</text>
      </g>
      {/* services de la machine */}
      {(d.services || []).slice(0, 4).map((s: any, i: number) => (
        <g key={s.nom} style={{ animation: `sdFade .5s ease-out ${delay()} both` }}>
          <circle cx={28} cy={196 + i * 20} r={3.5} fill={s.actif ? GREEN : "#546a7d"} />
          <text x={38} y={199 + i * 20} fontFamily={MONO} fontSize={9.5} fill={s.actif ? "rgba(230,243,250,.85)" : "rgba(230,243,250,.4)"}>{s.nom}</text>
        </g>
      ))}
      <text x={22} y={180} fontFamily={MONO} fontSize={8.5} letterSpacing="0.2em" fill="rgba(89,235,255,.6)" style={{ animation: "sdFade .5s ease-out .3s both" }}>SERVICES</text>
      {/* charge en direct */}
      <g style={{ animation: "sdFade .5s ease-out .5s both" }}>
        <text x={628} y={190} textAnchor="end" fontFamily={MONO} fontSize={8.5} letterSpacing="0.2em" fill="rgba(89,235,255,.6)">CHARGE</text>
        <text x={628} y={212} textAnchor="end" fontSize={18} fontWeight={300} fill="#fff">{m.cpu_pct != null ? `${Math.round(m.cpu_pct)}% CPU` : ""}</text>
        <text x={628} y={230} textAnchor="end" fontSize={11} fill="rgba(230,243,250,.6)">{m.ram_pct != null ? `${Math.round(m.ram_pct)}% mémoire · ${String(m.cpu || "").replace(/\(R\)|\(TM\)|Intel| CPU|@.*$/g, "").trim()}` : ""}</text>
        <text x={628} y={246} textAnchor="end" fontSize={11} fill="rgba(230,243,250,.6)">{m.allume_depuis_h != null ? `allumé depuis ${m.allume_depuis_h} h` : ""}</text>
      </g>
      {/* le monde autour */}
      {world.map((n, i) => flow(hub.x, hub.y + 24, n.x, n.y - 22, n.color, `w${i}`, true))}
      {world.map(node)}
      <style>{`
        @keyframes sdPop { from { opacity: 0; transform: scale(.3) } }
        @keyframes sdFade { from { opacity: 0 } }
        @keyframes sdFlow { to { stroke-dashoffset: -36 } }
        @keyframes sdSpin { to { transform: rotate(360deg) } }
      `}</style>
    </svg>
  );
}
