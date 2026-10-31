"use client";

/**
 * Fenêtre média de l'interface : une demande « agrandie ».
 *   youtube  → lecteur YouTube intégré
 *   flights  → carte des avions en direct (globe.adsb.lol) centrée sur la maison
 *   plex     → lecteur vidéo (flux HLS du transcodeur Plex via le relais du Core)
 *   camera   → flux en direct de la caméra du salon (LG posée sur la TV)
 */
import { useEffect, useRef, useState } from "react";
import type { Media } from "./useJarvisLive";
import Poster from "./Poster";
import FlightMap from "./FlightMap";

const RELAY = "http://127.0.0.1:8767";
const tell = (m: string) => (window as any).webkit?.messageHandlers?.jarvis?.postMessage(m);

function PlexPlayer({ media }: { media: Media }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (media.demo || !ref.current) return;
    const v = ref.current, src = `${RELAY}/plex/stream/${media.key}`;
    let hls: { destroy: () => void } | null = null;
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = src; v.play().catch(() => {}); }
    else import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) return;
      const h = new Hls(); h.loadSource(src); h.attachMedia(v); hls = h;
      h.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
    });
    return () => hls?.destroy();
  }, [media]);
  if (media.demo) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
        <div style={{ position: "absolute", inset: 0, filter: "blur(18px) brightness(.55)", transform: "scale(1.2)" }}><Poster k={String(media.key)} title={String(media.title)} /></div>
        <div style={{ position: "absolute", left: 24, bottom: 22, display: "flex", gap: 16, alignItems: "flex-end" }}>
          <div style={{ width: 92, height: 138 }}><Poster k={String(media.key)} title={String(media.title)} /></div>
          <div><div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#ff941f" }}>LECTURE · DÉMO</div>
            <div style={{ fontSize: 18, color: "#fff", marginTop: 4 }}>{String(media.title)}</div>
            <div style={{ height: 3, width: 260, background: "rgba(255,255,255,.15)", marginTop: 12 }}><div style={{ height: 3, width: "37%", background: "#ff941f", animation: "mwProg 30s linear infinite" }} /></div></div>
        </div>
      </div>
    );
  }
  return <video ref={ref} controls autoPlay playsInline style={{ width: "100%", height: "100%", background: "#000" }} />;
}

function Camera() {
  const ref = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => { stream = s; if (ref.current) { ref.current.srcObject = s; ref.current.play().catch(() => {}); } })
      .catch((e) => setErr(String(e?.message || e)));
    return () => stream?.getTracks().forEach((t) => t.stop());   // la caméra s'éteint à la fermeture
  }, []);
  return err ? <div style={{ padding: 20, color: "#f43f5e", fontSize: 13 }}>Caméra indisponible : {err}</div>
    : <video ref={ref} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000", transform: "scaleX(-1)" }} />;
}

/** Contenu seul (sans cadre) : la scène le place dans une de ses fenêtres. */
export function MediaBody({ media }: { media: Media }) {
  // La surcouche reste affichée tant qu'il y a des panneaux : c'est JarvisHolo qui gère hold/release.
  useEffect(() => () => tell("media:off"), []);
  if (media.kind === "youtube" && media.src) return <video src={`${RELAY}${media.src}`} autoPlay controls playsInline
    // Pendant la lecture, Jarvis n'écoute que « Hey Jarvis » (sinon il prend le son de la vidéo pour une demande).
    onPlay={() => tell("media:on")} onPause={() => tell("media:off")}
    onEnded={() => { tell("media:off"); tell("say:▸ La vidéo est terminée."); }}
    style={{ width: "100%", height: "100%", background: "#000", display: "block" }} />;
  if (media.kind === "youtube") return <iframe title="YouTube" allow="autoplay; encrypted-media; fullscreen"
    src={`https://www.youtube-nocookie.com/embed/${media.id}?autoplay=1&rel=0&modestbranding=1${media.demo ? "&mute=1" : ""}`}
    style={{ width: "100%", height: "100%", border: 0, display: "block" }} />;
  if (media.kind === "flights") return <FlightMap />;
  if (media.kind === "plex") return <PlexPlayer media={media} />;
  if (media.kind === "camera") return <Camera />;
  return null;
}
