"use client";

/**
 * HUD système (haut droite) + journal d'activité (bas gauche).
 *
 * Données poussées par le Core (pont WebSocket) :
 *   {t:"sys", cpu, cores[], mem, mem_total, temp, rx, tx, disk, load, uptime, top:{name,cpu}}  /2 s
 *   {t:"env", plex, ha, server:{power,temp}, devices, planes, model, voice}                        /30 s
 * Même langage visuel que le panneau OVERVIEW : filaments cyan, mono, lueurs.
 */
import { loc } from "./locale";
import { useEffect, useRef, useState } from "react";

const CYAN = "#59ebff", ORANGE = "#ff941f", BLUE = "#6b8cff", MAGENTA = "#c13fe0";
const N = 60; // 2 minutes d'historique

export type Sys = {
  cpu: number; cores: number[]; mem: number; mem_total: number; temp: number | null;
  rx: number; tx: number; disk: number; load: number; uptime: number; top: { name: string; cpu: number } | null;
};
export type Env = {
  plex?: boolean; ha?: boolean; server?: { power?: string; temp?: number | null } | null;
  devices?: number; planes?: number | null; model?: string;
  voice?: { used?: number | null; limit?: number | null; reset?: number | null } | null;
  claude?: { used: number; budget: number; pct: number } | null;
};

/** Caractères ElevenLabs consommés : « 12,3k / 100k ». */
export const fmtVoice = (v: Env["voice"]) => {
  if (!v || v.used == null) return undefined;
  const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : `${n}`);
  return v.limit ? `${k(v.used)} / ${k(v.limit)}` : k(v.used);
};
export type Activity = { t: number; text: string; color: string };

function Spark({ data, max, color, w = 120, h = 22 }: { data: number[]; max: number; color: string; w?: number; h?: number }) {
  if (data.length < 2) return <svg width={w} height={h} />;
  const pts = data.map((v, i) => `${(i / (N - 1)) * w},${h - (Math.min(v, max) / max) * (h - 2) - 1}`).join(" ");
  const off = (N - data.length) / (N - 1) * w;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <g transform={`translate(${off},0)`}>
        <polyline points={`0,${h} ${pts} ${((data.length - 1) / (N - 1)) * w},${h}`} fill={`${color}22`} stroke="none" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </g>
    </svg>
  );
}

const fmtRate = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} Mo/s` : b > 1e3 ? `${(b / 1e3).toFixed(0)} ko/s` : `${b | 0} o/s`);
const fmtUp = (s: number) => { const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); return d ? `${d}j ${h}h` : `${h}h ${m.toString().padStart(2, "0")}`; };

function Row({ label, value, color, children }: { label: string; value: string; color: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "58px 1fr 92px", alignItems: "center", gap: 10, height: 26 }}>
      <span style={{ fontSize: 9.5, letterSpacing: "0.2em", color: `${color}cc` }}>{label}</span>
      <div>{children}</div>
      <span style={{ fontSize: 12, textAlign: "right", color: "#e6f3fa", textShadow: `0 0 10px ${color}55` }}>{value}</span>
    </div>
  );
}

function Dot({ ok, label, value }: { ok: boolean | undefined; label: string; value?: string }) {
  const c = ok === undefined ? "#546a7d" : ok ? "#34d399" : "#f43f5e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, letterSpacing: "0.14em" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}` }} />
      <span style={{ color: "rgba(230,243,250,0.6)" }}>{label}</span>
      {value && <span style={{ color: "#e6f3fa" }}>{value}</span>}
    </div>
  );
}

export function SystemHud({ sys, env }: { sys: Sys | null; env: Env | null }) {
  const hist = useRef<{ cpu: number[]; mem: number[]; rx: number[]; tx: number[]; temp: number[] }>({ cpu: [], mem: [], rx: [], tx: [], temp: [] });
  const [, force] = useState(0);
  useEffect(() => {
    if (!sys) return;
    const h = hist.current;
    const push = (a: number[], v: number) => { a.push(v); if (a.length > N) a.shift(); };
    push(h.cpu, sys.cpu); push(h.mem, (sys.mem / sys.mem_total) * 100); push(h.rx, sys.rx); push(h.tx, sys.tx);
    if (sys.temp != null) push(h.temp, sys.temp);
    force((x) => x + 1);
  }, [sys]);
  if (!sys) return null;
  const h = hist.current;
  const netMax = Math.max(50_000, ...h.rx, ...h.tx);
  return (
    <div style={{
      position: "absolute", top: 18, right: "clamp(16px,2.4vw,40px)", zIndex: 30, width: 330,
      fontFamily: "var(--font-mono)", color: "#e6f3fa", pointerEvents: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.32em", color: CYAN }}>SYSTÈME</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${CYAN}aa, transparent)`, boxShadow: `0 0 8px ${CYAN}` }} />
        <span style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(230,243,250,0.45)" }}>UP {fmtUp(sys.uptime)}</span>
      </div>
      <Row label="CPU" value={`${sys.cpu.toFixed(0)} %`} color={CYAN}><Spark data={h.cpu} max={100} color={CYAN} /></Row>
      <div style={{ display: "flex", gap: 3, margin: "0 0 6px 68px" }}>
        {sys.cores.map((c, i) => (
          <div key={i} style={{ width: 8, height: 14, background: "rgba(89,235,255,0.08)", position: "relative", borderRadius: 1 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min(100, c)}%`, background: c > 80 ? ORANGE : CYAN, boxShadow: `0 0 6px ${c > 80 ? ORANGE : CYAN}` }} />
          </div>
        ))}
        <span style={{ fontSize: 9, color: "rgba(230,243,250,0.45)", marginLeft: 6 }}>charge {sys.load.toFixed(2)}</span>
      </div>
      <Row label="MÉM" value={`${(sys.mem / 2 ** 30).toFixed(1)} / ${(sys.mem_total / 2 ** 30).toFixed(0)} Go`} color={MAGENTA}><Spark data={h.mem} max={100} color={MAGENTA} /></Row>
      <Row label="TEMP" value={sys.temp != null ? `${sys.temp.toFixed(0)} °C` : "—"} color={ORANGE}><Spark data={h.temp} max={100} color={ORANGE} /></Row>
      <Row label="RÉS ↓" value={fmtRate(sys.rx)} color={BLUE}><Spark data={h.rx} max={netMax} color={BLUE} /></Row>
      <Row label="RÉS ↑" value={fmtRate(sys.tx)} color={BLUE}><Spark data={h.tx} max={netMax} color={BLUE} /></Row>
      <Row label="DISQUE" value={`${sys.disk.toFixed(0)} %`} color={CYAN}>
        <div style={{ height: 4, background: "rgba(89,235,255,0.1)", width: 120 }}>
          <div style={{ height: 4, width: `${sys.disk * 1.2}px`, background: sys.disk > 85 ? ORANGE : CYAN, boxShadow: `0 0 6px ${CYAN}` }} />
        </div>
      </Row>
      {sys.top && (
        <div style={{ fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(230,243,250,0.5)", margin: "4px 0 10px" }}>
          PROCESSUS ▸ <span style={{ color: "#e6f3fa" }}>{sys.top.name}</span> <span style={{ color: ORANGE }}>{sys.top.cpu.toFixed(0)} %</span>
        </div>
      )}
      {env && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 12px", paddingTop: 10, borderTop: "1px solid rgba(89,235,255,0.15)" }}>
          <Dot ok={env.plex} label="PLEX" />
          <Dot ok={env.ha} label="MAISON" />
          <Dot ok={env.server?.power ? env.server.power === "On" : undefined} label="SERVEUR"
               value={env.server?.temp != null ? `${env.server.temp} °C` : undefined} />
          <Dot ok={env.devices ? true : undefined} label="RÉSEAU" value={env.devices ? `${env.devices} app.` : undefined} />
          <Dot ok={env.planes != null ? true : undefined} label="CIEL" value={env.planes != null ? `${env.planes} avions` : undefined} />
          <Dot ok={true} label="CERVEAU" value={(env.model || "").replace("claude-", "").replace(/-\d+-\d+$/, "")} />
          <Dot ok={env.voice ? (env.voice.limit ? (env.voice.used ?? 0) < env.voice.limit * 0.9 : true) : undefined}
               label="VOIX" value={fmtVoice(env.voice)} />
        </div>
      )}
    </div>
  );
}

export function ActivityLog({ items }: { items: Activity[] }) {
  return (
    <div style={{
      position: "absolute", left: "clamp(16px,2.4vw,40px)", bottom: 24, zIndex: 30, width: 360,
      fontFamily: "var(--font-mono)", pointerEvents: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.32em", color: CYAN }}>ACTIVITÉ</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${CYAN}aa, transparent)` }} />
      </div>
      {items.slice(-6).map((a, i, arr) => (
        <div key={a.t + i} style={{
          display: "flex", gap: 10, fontSize: 11, lineHeight: "20px",
          opacity: 0.35 + 0.65 * ((i + 1) / arr.length), animation: "actIn .4s ease-out",
        }}>
          <span style={{ color: "rgba(230,243,250,0.4)" }}>{new Date(a.t).toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span style={{ color: a.color, textShadow: `0 0 8px ${a.color}66`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</span>
        </div>
      ))}
      <style>{`@keyframes actIn{from{opacity:0;transform:translateX(-8px)}}`}</style>
    </div>
  );
}
