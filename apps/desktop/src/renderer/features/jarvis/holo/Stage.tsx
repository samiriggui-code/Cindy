"use client";

/**
 * Metteur en scène des fenêtres JARVIS.
 *
 * Règles (voulues par l'utilisateur) :
 *   - l'orbe centrale (la « bouche » de Jarvis) reste TOUJOURS dégagée : les
 *     fenêtres vivent dans quatre zones autour d'elle — colonnes gauche et
 *     droite, bandeaux haut et bas ;
 *   - chaque fenêtre ENTRE inclinée en perspective (venue du centre), se pose
 *     À PLAT, puis rejoint sa zone ;
 *   - dans une colonne, les fenêtres s'empilent comme Time Machine : la plus
 *     récente devant, les précédentes reculent (profondeur, hauteur, flou) ;
 *   - dans un bandeau, elles se rangent côte à côte (affiches, tuiles), puis
 *     s'empilent quand la rangée est pleine.
 * La scène est vidée à chaque nouvelle demande (géré par l'appelant).
 */
import { useEffect, useRef, useState } from "react";

export type Zone = "L" | "R" | "T" | "B";
export type PanelSpec = {
  id: string;
  zone: Zone;
  width: number;          // px à 1080p (mis à l'échelle)
  color: string;
  title?: string;
  subtitle?: string;
  body: React.ReactNode;
  delay?: number;         // ms avant l'entrée (révélation progressive)
  flat?: boolean;         // sans inclinaison 3D (diagrammes, schémas : rendu net)
};

function Corners({ color }: { color: string }) {
  const c = (s: React.CSSProperties) => <span style={{ position: "absolute", width: 14, height: 14, borderColor: color, borderStyle: "solid", ...s }} />;
  return <>{c({ top: -1, left: -1, borderWidth: "2px 0 0 2px" })}{c({ top: -1, right: -1, borderWidth: "2px 2px 0 0" })}
    {c({ bottom: -1, left: -1, borderWidth: "0 0 2px 2px" })}{c({ bottom: -1, right: -1, borderWidth: "0 2px 2px 0" })}</>;
}

/** Une fenêtre : 3 phases — arrivée (inclinée, depuis le centre), à plat, rangée. */
function Panel({ p, base, stack, center, k, w, maxH }: {
  p: PanelSpec; base: { left: number; top: number; anchorY: "center" | "top" | "bottom" };
  stack: number; center: { x: number; y: number }; k: number; w: number; maxH: number;
}) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    // Monté au moment de son apparition (le metteur en scène gère le délai).
    const t0 = setTimeout(() => setPhase(1), 30);
    const t1 = setTimeout(() => setPhase(2), 1100);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, []);
  const side = p.zone === "L" ? 1 : p.zone === "R" ? -1 : 0;
  const ty = base.anchorY === "center" ? "-50%" : base.anchorY === "bottom" ? "-100%" : "0%";
  // Phase 0 : au centre, petite, très inclinée. Phase 1 : à sa place, encore
  // inclinée vers l'orbe. Phase 2 : à plat, puis rangée dans la pile.
  const dx = center.x - (base.left + w / 2), dy = center.y - base.top;
  const tilt = side ? side * 32 : 0, tiltX = p.zone === "T" ? -26 : p.zone === "B" ? 26 : 0;
  // Au premier plan, une fenêtre posée repasse en 2D : WebKit redessine alors son contenu
  // à la vraie taille (sinon il garde la texture rendue petite et inclinée → flou).
  const transform = p.flat
    ? (phase === 0 ? `translateY(${ty}) scale(.97)` : stack ? `translateY(${ty}) translateY(${-stack * 54}px) scale(${1 - stack * 0.05})` : `translateY(${ty})`)
    : phase === 0 ? `translate(${dx}px, calc(${ty} + ${dy}px)) scale(.25) rotateY(${tilt * 1.6}deg) rotateX(${tiltX * 1.4}deg)`
    : phase === 1 ? `translateY(${ty}) rotateY(${tilt}deg) rotateX(${tiltX}deg)`
    : stack ? `translateY(${ty}) translateZ(${-stack * 130}px) translateY(${-stack * (p.zone === "B" ? -26 : 54)}px) scale(${1 - stack * 0.05})`
    : `translateY(${ty})`;
  return (
    <div style={{
      position: "absolute", left: base.left, top: base.top, width: w, maxHeight: maxH, display: "flex", flexDirection: "column",
      zIndex: 50 - stack, transform,
      transformOrigin: side === 1 ? "0% 50%" : side === -1 ? "100% 50%" : "50% 50%",
      opacity: phase === 0 ? 0 : Math.max(0, 1 - stack * 0.24),
      filter: stack ? `blur(${stack * 0.7}px) saturate(${1 - stack * 0.12})` : "none",
      transition: "transform .95s cubic-bezier(.2,.85,.25,1), opacity .7s, filter .7s",
      background: `linear-gradient(160deg, ${p.color}16 0%, rgba(6,10,22,0.88) 38%, rgba(6,10,22,0.94) 100%)`,
      border: `1px solid ${p.color}44`, boxShadow: `0 0 44px ${p.color}26, 0 18px 50px rgba(0,0,0,.55), inset 0 0 30px ${p.color}0d`,
      backdropFilter: "blur(14px)", color: "#e6f3fa", fontFamily: "system-ui, sans-serif", pointerEvents: "auto",
    }}>
      <Corners color={p.color} />
      {p.title && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "10px 14px 8px", borderBottom: `1px solid ${p.color}22` }}>
          <span style={{ fontSize: 11 * Math.max(.85, k), fontWeight: 700, letterSpacing: "0.18em", color: p.color, textTransform: "uppercase" }}>{p.title}</span>
          {p.subtitle && <span style={{ fontSize: 10.5, color: "rgba(255,255,255,.5)" }}>{p.subtitle}</span>}
        </div>
      )}
      <div style={{ padding: p.title ? "10px 14px 12px" : 0, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>{p.body}</div>
    </div>
  );
}

export default function Stage({ panels, W, H, cx, cy, k, orbR, shiftL = 0 }: {
  panels: PanelSpec[]; W: number; H: number; cx: number; cy: number; k: number; orbR: number;
  shiftL?: number;   // la colonne gauche descend (fenêtre de notes épinglée en haut à gauche)
}) {
  // Révélation progressive : une fenêtre n'existe (et ne pousse les autres
  // dans la pile) qu'à partir de son heure d'entrée.
  const born = useRef(new Map<string, number>());
  const [, tick] = useState(0);
  const t = Date.now();
  for (const id of [...born.current.keys()]) if (!panels.some((p) => p.id === id)) born.current.delete(id);
  panels.forEach((p) => { if (!born.current.has(p.id)) born.current.set(p.id, t + (p.delay ?? 0)); });
  const pending = panels.some((p) => (born.current.get(p.id) ?? 0) > t);
  useEffect(() => {
    if (!pending) return;
    const i = setInterval(() => tick((x) => x + 1), 200);
    return () => clearInterval(i);
  }, [pending, panels]);
  panels = panels.filter((p) => (born.current.get(p.id) ?? 0) <= t);
  const margin = 36 * k;
  const colW = Math.max(300, cx - orbR - 2 * margin);
  // L'orbe et le texte du haut ne sont JAMAIS couverts : rien au-dessus de l'orbe (« T » passe en bas),
  // colonnes sous le bandeau de titre, bandeau du bas sous l'orbe ; chaque fenêtre est bornée en hauteur.
  panels = panels.map((p) => (p.zone === "T" ? { ...p, zone: "B" as Zone } : p));
  const byZone: Record<Zone, PanelSpec[]> = { L: [], R: [], T: [], B: [] };
  panels.forEach((p) => byZone[p.zone].push(p));
  const ROW_MAX = 7;
  const topSafe = 118 * k, bottomPad = 26 * k, gap = 16 * k;
  const bMax = Math.max(140 * k, H - bottomPad - (cy + orbR + gap));          // le bandeau du bas s'arrête sous l'orbe
  const colBottom = byZone.B.length ? H - bottomPad - bMax - gap : H - margin;
  const colRange = (n: number) => { const top = topSafe + Math.max(0, n - 1) * 54 * k;   // place pour les fenêtres empilées
    return { top, h: Math.max(220 * k, colBottom - top) }; };
  const colY = (n: number) => { const r = colRange(n); return r.top + r.h / 2; };
  const place = (p: PanelSpec): { base: { left: number; top: number; anchorY: "center" | "top" | "bottom" }; stack: number; w: number } => {
    const list = byZone[p.zone], i = list.indexOf(p), n = list.length;
    // Jamais plus large que la colonne : l'orbe reste dégagée.
    const w = p.zone === "L" || p.zone === "R" ? Math.min(p.width * k, colW) : p.width * k;
    if (p.zone === "L") return { base: { left: margin + Math.max(0, (colW - w) / 2), top: colY(n) + shiftL / 2, anchorY: "center" }, stack: n - 1 - i, w };
    if (p.zone === "R") return { base: { left: W - margin - w - Math.max(0, (colW - w) / 2), top: colY(n), anchorY: "center" }, stack: n - 1 - i, w };
    // Bandeaux : côte à côte, puis empilement quand la rangée est pleine.
    const row = Math.floor(i / ROW_MAX), col = i % ROW_MAX, inRow = Math.min(ROW_MAX, n - row * ROW_MAX);
    const lastRow = Math.floor((n - 1) / ROW_MAX), g = 14 * k;
    const bw = Math.min(w, (W - 2 * margin - (inRow - 1) * g) / inRow);       // la rangée tient dans l'écran
    const total = inRow * bw + (inRow - 1) * g, left = cx - total / 2 + col * (bw + g);
    return { base: { left, top: H - bottomPad, anchorY: "bottom" }, stack: lastRow - row, w: bw };
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 12, perspective: 1500, pointerEvents: "none" }}>
      {panels.map((p) => {
        const { base, stack, w } = place(p);
        const maxH = p.zone === "B" ? bMax : colRange(byZone[p.zone].length).h - (p.zone === "L" ? Math.max(0, shiftL) : 0);
        return <Panel key={p.id} p={p} base={base} stack={stack} center={{ x: cx, y: cy }} k={k} w={w} maxH={maxH} />;
      })}
    </div>
  );
}
