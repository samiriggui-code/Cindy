"use client";

/** Affiche Plex via le relais du Core (le jeton reste côté Core) ; démo : affiche générée. */
const RELAY = "http://127.0.0.1:8767";
const HUES = [195, 230, 265, 300, 330, 20];

export default function Poster({ k, title }: { k: string; title: string }) {
  if (k.startsWith("demo")) {
    const h = HUES[(parseInt(k.split(":")[1] || "0", 10) || 0) % HUES.length];
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
        background: `linear-gradient(160deg, hsl(${h} 70% 38%) 0%, hsl(${h + 40} 60% 14%) 70%)` }}>
        <div style={{ position: "absolute", inset: "18% 15% auto", aspectRatio: "1", borderRadius: "50%",
          border: `3px solid hsl(${h} 90% 70% / .7)`, boxShadow: `0 0 24px hsl(${h} 90% 60% / .6)` }} />
        <div style={{ position: "absolute", left: 6, right: 6, bottom: 7, fontSize: 8.5, lineHeight: 1.15, color: "#fff",
          fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", textShadow: "0 1px 4px #000" }}>{title}</div>
      </div>
    );
  }
  return <img src={`${RELAY}/plex/poster/${k}`} alt={title} loading="lazy"
    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}
