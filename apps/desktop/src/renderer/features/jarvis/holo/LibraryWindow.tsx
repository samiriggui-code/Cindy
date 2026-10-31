"use client";

/**
 * Fenêtre Cinéma / Séries : toute la bibliothèque Plex en affiches (relais du
 * Core, le jeton reste côté Core). Badges : « vu » pour un film, épisodes non
 * vus pour une série. Affiches chargées à la demande (défilement).
 */
import { useState } from "react";
import Poster from "./Poster";

type Item = { key: string; title: string; year?: number; seasons?: number; unwatched?: number; watched?: boolean };

export default function LibraryWindow({ section, items }: { section: string; items: Item[] }) {
  const [q, setQ] = useState("");
  const shown = q ? items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase())) : items;
  const accent = section === "Séries" ? "#c13fe0" : "#ff941f";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.25em", color: accent, fontFamily: "ui-monospace, monospace" }}>
          {items.length} {section === "Séries" ? "SÉRIES" : "FILMS"}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…"
          style={{ marginLeft: "auto", background: "rgba(255,255,255,.06)", border: `1px solid ${accent}44`, borderRadius: 6,
            color: "#fff", padding: "4px 10px", fontSize: 12, outline: "none", width: 200 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 14 }}>
        {shown.map((it, i) => (
          <div key={it.key} style={{ animation: `lbIn .4s ease-out ${Math.min(i, 24) * 0.025}s both` }}>
            <div style={{ position: "relative", aspectRatio: "2 / 3", borderRadius: 7, overflow: "hidden",
              border: `1px solid ${accent}33`, boxShadow: "0 8px 22px rgba(0,0,0,.55)" }}>
              <Poster k={it.key} title={it.title} />
              {it.watched && <span style={badge("#34d399")}>VU</span>}
              {it.unwatched ? <span style={badge(accent)}>{it.unwatched} NON VUS</span> : null}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.85)", marginTop: 5, lineHeight: 1.25, height: 28, overflow: "hidden" }}>{it.title}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontFamily: "ui-monospace, monospace" }}>
              {it.year ?? ""}{it.seasons ? ` · ${it.seasons} saison${it.seasons > 1 ? "s" : ""}` : ""}</div>
          </div>
        ))}
      </div>
      <style>{`@keyframes lbIn{from{opacity:0;transform:translateY(8px)}}`}</style>
    </div>
  );
}

const badge = (c: string): React.CSSProperties => ({
  position: "absolute", top: 6, right: 6, padding: "2px 6px", borderRadius: 4, fontSize: 8.5, fontWeight: 700,
  letterSpacing: ".08em", background: `${c}dd`, color: "#06101c",
});
