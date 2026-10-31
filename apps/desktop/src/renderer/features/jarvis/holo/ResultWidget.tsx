"use client";

/**
 * Widgets de résultats (à la ChatGPT Live) : le résultat brut d'un outil JARVIS
 * mis en forme selon l'outil — films trouvés, appareils du réseau, avions,
 * serveur… Repli : extrait de texte propre.
 */
import Poster from "./Poster";
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Droplets, Wind } from "lucide-react";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function tryJson(t: string): any {
  try { return JSON.parse(t); } catch { return null; }
}

function Big({ value, unit, color }: { value: string | number; unit: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 40, fontWeight: 200, color, textShadow: `0 0 18px ${color}88`, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>{unit}</span>
    </div>
  );
}

function Rows({ rows, color }: { rows: [string, string?][]; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 190, overflow: "hidden" }}>
      {rows.slice(0, 8).map(([a, b], i) => (
        <div key={i} style={{ display: "flex", gap: 10, fontSize: 11.5, lineHeight: "18px", animation: `rwIn .35s ease-out ${i * 0.05}s both` }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, marginTop: 7, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{a}</span>
          {b && <span style={{ color: `${color}cc`, fontFamily: MONO, fontSize: 10.5, whiteSpace: "nowrap" }}>{b}</span>}
        </div>
      ))}
      {rows.length > 8 && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: MONO }}>+ {rows.length - 8} autres</div>}
    </div>
  );
}

export default function ResultWidget({ name, text, color }: { name: string; text: string; color: string }) {
  const tool = name.split("__").pop() || name;
  const j = tryJson(text);

  if (tool === "weather" && j?.jours) {
    const icon = (c: string) => /orage/.test(c) ? CloudLightning : /neige/.test(c) ? CloudSnow : /averse|pluie/.test(c) ? CloudRain
      : /bruine/.test(c) ? CloudDrizzle : /brouillard/.test(c) ? CloudFog : /couvert/.test(c) ? Cloud : /partiel|plutôt/.test(c) ? CloudSun : Sun;
    return (
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.25em", color: `${color}bb`, fontFamily: MONO, marginBottom: 8 }}>{String(j.lieu).toUpperCase()}</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(j.jours.length, 4)}, 1fr)`, gap: 8 }}>
          {j.jours.slice(0, 4).map((d: any, i: number) => {
            const Ic = icon(String(d.ciel));
            return (
              <div key={d.date} style={{ padding: "8px 6px", borderRadius: 8, background: `${color}10`, border: `1px solid ${color}30`,
                textAlign: "center", animation: `rwIn .4s ease-out ${i * 0.08}s both` }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(255,255,255,.6)", textTransform: "uppercase" }}>{d.jour}</div>
                <Ic size={30} color={color} style={{ margin: "6px auto", filter: `drop-shadow(0 0 6px ${color})` }} />
                <div style={{ fontSize: 15, color: "#fff" }}>{d.max}°<span style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}> / {d.min}°</span></div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.65)", marginTop: 3 }}>{d.ciel}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 9.5, color: `${color}cc`, marginTop: 4, fontFamily: MONO }}>
                  <span><Droplets size={10} /> {d["pluie_%"]}%</span><span><Wind size={10} /> {d.vent_kmh}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (tool === "plex_search" && Array.isArray(j)) {
    if (!j.length) return <Muted>Aucun titre trouvé.</Muted>;
    // Nouveau format : objets {label, key} → affiches ; ancien : simples titres.
    if (typeof j[0] === "string") return <Rows rows={j.map((t: string) => [t])} color={color} />;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {j.slice(0, 6).map((it: any, i: number) => (
          <div key={it.key} style={{ animation: `rwIn .4s ease-out ${i * 0.07}s both` }}>
            <div style={{ aspectRatio: "2 / 3", borderRadius: 6, overflow: "hidden", border: `1px solid ${color}44`, boxShadow: `0 6px 18px rgba(0,0,0,.5)` }}>
              <Poster k={String(it.key)} title={String(it.label)} />
            </div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.75)", marginTop: 4, lineHeight: 1.2, height: 23, overflow: "hidden" }}>{it.label}</div>
          </div>
        ))}
      </div>
    );
  }
  if (tool === "network_scan") {
    const lines = text.split("\n").filter(Boolean);
    const head = lines[0] || "";
    const n = /(\d+) appareils/.exec(head)?.[1];
    const rows = lines.slice(1).map((l) => { const p = l.split(" · "); return [p[1] && p[1] !== "?" ? p[1] : p[0], p[0]] as [string, string]; });
    return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{n && <Big value={n} unit="appareils" color={color} />}<Rows rows={rows} color={color} /></div>;
  }
  if (tool === "shell_plugin" && j && typeof j === "object" && "overhead" in j) {
    return <Big value={j.overhead} unit={`avions · ${j.overheadRadiusNm ?? 100} nm`} color={color} />;
  }
  if (tool === "plex_server" && j && typeof j === "object") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Big value={j["alimentation"] === "On" ? "EN LIGNE" : String(j["alimentation"] ?? "?")} unit={String(j["santé"] ?? "")} color={color} />
        <Rows rows={(j["températures"] || []).slice(0, 5).map((t: string) => { const m = /^(.*) (\d+°C)$/.exec(t); return m ? [m[1], m[2]] : [t]; })} color={color} />
      </div>
    );
  }
  if (tool === "house_devices" && j?.appareils) {
    return <Rows rows={j.appareils.map((d: any) => [d["nom"] || d.id, d["état"]])} color={color} />;
  }
  if (tool === "github_status" && j) {
    const prs = j.pr || j.pr_ouvertes || [];
    return <Rows rows={prs.map((p: any) => [p.title, `#${p.number}`])} color={color} />;
  }
  if (tool === "ai_usage" || tool === "notifications_read" || tool === "note_search") {
    return <Rows rows={text.split("\n").filter(Boolean).map((l) => [l])} color={color} />;
  }
  if (tool === "screen_look") return <Muted>Capture analysée.</Muted>;
  const clean = text.replace(/[{}\[\]"]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? <Muted>{clean.length > 260 ? clean.slice(0, 260) + "…" : clean}</Muted> : null;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{children}</div>;
}
