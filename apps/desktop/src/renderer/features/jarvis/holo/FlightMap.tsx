"use client";

/**
 * Vols : le vrai globe Flightline (plugin Omarchy). Le Core ouvre le panneau
 * Flightline et en renvoie une capture à chaque appel (/flightline/frame) ;
 * on la rafraîchit en double tampon pour éviter le clignotement.
 */
import { useEffect, useState } from "react";

const RELAY = "http://127.0.0.1:8767";

export default function FlightMap() {
  const [frames, setFrames] = useState<[string, string]>(["", ""]);
  const [front, setFront] = useState(0);
  useEffect(() => {
    let live = true, i = 0;
    const next = () => {
      if (!live) return;
      const url = `${RELAY}/flightline/frame?t=${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        if (!live) return;
        const slot = (i + 1) % 2; i = slot;
        setFrames((f) => { const n: [string, string] = [...f] as [string, string]; n[slot] = url; return n; });
        setFront(slot);
        setTimeout(next, 1500);
      };
      img.onerror = () => setTimeout(next, 3000);
      img.src = url;
    };
    next();
    return () => { live = false; };
  }, []);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#050a14" }}>
      {frames.map((src, k) => src && (
        <img key={k} src={src} alt="Flightline" style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", opacity: k === front ? 1 : 0, transition: "opacity .35s" }} />
      ))}
      {!frames[0] && !frames[1] && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
        fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.3em", color: "#6b8cff" }}>FLIGHTLINE…</div>}
    </div>
  );
}
