"use client";

/**
 * Décor de l'interface : l'image principale de l'article Wikipédia du thème
 * (libre, sans clé, choisie par les rédacteurs) remplace le bleu, teintée et assombrie pour la
 * lisibilité, avec un lent zoom de cinéma. Fondu enchaîné à chaque changement.
 * `query` vide → décor JARVIS (rien).
 */
import { useEffect, useState } from "react";

type Layer = { url: string; id: number };

// Garde-fou : jamais d'image dont le titre ou le fichier évoque de la nudité
// (l'interface sert aussi aux enfants).
const BLOCK = /\b(nud|naked|nue?s?\b|nudit|sex|erot|porn|topless|breast|lingerie|bikini|corps nu)/i;

/** Image principale de l'article Wikipédia du sujet : choisie par les
 *  rédacteurs, pertinente et sûre (la recherche libre dans la médiathèque
 *  Wikimedia renvoyait n'importe quoi, y compris de la nudité). */
export async function findImage(q: string): Promise<string | null> {
  const api = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({
    action: "query", generator: "search", gsrsearch: q, gsrlimit: "3", prop: "pageimages",
    piprop: "thumbnail|name", pithumbsize: "1920", format: "json", origin: "*",
  });
  const d = await (await fetch(api)).json();
  const pages = (Object.values(d?.query?.pages ?? {}) as any[]).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const t = p.thumbnail;
    if (!t?.source || BLOCK.test(`${p.title} ${p.pageimage ?? ""}`)) continue;
    if (t.width >= 900 && t.width / t.height >= 0.95) return t.source;
  }
  return null;
}

export default function AmbianceBg({ query, color }: { query: string; color: string }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  useEffect(() => {
    let live = true;
    if (!query) { setLayers((l) => l.map((x) => ({ ...x, url: "" }))); return; }
    findImage(query).then((url) => {
      if (!live || !url) return;
      const img = new Image();
      img.onload = () => live && setLayers((l) => [...l.slice(-1), { url, id: Date.now() }]);
      img.src = url;
    }).catch(() => {});
    return () => { live = false; };
  }, [query]);
  const tint = color || "#0d2236";
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {layers.map((l, i) => (
        <div key={l.id} style={{
          position: "absolute", inset: "-4%", backgroundImage: l.url ? `url("${l.url}")` : "none", backgroundSize: "cover",
          backgroundPosition: "center", opacity: l.url && i === layers.length - 1 ? 1 : 0, transition: "opacity 1.8s ease",
          animation: "ambZoom 40s ease-in-out infinite alternate",
        }} />
      ))}
      {/* teinte du thème + assombrissement radial : l'orbe et les panneaux restent lisibles */}
      <div style={{ position: "absolute", inset: 0, transition: "background 1.5s",
        background: query ? `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(4,8,16,0.55) 0%, rgba(4,8,16,0.82) 100%), linear-gradient(${tint}55, ${tint}22)` : "transparent",
        mixBlendMode: "normal" }} />
      <style>{`@keyframes ambZoom{from{transform:scale(1)}to{transform:scale(1.12) translate(-1.5%,-1%)}}`}</style>
    </div>
  );
}
