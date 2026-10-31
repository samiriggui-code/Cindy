"use client";

/**
 * Scènes : chaque outil devient une mise en scène — un THÈME annoncé en haut,
 * puis des fenêtres posées autour de l'orbe (Stage), révélées une à une et
 * empilées comme Time Machine à mesure que Jarvis avance.
 */
import { loc } from "./locale";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Media } from "./useJarvisLive";
import type { PanelSpec } from "./Stage";
import { WeatherNow, WeatherWeek, HourlyChart } from "./WeatherWindow";
import LibraryWindow from "./LibraryWindow";
import Poster from "./Poster";
import { HomeTVs, HomeWasher, HomeFreebox, HomeTablets, NetGroup, homeGroups } from "./HomeWindow";
import { MediaBody } from "./MediaWindow";
import SelfDiagram from "./SelfDiagram";
import { findImage } from "./AmbianceBg";

export type Theme = { title: string; subtitle?: string; color: string };
export type Scene = { theme: Theme; panels: PanelSpec[] };

const RELAY = "http://127.0.0.1:8767";
const CYAN = "#59ebff", BLUE = "#6b8cff", MAGENTA = "#c13fe0", ORANGE = "#ff941f", GREEN = "#34d399", VIOLET = "#7a2eeb";
const MONO = "ui-monospace, monospace";
const tx = (s: unknown) => String(s ?? "");

/* ── briques ─────────────────────────────────────────────────────────── */
function Shot({ name, caption, color }: { name: string; caption: string; color: string }) {
  return (
    <div>
      <img src={`${RELAY}/shot/${name}.png`} alt={caption} style={{ width: "100%", display: "block", borderRadius: 4, border: `1px solid ${color}33` }} />
      {caption && <div style={{ fontSize: 12, color: "rgba(230,243,250,.8)", marginTop: 8, lineHeight: 1.4 }}>{caption}</div>}
    </div>
  );
}

/** Chapitre de documentaire : photo Wikipédia (filtrée) + texte. */
function Chapter({ c, color }: { c: any; color: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { if (c.image) findImage(c.image).then(setSrc).catch(() => {}); }, [c.image]);
  return (
    <div>
      <div style={{ aspectRatio: "16 / 10", borderRadius: 4, overflow: "hidden", background: `linear-gradient(135deg, ${color}22, rgba(6,10,22,.9))`, border: `1px solid ${color}33` }}>
        {src && <img src={src} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "scKen 14s ease-out both" }} />}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "rgba(240,237,232,.9)", marginTop: 10 }}>{c.text}</div>
    </div>
  );
}

function Kv({ rows, color }: { rows: [string, string][]; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 12.5 }}>
      {rows.filter(([, v]) => v).map(([k, v]) => <Fragment key={k}><span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", color, paddingTop: 2 }}>{k}</span>
        <span style={{ color: "rgba(230,243,250,.9)" }}>{v}</span></Fragment>)}
    </div>
  );
}

function ProjectCard({ p }: { p: any }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(230,243,250,.7)", lineHeight: 1.45, minHeight: 34 }}>{p.description || (p.fork ? "fork" : "—")}</div>
      <div style={{ display: "flex", gap: 6, margin: "8px 0", flexWrap: "wrap" }}>
        {[p.langage, `push ${p.dernier_push}`].filter(Boolean).map((t: string) => (
          <span key={t} style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 10, border: `1px solid ${CYAN}44`, color: CYAN, fontFamily: MONO }}>{t}</span>))}
      </div>
      {p.dernier_commit && <div style={{ fontSize: 11.5, color: ORANGE, fontFamily: MONO, lineHeight: 1.4 }}>▸ {p.dernier_commit.message}</div>}
    </div>
  );
}

function Terminal({ lines, height = 380 }: { lines: string[]; height?: number }) {
  return (
    <div ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }} style={{ height, overflowY: "auto", background: "#05080c", padding: "10px 12px",
      fontFamily: MONO, fontSize: 11.5, lineHeight: 1.5, color: "#c9f7d6", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
      {lines.map((l, i) => <div key={i} style={{ color: l.startsWith("$") ? CYAN : l.startsWith("✓") ? GREEN : l.startsWith("✗") ? "#f2246b" : undefined }}>{l}</div>)}
      <span style={{ display: "inline-block", width: 8, height: 14, background: "#c9f7d6", animation: "hoPulse 1s infinite", verticalAlign: "middle" }} />
    </div>
  );
}


/* ── marchés (IchiVol) ───────────────────────────────────────────────── */
const eur = (v: number | null | undefined, sign = false) => v == null ? "—" :
  `${sign && v > 0 ? "+" : ""}${v.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const pnlCol = (v: number | null | undefined) => (v ?? 0) > 0 ? GREEN : (v ?? 0) < 0 ? "#f2246b" : "rgba(230,243,250,.6)";
const px = (v: number | null | undefined) => v == null ? "?" : Number(v).toLocaleString(loc(), { maximumSignificantDigits: Math.abs(v) >= 1000 ? 7 : 5 });
const MKT_COL: Record<string, string> = { Crypto: ORANGE, Forex: BLUE, "Métaux": "#f5c542", Indices: CYAN, "Énergie": MAGENTA, Autre: VIOLET };

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (!pts || pts.length < 2) return null;
  const lo = Math.min(...pts), hi = Math.max(...pts), W = 300, H = 54;
  const d = pts.map((v, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * W} ${H - ((v - lo) / (hi - lo || 1)) * (H - 6) - 3}`).join(" ");
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 54, display: "block", marginTop: 8 }}>
    <path d={`${d} L${W} ${H} L0 ${H}Z`} fill={`${color}22`} /><path d={d} stroke={color} strokeWidth={1.6} fill="none" style={{ filter: `drop-shadow(0 0 4px ${color})` }} /></svg>;
}

function Account({ p }: { p: any }) {
  const c = p.compte || {}, st = p.stats || {};
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 30, fontWeight: 200 }}>{eur(c.equity)}</span>
        <span style={{ fontSize: 14, color: pnlCol(c.total_pnl), fontFamily: MONO }}>{eur(c.total_pnl, true)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8, fontSize: 11, fontFamily: MONO, color: "rgba(230,243,250,.7)" }}>
        <span>réalisé<br /><b style={{ color: pnlCol(c.realized_pnl), fontWeight: 400 }}>{eur(c.realized_pnl, true)}</b></span>
        <span>latent<br /><b style={{ color: pnlCol(c.unrealized_pnl), fontWeight: 400 }}>{eur(c.unrealized_pnl, true)}</b></span>
        <span>aujourd'hui<br /><b style={{ color: pnlCol(c.day_change), fontWeight: 400 }}>{eur(c.day_change, true)}</b></span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(230,243,250,.55)", marginTop: 8 }}>
        {st.trades_clotures} trades clôturés{st.taux_reussite != null ? ` · ${st.taux_reussite} % gagnants` : ""} · {c.open_positions} ouverte{c.open_positions > 1 ? "s" : ""} · drawdown max {st.drawdown_max_pct ?? 0} %</div>
      <Spark pts={p.courbe} color={pnlCol(c.total_pnl) === GREEN ? GREEN : CYAN} />
    </div>
  );
}

function Position({ o }: { o: any }) {
  const col = MKT_COL[o.marche] || CYAN, lo = Math.min(o.stop, o.objectif), hi = Math.max(o.stop, o.objectif);
  const at = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100))}%`;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${col}22`, border: `1px solid ${col}66`, color: col, fontFamily: MONO }}>{o.marche}</span>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontFamily: MONO, color: o.sens === "LONG" ? GREEN : "#f2246b", border: `1px solid ${o.sens === "LONG" ? GREEN : "#f2246b"}66` }}>{o.sens === "LONG" ? "▲ ACHAT" : "▼ VENTE"}</span>
        <span style={{ fontSize: 10, color: "rgba(230,243,250,.45)", fontFamily: MONO }}>{o.tf}</span>
        <span style={{ marginLeft: "auto", fontSize: 18, color: pnlCol(o.pnl), fontFamily: MONO }}>{eur(o.pnl, true)}</span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(230,243,250,.6)", margin: "8px 0 4px", fontFamily: MONO }}>entrée {px(o.entree)} → {px(o.cours)} · {eur(o.montant)} engagés · {o.pnl_pct > 0 ? "+" : ""}{o.pnl_pct} %</div>
      {o.stop != null && o.objectif != null && <div style={{ position: "relative", height: 6, borderRadius: 3, margin: "10px 0 4px",
        background: o.sens === "LONG" ? `linear-gradient(90deg, #f2246b55, ${GREEN}55)` : `linear-gradient(90deg, ${GREEN}55, #f2246b55)` }}>
        <span title="entrée" style={{ position: "absolute", left: at(o.entree), top: -3, width: 2, height: 12, background: "#fff" }} />
        {o.cours != null && <span title="cours" style={{ position: "absolute", left: at(o.cours), top: -4, width: 10, height: 14, marginLeft: -5, borderRadius: 3, background: pnlCol(o.pnl), boxShadow: `0 0 8px ${pnlCol(o.pnl)}` }} />}
      </div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "rgba(230,243,250,.45)", fontFamily: MONO }}>
        <span>stop {px(o.stop)}</span><span>objectif {px(o.objectif)}</span></div>
    </div>
  );
}

function Trades({ list }: { list: any[] }) {
  return <div>{list.slice(0, 7).map((t, i) => (
    <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: 8, fontSize: 11.5, padding: "3px 0", borderTop: i ? "1px solid rgba(255,255,255,.05)" : "none" }}>
      <span style={{ fontFamily: MONO }}>{t.symbole.replace("USDT", "")}</span>
      <span style={{ color: "rgba(230,243,250,.5)", fontSize: 10.5 }}>{t.sens === "LONG" ? "achat" : "vente"} · {String(t.raison || "").replace(/_/g, " ")}</span>
      <span style={{ color: pnlCol(t.pnl), fontFamily: MONO }}>{eur(t.pnl, true)}</span>
    </div>))}</div>;
}


/* ── révisions (Ève avec un enfant) ───────────────────────────────────────── */
const PINK = "#ff6fb5";
const say = (t: string) => (window as any).webkit?.messageHandlers?.jarvis?.postMessage("say:" + t);

function Schema({ sc }: { sc: any }) {
  const leg = Object.entries(sc.legende || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  return (
    <div>
      <img src={`${RELAY}/revision/img/${sc.img}.png`} alt={sc.titre}
        style={{ width: "100%", maxHeight: 380, objectFit: "contain", background: "#fff", borderRadius: 6, display: "block" }} />
      {leg.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 14px", marginTop: 10 }}>
        {leg.map(([n, t]) => <div key={n} style={{ fontSize: 13, display: "flex", gap: 7 }}>
          <span style={{ minWidth: 22, height: 22, borderRadius: "50%", background: PINK, color: "#1a0a14", fontWeight: 700, fontSize: 11,
            display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</span><span>{String(t)}</span></div>)}
      </div>}
    </div>
  );
}

function FichePart({ part }: { part: any }) {
  return <div>{part.points.map((pt: string, i: number) => (
    <div key={i} style={{ display: "flex", gap: 9, fontSize: 14.5, lineHeight: 1.45, marginBottom: 8, animation: `rwIn .4s ease-out ${i * 0.25}s both` }}>
      <span style={{ color: PINK, fontSize: 16 }}>✦</span><span>{pt}</span></div>))}</div>;
}

function Vocab({ v }: { v: Record<string, string> }) {
  return <div style={{ display: "grid", gap: 6 }}>{Object.entries(v).map(([w, d]) => (
    <div key={w} style={{ fontSize: 13 }}><b style={{ color: PINK }}>{w}</b> : {d}</div>))}</div>;
}

function Quiz({ qs }: { qs: any[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = qs[i];
  if (!q) return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 46 }}>{score === qs.length ? "🏆" : "⭐"}</div>
      <div style={{ fontSize: 22, marginTop: 8 }}>{score} / {qs.length}</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)", marginTop: 6 }}>Bravo pour ce quiz !</div>
    </div>);
  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === q.reponse;
    if (ok) setScore((x) => x + 1);
    say(`▸ Réponse (clic) à la question ${i + 1} « ${q.question} » : « ${q.choix[k]} » — ${ok ? "JUSTE" : `FAUX (la bonne réponse : « ${q.choix[q.reponse]} »)`}.`);
  };
  const next = () => {
    const n = i + 1;
    setI(n); setPicked(null);
    if (n >= qs.length) say(`▸ Quiz terminé : ${score} bonnes réponses sur ${qs.length}.`);
    else say(`▸ Question suivante, ${n + 1} : « ${qs[n].question} ». Lis-la-lui simplement.`);
  };
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: ".2em", color: PINK, fontFamily: MONO }}>QUESTION {i + 1} / {qs.length} · ⭐ {score}</div>
      <div style={{ fontSize: 20, lineHeight: 1.35, margin: "10px 0 14px" }}>{q.question}</div>
      {q.image && <img src={`${RELAY}/revision/img/${q.image}.png`} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "contain", background: "#fff", borderRadius: 6, marginBottom: 12 }} />}
      <div style={{ display: "grid", gap: 10 }}>
        {q.choix.map((c: string, k: number) => {
          const good = picked !== null && k === q.reponse, bad = picked === k && k !== q.reponse;
          return <button key={k} onClick={() => choose(k)} style={{ textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
            fontSize: 17, color: "#fff", border: `2px solid ${good ? GREEN : bad ? "#f2246b" : PINK + "88"}`,
            background: good ? GREEN + "33" : bad ? "#f2246b33" : PINK + "18", transition: "all .3s" }}>
            <b style={{ color: PINK, marginRight: 10 }}>{"ABCD"[k]}</b>{c} {good ? "✅" : bad ? "❌" : ""}</button>;
        })}
      </div>
      {picked !== null && <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.45, color: "rgba(255,255,255,.85)" }}>
        {picked === q.reponse ? "Bravo ! " : "Presque ! "}{q.explication}
        <button onClick={next} style={{ display: "block", marginTop: 12, padding: "11px 18px", borderRadius: 22, cursor: "pointer", fontSize: 15,
          color: "#1a0a14", fontWeight: 700, background: PINK, border: "none" }}>{i + 1 < qs.length ? "Question suivante →" : "Voir mon score ⭐"}</button>
      </div>}
    </div>
  );
}


/* ── chantier (atelier de projets) : étapes cochées, fichiers, progression ── */
function Chantier({ m }: { m: any }) {
  const steps: any[] = m.steps || [], files: string[] = m.files || [], pr = m.progress;
  const icon = (st: string) => st === "done" ? <span style={{ color: GREEN }}>✔</span>
    : st === "doing" ? <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", border: `2px solid ${CYAN}`, borderTopColor: "transparent", animation: "chSpin .8s linear infinite" }} />
    : st === "retry" ? <span style={{ color: ORANGE }}>⚠</span> : st === "fail" ? <span style={{ color: "#f2246b" }}>✖</span>
    : <span style={{ color: "rgba(255,255,255,.3)" }}>○</span>;
  return (
    <div>
      {steps.map((st, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, padding: "5px 0",
          color: st.state === "todo" ? "rgba(230,243,250,.45)" : "#fff", fontWeight: st.state === "doing" ? 600 : 400 }}>
          <span style={{ width: 18, textAlign: "center" }}>{icon(st.state)}</span>{st.label}
          {st.state === "retry" && <span style={{ fontSize: 11, color: ORANGE, marginLeft: 6 }}>autre voie en cours…</span>}
        </div>))}
      {pr && <div style={{ margin: "12px 0 6px" }}>
        <div style={{ fontSize: 12, color: CYAN, marginBottom: 5 }}>{pr.label}{pr.pct != null ? ` · ${pr.pct} %` : "…"}</div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
          {pr.pct != null ? <div style={{ width: `${pr.pct}%`, height: 8, background: CYAN, boxShadow: `0 0 10px ${CYAN}`, transition: "width .4s" }} />
            : <div style={{ width: "35%", height: 8, background: CYAN, boxShadow: `0 0 10px ${CYAN}`, animation: "hoBar 1.2s ease-in-out infinite" }} />}
        </div></div>}
      {files.length > 0 && <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: ".2em", color: "rgba(230,243,250,.5)", fontFamily: MONO, marginBottom: 4 }}>FICHIERS CRÉÉS</div>
        {files.map((f) => <div key={f} style={{ fontSize: 12, fontFamily: MONO, animation: "rwIn .3s ease-out" }}><span style={{ color: GREEN }}>✔</span> {f}</div>)}
      </div>}
      <style>{`@keyframes chSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}


/* ── bureau : aperçu de document (feuille) et de tableau ─────────────── */
/** Barre d'analyse : se remplit pendant que Jarvis identifie l'objet, 100 % à l'annonce. */
const ANALYSE_STEPS: [number, string][] = [[0, "Acquisition de l'image"], [25, "Gros plan sur l'objet"], [50, "Identification"], [78, "Vérification des détails"]];
const SCAN_STEPS: [number, string][] = [[0, "Balayage de la surface"], [30, "Repérage des objets"], [60, "Identification"], [82, "Mise en place des cadres"]];
function AnalyseBar({ done, color, steps = ANALYSE_STEPS }: { done?: boolean; color: string; steps?: [number, string][] }) {
  const [pct, setPct] = useState(done ? 100 : 0);
  useEffect(() => {
    if (done) { setPct(100); return; }
    const id = setInterval(() => setPct((p) => Math.min(96, p + (96 - p) * 0.035 + 0.15)), 100);
    return () => clearInterval(id);
  }, [done]);
  const step = done ? "Identifié" : [...steps].reverse().find(([v]) => pct >= v)![1];
  return <div style={{ margin: "4px 0 10px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 12, color }}>
      <span>▸ {step}{done ? "" : "…"}</span><span>{Math.round(pct)} %</span></div>
    <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,.08)", marginTop: 5, overflow: "hidden" }}>
      <div style={{ height: 7, width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}`, transition: "width .25s linear" }} /></div>
  </div>;
}

/** Caméra en direct (objets encadrés par le Core) : l'image est rafraîchie sans scintiller. */
function Hidden({ what }: { what: string }) {
  return <div style={{ aspectRatio: "16 / 9", display: "grid", placeItems: "center", textAlign: "center", color: "rgba(230,243,250,.6)",
    background: "repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 10px, transparent 10px 20px)", borderRadius: 8, fontSize: 13.5, padding: 16 }}>
    <div><div style={{ fontSize: 26, marginBottom: 6 }}>🔒</div>{what}<div style={{ fontSize: 11.5, marginTop: 4, opacity: .7 }}>Image masquée — confidentialité</div></div></div>;
}

function LiveCam({ hidden = false }: { hidden?: boolean }) {
  const [src, setSrc] = useState(`${RELAY}/camera/live.jpg?t=0`);
  useEffect(() => {
    let alive = true, n = 0;
    const next = () => {
      if (!alive) return;
      const img = new Image(), u = `${RELAY}/camera/live.jpg?t=${++n}`;
      img.onload = () => { if (alive) { setSrc(u); setTimeout(next, 60); } };
      img.onerror = () => { if (alive) setTimeout(next, 500); };
      img.src = u;
    };
    next();
    return () => { alive = false; };
  }, []);
  if (hidden) return <Hidden what="Caméra en direct" />;
  return <img src={src} alt="" style={{ width: "100%", display: "block", borderRadius: 8 }} />;
}

/** Diagramme Archify : le vrai HTML (SVG vectoriel), en version intégrée — seulement le schéma, cadré entier
 *  aux proportions du dessin (1750 × 900), sans barre d'outils. */
function Diagram({ name, title }: { name: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {                     // Jarvis pilote le schéma : focus, flux, zoom, vue complète
    const on = (e: Event) => {
      const m = (e as CustomEvent).detail || {};
      if (!m.name || m.name === name) ref.current?.contentWindow?.postMessage({ cmd: m.cmd, node: m.node }, "*");
    };
    window.addEventListener("jarvis-diagram", on);
    return () => window.removeEventListener("jarvis-diagram", on);
  }, [name]);
  return <iframe ref={ref} title={title} src={`${RELAY}/diagram/${name}?embed=1`} scrolling="no"
    style={{ width: "100%", aspectRatio: "1750 / 900", border: 0, background: "#fff", display: "block", borderRadius: 4 }} />;
}

/** Fenêtre de mot de passe : tapé ici, envoyé UNIQUEMENT au Core (jamais à Claude), vérifié puis oublié. */
function PwForm({ id, reason, error }: { id: string; reason: string; error: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const post = (m: string) => (window as any).webkit?.messageHandlers?.jarvis?.postMessage(m);
  useEffect(() => {
    post("kbd:on");                                   // le clavier va à l'interface, le temps de la saisie
    const t = setTimeout(() => ref.current?.focus(), 150);
    return () => { clearTimeout(t); post("kbd:off"); };
  }, []);
  useEffect(() => {
    setBusy(false);
    if (error && ref.current) { post("kbd:on"); ref.current.value = ""; ref.current.focus(); }   // « pw: » a rendu le clavier : on le reprend pour l'essai suivant
  }, [error, id]);
  const send = (v: string) => { setBusy(true); post(`pw:${id} ${v ? btoa(unescape(encodeURIComponent(v))) : ""}`); if (ref.current) ref.current.value = ""; };
  return <div>
    <div style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 12 }}>{reason}</div>
    <input ref={ref} type="password" autoComplete="off" disabled={busy} placeholder="Mot de passe"
      onKeyDown={(e) => { if (e.key === "Enter") send(e.currentTarget.value); else if (e.key === "Escape") send(""); }}
      style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 18, letterSpacing: ".25em", color: "#fff", background: "rgba(0,0,0,.45)",
        border: `1px solid ${error ? "#f2246b" : ORANGE}`, borderRadius: 8, outline: "none", boxShadow: `0 0 18px ${error ? "#f2246b" : ORANGE}55` }} />
    {error && <div style={{ marginTop: 8, fontSize: 13, color: "#f2246b" }}>Mot de passe incorrect — réessayez.</div>}
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button onClick={() => send(ref.current?.value || "")} disabled={busy} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${GREEN}`, background: `${GREEN}22`, color: "#fff", fontSize: 14, cursor: "pointer" }}>{busy ? "Vérification…" : "Autoriser"}</button>
      <button onClick={() => send("")} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "rgba(230,243,250,.8)", fontSize: 14, cursor: "pointer" }}>Refuser</button>
    </div>
    <div style={{ marginTop: 10, fontSize: 11.5, color: "rgba(230,243,250,.5)" }}>🔒 Jarvis ne lit pas et ne garde pas votre mot de passe : il sert uniquement à vérifier votre autorisation.</div>
  </div>;
}

/** Pile de fenêtres du lancement (terminaux, front en direct) : celle de l'action en cours passe devant,
 *  les autres restent en retrait derrière. Les fenêtres gardent leur clé : l'iframe du front ne se recharge pas. */
function WindowStack({ wins, focus }: { wins: any[]; focus: string }) {
  const order = [...wins.filter((w) => w.id !== focus), ...wins.filter((w) => w.id === focus)];
  const back = order.length - 1, H = 560;
  return (
    <div style={{ position: "relative", height: H + 40 + back * 26 }}>
      {wins.map((w) => {
        const k = back - order.indexOf(w);                 // 0 = devant
        const col = w.kind === "front" ? MAGENTA : w.ok === false ? "#f2246b" : w.ok ? GREEN : CYAN;
        return <div key={w.id} style={{ position: "absolute", left: 0, right: 0, top: (back - k) * 26,
          transform: `scale(${1 - k * 0.035})`, transformOrigin: "top center", opacity: k ? 0.55 : 1, zIndex: 20 - k,
          transition: "all .55s cubic-bezier(.2,.8,.2,1)", borderRadius: 10, overflow: "hidden",
          border: `1px solid ${k ? "rgba(255,255,255,.12)" : col}`, boxShadow: k ? "none" : `0 12px 40px rgba(0,0,0,.55), 0 0 18px ${col}55`,
          background: "#070b12" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "rgba(255,255,255,.05)",
            fontFamily: MONO, fontSize: 12, color: k ? "rgba(230,243,250,.6)" : col }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: col, boxShadow: `0 0 8px ${col}` }} />
            {tx(w.title)}{w.url ? <span style={{ marginLeft: "auto", opacity: .7 }}>{tx(w.url)}</span> : null}
          </div>
          {w.kind === "front"
            ? <iframe title={tx(w.title)} src={String(w.url)} style={{ width: "100%", height: H, border: 0, background: "#fff", display: "block" }} />
            : <Terminal lines={(w.lines as string[]) || []} height={H} />}
        </div>;
      })}
    </div>
  );
}


/* ── Bibliothèque de composants : Jarvis compose son écran (outil display) ───────────────── */
function Md({ text }: { text: string }) {
  const inline = (t: string) => t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((x, i) =>
    x.startsWith("**") ? <b key={i}>{x.slice(2, -2)}</b> : x.startsWith("`") ? <code key={i} style={{ fontFamily: MONO, color: CYAN }}>{x.slice(1, -1)}</code> : x);
  return <div style={{ fontSize: 15, lineHeight: 1.55 }}>{String(text || "").split(/\n\s*\n/).map((b, i) => {
    const lines = b.split("\n");
    if (lines.every((l) => /^\s*[-•*]\s/.test(l)))
      return <ul key={i} style={{ margin: "0 0 10px", paddingLeft: 20 }}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•*]\s/, ""))}</li>)}</ul>;
    if (/^#{1,3}\s/.test(b)) return <div key={i} style={{ fontSize: 17, fontWeight: 700, margin: "4px 0 8px", color: CYAN }}>{inline(b.replace(/^#{1,3}\s/, ""))}</div>;
    return <p key={i} style={{ margin: "0 0 10px" }}>{inline(b)}</p>;
  })}</div>;
}

function Table({ columns, rows }: { columns: string[]; rows: any[][] }) {
  return <div style={{ maxHeight: 460, overflow: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
    <thead><tr>{columns.map((c, i) => <th key={i} style={{ textAlign: "left", padding: "6px 8px", color: CYAN, fontWeight: 600, borderBottom: "1px solid rgba(89,235,255,.35)", position: "sticky", top: 0, background: "#08101a" }}>{tx(c)}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} style={{ animation: `rwIn .3s ease-out ${i * 0.04}s both` }}>{r.map((v, j) =>
      <td key={j} style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,.06)", fontFamily: typeof v === "number" ? MONO : undefined }}>{tx(v)}</td>)}</tr>)}</tbody>
  </table></div>;
}

function Stats({ items, color }: { items: any[]; color: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: 12 }}>{items.map((it, i) => {
    const d = Number(it.delta);
    return <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.04)", animation: `rwIn .4s ease-out ${i * 0.08}s both` }}>
      <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(230,243,250,.55)" }}>{tx(it.label)}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: MONO }}>{tx(it.value)}<span style={{ fontSize: 13, marginLeft: 4, opacity: .7 }}>{tx(it.unit)}</span></div>
      {it.delta != null && <div style={{ fontSize: 12, color: d > 0 ? GREEN : d < 0 ? "#f2246b" : "inherit" }}>{d > 0 ? "▲" : d < 0 ? "▼" : "•"} {tx(it.delta)}</div>}
    </div>;
  })}</div>;
}

const SERIES = [CYAN, ORANGE, MAGENTA, GREEN, BLUE, VIOLET];
function Pie({ labels, values, donut }: { labels: string[]; values: number[]; donut: boolean }) {
  const tot = values.reduce((a, b) => a + Math.max(0, b), 0) || 1, R = 100, r = donut ? 58 : 0;
  let a0 = -Math.PI / 2;
  const arcs = values.map((v, i) => {
    const a1 = a0 + (Math.max(0, v) / tot) * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a: number, rr: number) => `${120 + rr * Math.cos(a)} ${120 + rr * Math.sin(a)}`;
    const d = r ? `M${p(a0, R)} A${R} ${R} 0 ${big} 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 ${big} 0 ${p(a0, r)}Z`
                : `M120 120 L${p(a0, R)} A${R} ${R} 0 ${big} 1 ${p(a1, R)}Z`;
    a0 = a1;
    return <path key={i} d={d} fill={SERIES[i % SERIES.length]} stroke="#070b12" strokeWidth={2} style={{ animation: `rwIn .4s ease-out ${i * 0.08}s both` }} />;
  });
  return <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <svg viewBox="0 0 240 240" style={{ width: 220, flexShrink: 0 }}>{arcs}
      {donut && <text x="120" y="128" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">{Number(tot.toPrecision(4))}</text>}</svg>
    <div>{labels.map((l, i) => <div key={i} style={{ fontSize: 13, padding: "3px 0" }}>
      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: SERIES[i % SERIES.length], marginRight: 7 }} />
      {tx(l)} <span style={{ opacity: .6, fontFamily: MONO }}>{Math.round((Math.max(0, values[i]) / tot) * 100)} %</span></div>)}</div>
  </div>;
}

function Chart({ kind, labels, series }: { kind: string; labels: string[]; series: any[] }) {
  if ((kind === "pie" || kind === "donut") && series[0]) return <Pie labels={labels} values={(series[0].values as number[]).map(Number)} donut={kind === "donut"} />;
  if (kind === "scatter") {
    const pts = series.flatMap((s, k) => (s.values as any[]).map((v) => ({ x: Number(v[0]), y: Number(v[1]), k })));
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), W2 = 640, H2 = 260, P2 = 34;
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    return <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: "100%", display: "block" }}>
      <line x1={P2} x2={W2 - P2} y1={H2 - P2} y2={H2 - P2} stroke="rgba(255,255,255,.15)" /><line x1={P2} x2={P2} y1={P2} y2={H2 - P2} stroke="rgba(255,255,255,.15)" />
      {pts.map((p, i) => <circle key={i} cx={P2 + ((p.x - x0) / (x1 - x0 || 1)) * (W2 - 2 * P2)} cy={H2 - P2 - ((p.y - y0) / (y1 - y0 || 1)) * (H2 - 2 * P2)} r={4}
        fill={SERIES[p.k % SERIES.length]} opacity={.85} />)}</svg>;
  }
  if (kind === "stacked") {
    const tot = labels.map((_, i) => series.reduce((a, s) => a + Math.max(0, Number(s.values[i]) || 0), 0));
    series = series.map((s, k) => ({ ...s, base: labels.map((_, i) => series.slice(0, k).reduce((a, q) => a + Math.max(0, Number(q.values[i]) || 0), 0)) }));
    void tot;
  }
  const W = 640, H = 260, P = 34, all = series.flatMap((s) => (s.values as number[]).map(Number)).filter((v) => !isNaN(v));
  const stackedHi = kind === "stacked" ? Math.max(1, ...labels.map((_, i) => series.reduce((a, s) => a + Math.max(0, Number(s.values[i]) || 0), 0))) : 0;
  const lo = Math.min(0, ...all), hi = Math.max(...all, 1, stackedHi), n = Math.max(labels.length, 1);
  const y = (v: number) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P), x = (i: number) => P + (i + 0.5) * ((W - 2 * P) / n);
  const bw = ((W - 2 * P) / n) * 0.7 / Math.max(series.length, 1);
  return <div>
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {[0, .25, .5, .75, 1].map((f, i) => { const v = lo + f * (hi - lo); return <g key={i}><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.08)" />
        <text x={P - 6} y={y(v) + 4} fontSize="10" fill="rgba(230,243,250,.5)" textAnchor="end">{Number(v.toPrecision(3))}</text></g>; })}
      {labels.map((l, i) => <text key={i} x={x(i)} y={H - 10} fontSize="10" fill="rgba(230,243,250,.6)" textAnchor="middle">{tx(l).slice(0, 10)}</text>)}
      {series.map((s, k) => { const c = SERIES[k % SERIES.length], vals = (s.values as number[]).map(Number);
        if (kind === "stacked") return vals.map((v, i) => { const b = s.base[i]; return <rect key={`${k}-${i}`} x={x(i) - (bw * series.length) / 2} y={y(b + v)} width={bw * series.length - 2} height={Math.abs(y(b) - y(b + v))} fill={c} />; });
        if (kind === "area") { const d = vals.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ");
          return <g key={k}><path d={`${d} L${x(vals.length - 1)} ${y(lo)} L${x(0)} ${y(lo)}Z`} fill={`${c}33`} /><path d={d} stroke={c} strokeWidth={2} fill="none" /></g>; }
        return kind === "bar"
          ? vals.map((v, i) => <rect key={`${k}-${i}`} x={x(i) - (bw * series.length) / 2 + k * bw} y={Math.min(y(v), y(0))} width={bw - 2} height={Math.abs(y(v) - y(0))} fill={c} rx={2} />)
          : <path key={k} d={vals.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ")} stroke={c} strokeWidth={2} fill="none" style={{ filter: `drop-shadow(0 0 4px ${c})` }} />; })}
    </svg>
    {series.length > 1 && <div style={{ display: "flex", gap: 14, fontSize: 12, marginTop: 4 }}>{series.map((s, k) =>
      <span key={k}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: SERIES[k % SERIES.length], marginRight: 5 }} />{tx(s.name)}</span>)}</div>}
  </div>;
}

function Gauge({ value, max = 100, unit = "", label = "", color }: { value: number; max?: number; unit?: string; label?: string; color: string }) {
  const f = Math.max(0, Math.min(1, Number(value) / (Number(max) || 100))), a = Math.PI * (1 - f), R = 90;
  const col = f > 0.85 ? "#f2246b" : f > 0.65 ? ORANGE : color;
  return <svg viewBox="0 0 220 130" style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }}>
    <path d={`M20 115 A${R} ${R} 0 0 1 200 115`} stroke="rgba(255,255,255,.1)" strokeWidth={16} fill="none" strokeLinecap="round" />
    <path d={`M20 115 A${R} ${R} 0 0 1 ${110 + R * Math.cos(a)} ${115 - R * Math.sin(a)}`} stroke={col} strokeWidth={16} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${col})` }} />
    <text x="110" y="100" textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff" fontFamily="monospace">{Number(Number(value).toPrecision(3))}<tspan fontSize="14" opacity=".7"> {unit}</tspan></text>
    <text x="110" y="126" textAnchor="middle" fontSize="12" fill="rgba(230,243,250,.6)">{label}</text></svg>;
}

function Progress({ items, color }: { items: any[]; color: string }) {
  return <div>{items.map((it, i) => { const f = Math.max(0, Math.min(1, Number(it.value) / (Number(it.max) || 100)));
    return <div key={i} style={{ margin: "6px 0 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{tx(it.label)}</span><span style={{ fontFamily: MONO, opacity: .7 }}>{Math.round(f * 100)} %</span></div>
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.08)", marginTop: 4 }}>
        <div style={{ width: `${f * 100}%`, height: 8, borderRadius: 4, background: SERIES[i % SERIES.length] || color, transition: "width .6s" }} /></div></div>; })}</div>;
}

function Timeline({ items, color }: { items: any[]; color: string }) {
  return <div style={{ position: "relative", paddingLeft: 18, maxHeight: 480, overflow: "auto" }}>
    <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: `${color}55` }} />
    {items.map((it, i) => <div key={i} style={{ position: "relative", padding: "0 0 12px", animation: `rwIn .35s ease-out ${i * 0.07}s both` }}>
      <span style={{ position: "absolute", left: -17, top: 4, width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      <div style={{ fontFamily: MONO, fontSize: 11, color }}>{tx(it.date)}</div>
      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{tx(it.title)}</div>
      {it.text && <div style={{ fontSize: 13, color: "rgba(230,243,250,.7)" }}>{tx(it.text)}</div>}</div>)}</div>;
}

function Heatmap({ rows, columns, values }: { rows: string[]; columns: string[]; values: number[][] }) {
  const flat = values.flat().map(Number), lo = Math.min(...flat), hi = Math.max(...flat);
  return <div style={{ overflow: "auto" }}><table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 11 }}>
    <thead><tr><th />{columns.map((c, i) => <th key={i} style={{ fontWeight: 400, opacity: .6 }}>{tx(c)}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}><td style={{ opacity: .7, paddingRight: 6 }}>{tx(r)}</td>{(values[i] || []).map((v, j) => {
      const f = (Number(v) - lo) / (hi - lo || 1);
      return <td key={j} title={String(v)} style={{ width: 26, height: 22, borderRadius: 3, background: `rgba(89,235,255,${0.08 + f * 0.85})` }} />; })}</tr>)}</tbody>
  </table></div>;
}

/** Lecteur vidéo / audio avec liste de lecture ; Jarvis le pilote (pause, suivante, précédente, stop). */
function Player({ items, kind, color }: { items: any[]; kind: string; color: string }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  useEffect(() => {
    const on = (e: Event) => { const c = (e as CustomEvent).detail?.cmd, el = ref.current;
      if (c === "pause") el?.pause(); else if (c === "resume") el?.play().catch(() => {});
      else if (c === "next") setI((k) => Math.min(items.length - 1, k + 1)); else if (c === "previous") setI((k) => Math.max(0, k - 1));
      else if (c === "stop") { el?.pause(); if (el) el.currentTime = 0; } };
    window.addEventListener("jarvis-player", on);
    return () => window.removeEventListener("jarvis-player", on);
  }, [items.length]);
  const it = items[i] || {}, next = () => setI((k) => (k + 1 < items.length ? k + 1 : k));
  const yt = ytId(String(it.src || ""));
  return <div>
    {kind === "audio"
      ? <div style={{ padding: "6px 0 10px" }}><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>♪ {tx(it.title)}</div>
          <audio ref={ref} key={it.src} src={it.src} controls autoPlay onEnded={next} style={{ width: "100%" }} /></div>
      : <div style={{ aspectRatio: "16 / 9", background: "#000" }}>{yt
          ? <iframe title="vidéo" src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`} allow="autoplay; encrypted-media" style={{ width: "100%", height: "100%", border: 0 }} />
          : <video ref={ref} key={it.src} src={it.src} controls autoPlay onEnded={next} style={{ width: "100%", height: "100%" }} />}</div>}
    {items.length > 1 && <div style={{ maxHeight: 180, overflow: "auto", marginTop: 8 }}>{items.map((x, k) =>
      <div key={k} onClick={() => setI(k)} style={{ cursor: "pointer", fontSize: 12.5, padding: "3px 6px", borderRadius: 4, fontFamily: MONO,
        background: k === i ? `${color}22` : "transparent", color: k === i ? color : "rgba(230,243,250,.75)" }}>{k === i ? "▶ " : `${k + 1}. `}{tx(x.title)}</div>)}</div>}
  </div>;
}

function TreeNode({ n, depth }: { n: any; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  return <div style={{ paddingLeft: depth ? 14 : 0 }}>
    <div onClick={() => n.dir && setOpen((o) => !o)} style={{ cursor: n.dir ? "pointer" : "default", fontFamily: MONO, fontSize: 12.5, padding: "1px 0",
      color: n.dir ? CYAN : "rgba(230,243,250,.85)" }}>{n.dir ? (open && !n.folded ? "▾ 📁 " : "▸ 📁 ") : "   📄 "}{tx(n.name)}</div>
    {n.dir && open && (n.children || []).map((c: any, i: number) => <TreeNode key={i} n={c} depth={depth + 1} />)}
  </div>;
}

const fsize = (b: number | null) => b == null ? "" : b > 1 << 30 ? `${(b / (1 << 30)).toFixed(1)} Go` : b > 1 << 20 ? `${(b / (1 << 20)).toFixed(1)} Mo` : b > 1024 ? `${Math.round(b / 1024)} Ko` : `${b} o`;
const ytId = (u: string) => (u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,20})/) || [])[1];

function LibBody({ p, color }: { p: any; color: string }) {
  switch (p.type) {
    case "text": return <Md text={p.text} />;
    case "list": return <div>{(p.items || []).map((it: any, i: number) => { const o = typeof it === "string" ? { label: it } : it;
      return <div key={i} style={{ display: "flex", gap: 10, fontSize: 14.5, padding: "4px 0", animation: `rwIn .3s ease-out ${i * 0.05}s both` }}>
        <span style={{ color: o.done ? GREEN : color }}>{o.done === true ? "✔" : o.done === false ? "○" : "•"}</span>{tx(o.label)}</div>; })}</div>;
    case "table": return <Table columns={p.columns || []} rows={p.rows || []} />;
    case "stats": return <Stats items={p.items || []} color={color} />;
    case "chart": return <Chart kind={p.kind || "line"} labels={p.labels || []} series={p.series || []} />;
    case "code": return <pre style={{ margin: 0, maxHeight: 460, overflow: "auto", background: "#05080c", padding: 12, borderRadius: 6, fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: "#d6e7f5" }}>{tx(p.code)}</pre>;
    case "terminal": return <Terminal lines={(p.lines as string[]) || []} height={Math.min(420, 40 + 18 * ((p.lines || []).length || 1))} />;
    case "image": return <img src={p.src} alt="" style={{ width: "100%", maxHeight: 520, objectFit: "contain", display: "block", borderRadius: 6 }} />;
    case "video": { const id = ytId(String(p.src));
      return <div style={{ aspectRatio: "16 / 9", background: "#000" }}>{id
        ? <iframe title="vidéo" src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media" style={{ width: "100%", height: "100%", border: 0 }} />
        : <video src={p.src} controls autoPlay style={{ width: "100%", height: "100%" }} />}</div>; }
    case "audio": return <div style={{ padding: "8px 0" }}><div style={{ fontSize: 13, marginBottom: 8, color }}>♪ {tx(p.title)}</div><audio src={p.src} controls autoPlay style={{ width: "100%" }} /></div>;
    case "web": case "app": return <iframe title={tx(p.title)} src={p.src} style={{ width: "100%", height: 560, border: 0, background: "#fff", display: "block", borderRadius: 4 }} />;
    case "links": return <div>{(p.items || []).map((l: any, i: number) => <div key={i} style={{ padding: "7px 0", borderTop: i ? "1px solid rgba(255,255,255,.06)" : "none", animation: `rwIn .3s ease-out ${i * 0.06}s both` }}>
      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{tx(l.title)}</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color, opacity: .8 }}>{tx(l.url).replace(/^https?:\/\//, "").slice(0, 70)}</div>
      {l.snippet && <div style={{ fontSize: 12.5, color: "rgba(230,243,250,.7)", marginTop: 2 }}>{tx(l.snippet)}</div>}</div>)}</div>;
    case "diagram": return <Diagram name={String(p.name)} title={tx(p.title)} />;
    case "gauge": return <Gauge value={p.value} max={p.max} unit={p.unit} label={p.label} color={color} />;
    case "progress": return <Progress items={p.items || []} color={color} />;
    case "timeline": return <Timeline items={p.items || []} color={color} />;
    case "kv": return <div>{(p.items || []).map((it: any, i: number) => <div key={i} style={{ display: "grid", gridTemplateColumns: "40% 1fr", gap: 10, fontSize: 13.5, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <span style={{ color: "rgba(230,243,250,.6)" }}>{tx(it.key)}</span><span style={{ fontFamily: MONO }}>{tx(it.value)}</span></div>)}</div>;
    case "heatmap": return <Heatmap rows={p.rows || []} columns={p.columns || []} values={p.values || []} />;
    case "player": return <Player items={p.items || []} kind={p.kind || "video"} color={color} />;
    case "tree": return <div style={{ maxHeight: 520, overflow: "auto" }}><div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(230,243,250,.5)", marginBottom: 6 }}>{tx(p.path)}</div>{p.tree && <TreeNode n={p.tree} depth={0} />}</div>;
    case "files": return <div style={{ maxHeight: 520, overflow: "auto" }}><div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(230,243,250,.5)", marginBottom: 6 }}>{tx(p.path)}</div>
      {(p.files || []).map((f: any, i: number) => <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, fontSize: 13, padding: "3px 0", fontFamily: MONO }}>
        <span style={{ color: f.dir ? CYAN : undefined }}>{f.dir ? "📁" : "📄"} {tx(f.name)}</span><span style={{ opacity: .6 }}>{fsize(f.size)}</span><span style={{ opacity: .5 }}>{tx(f.date)}</span></div>)}</div>;
  }
  return null;
}

const LIB_WIDTH: Record<string, number> = { text: 520, list: 440, table: 760, stats: 620, chart: 680, code: 680, terminal: 680, image: 640, video: 820,
  audio: 460, web: 1000, app: 1100, links: 520, diagram: 1000, tree: 460, files: 600, gauge: 360, progress: 460, timeline: 480, kv: 460,
  heatmap: 640, player: 860 };
const LIB_ZONES: ("L" | "R" | "B")[] = ["R", "L", "B"];

function buildDisplay(m: any): { theme: Theme; panels: PanelSpec[] } {
  const ps: any[] = (m.panels as any[]) || [];
  const panels: PanelSpec[] = ps.map((p, i) => {
    const color = /^#[0-9a-f]{3,8}$/i.test(String(p.color || "")) ? String(p.color) : SERIES[i % SERIES.length];
    const wide = ["web", "app", "diagram", "video", "player"].includes(p.type);
    return { id: `dp-${i}-${p.type}-${tx(p.title).slice(0, 20)}`, zone: (["L", "R", "B"].includes(p.zone) ? p.zone : LIB_ZONES[i % 3]) as any,
      width: Number(p.width) || LIB_WIDTH[p.type] || 520, color, flat: wide, title: tx(p.title) || p.type, subtitle: tx(p.subtitle), delay: 120 + i * 180,
      body: <LibBody p={p} color={color} /> };
  });
  return { theme: { title: tx(m.title) || "Jarvis", subtitle: tx(m.subtitle), color: CYAN }, panels };
}

/** Pile de diagrammes : le dernier annoncé passe devant, les précédents restent en retrait derrière. */
function DiagramStack({ items }: { items: { name: string; title: string }[] }) {
  const shown = items.slice(-4), back = shown.length - 1;
  return (
    <div style={{ position: "relative", paddingTop: back * 18 }}>
      {shown.map((it, i) => {
        const k = back - i;               // 0 = devant
        return <div key={it.name} style={{ position: k ? "absolute" : "relative", left: 0, right: 0, top: k ? (back - k) * 18 : undefined,
          transform: k ? `scale(${1 - k * 0.04})` : "none", transformOrigin: "top center", opacity: k ? 0.45 : 1, zIndex: 10 - k,
          transition: "all .5s ease-out", animation: k ? undefined : "rwIn .5s ease-out both" }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: VIOLET, margin: "0 0 4px 2px" }}>{it.title}</div>
          <Diagram name={it.name} title={it.title} />
        </div>;
      })}
    </div>
  );
}

function Paper({ m }: { m: any }) {
  const lettre = m.doc_kind === "lettre";
  return (
    <div style={{ background: "#fbfaf7", color: "#1c1c1c", borderRadius: 4, padding: "26px 30px", fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.5,
      maxHeight: 560, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
      {lettre && <>
        <div>{(m.sender || []).map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
        <div style={{ textAlign: "right", margin: "14px 0" }}>{(m.recipient || []).map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
        <div style={{ textAlign: "right", marginBottom: 12 }}>{m.place_date}</div>
        {m.title && <div style={{ fontWeight: 700, marginBottom: 12 }}>Objet : {m.title}</div>}
      </>}
      {!lettre && <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>{m.title}</div>}
      {String(m.body || "").split(/\n\s*\n/).map((b: string, i: number) => <p key={i} style={{ margin: "0 0 10px", textAlign: "justify", animation: `rwIn .4s ease-out ${i * 0.15}s both` }}>{b}</p>)}
      {m.closing && <p style={{ marginTop: 14 }}>{m.closing}</p>}
      {m.signature && <div style={{ textAlign: "right", marginTop: 16 }}>{m.signature}</div>}
    </div>
  );
}

function Sheet({ m }: { m: any }) {
  const cols: any[] = m.columns || [], rows: any[][] = m.rows || [];
  const cell = (v: any) => typeof v === "number" ? v.toLocaleString(loc(), { maximumFractionDigits: 2 }) : String(v ?? "").startsWith("=") ? "∑" : String(v ?? "");
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: MONO }}>
      <thead><tr>{cols.map((c, i) => <th key={i} style={{ textAlign: i ? "right" : "left", padding: "6px 8px", background: "#3861f2", color: "#fff" }}>{String(c ?? "")}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => {
        const tot = String(r[0] ?? "").toUpperCase() === "TOTAL";
        return <tr key={i} style={{ background: i % 2 ? "rgba(255,255,255,.03)" : "transparent", fontWeight: tot ? 700 : 400, animation: `rwIn .3s ease-out ${Math.min(i, 20) * 0.04}s both` }}>
          {r.map((v, k) => <td key={k} style={{ padding: "5px 8px", textAlign: k ? "right" : "left", borderTop: tot ? `1px solid ${CYAN}` : "1px solid rgba(255,255,255,.06)" }}>{cell(v)}</td>)}</tr>;
      })}</tbody>
    </table>
  );
}

/* ── scènes par outil ────────────────────────────────────────────────── */
export function buildScene(m: Media): Scene | null {
  const step = (i: number, gap = 1400, first = 250) => first + i * gap;
  switch (m.kind) {
    case "self": {
      const d: any = m, mc = d.machine || {}, a = d.autour || {};
      const shots: any[] = d.captures || [];
      const panels: PanelSpec[] = [
        // le diagramme du système en premier, à gauche
        { id: "self-diag", zone: "L", width: 660, flat: true, color: MAGENTA, title: "JARVIS · système en direct", subtitle: `${mc.hote} · ${mc.modele}`, body: <SelfDiagram d={d} />, delay: 200 },
      ];
      // puis son diagramme d'architecture Archify, par-dessus le diagramme vivant
      if (d.archify) panels.push({ id: "self-archify", zone: "L", width: 880, color: VIOLET, title: "Architecture de JARVIS", subtitle: "Archify",
        body: <Diagram name="jarvis-os-linux" title="architecture Jarvis" />, delay: 9000, flat: true });
      // Comment JARVIS fonctionne, puis ce que son créateur lui développe encore
      const jv: any = d.jarvis;
      if (jv) {
        const a = jv.architecture || {};
        panels.push({ id: "self-how", zone: "R", width: 560, color: MAGENTA, title: "Comment je fonctionne", subtitle: "conçu et développé par son créateur", delay: 600,
          body: <div style={{ display: "grid", gap: 7, fontSize: 13, lineHeight: 1.45 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
              {["logo-claude", "logo-anthropic", "logo-elevenlabs"].map((l) => (
                <div key={l} style={{ flex: 1, height: 40, borderRadius: 10, background: "#f4f1ea", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}>
                  <img src={`${RELAY}/shot/${l}.png`} alt="" style={{ maxWidth: "100%", maxHeight: 26, objectFit: "contain" }} /></div>))}
            </div>
            {[["Cerveau", a.cerveau], ["Oreilles", a.oreilles], ["Voix", a.voix], ["Corps", a.corps]].map(([k, v]) => v && (
              <div key={k}><b style={{ color: MAGENTA, fontFamily: MONO, fontSize: 11, letterSpacing: ".15em", marginRight: 8 }}>{String(k).toUpperCase()}</b>{v}</div>))}
          </div> });
        panels.push({ id: "self-dev", zone: "R", width: 560, color: ORANGE, title: "En développement", subtitle: "ce que mon créateur me prépare", delay: 26000,
          body: <div style={{ display: "grid", gap: 6 }}>{(jv.en_developpement || []).map((x: any, i: number) => (
            <div key={i} style={{ fontSize: 13, animation: `rwIn .4s ease-out ${i * 0.2}s both` }}><b style={{ color: ORANGE }}>{x.nom}</b> — {x.quoi}</div>))}</div> });
      }
      // Omarchy, la distribution sur laquelle JARVIS est posé
      const om: any = d.omarchy;
      if (om) panels.push({ id: "self-omarchy", zone: "R", width: 560, color: CYAN, title: "Omarchy", subtitle: "par DHH · Arch + Hyprland", delay: 1500,
        body: <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <div style={{ fontSize: 15, marginBottom: 8, color: "#fff" }}>{om.slogan}</div>
          {(om.but || []).slice(0, 2).map((b: string, i: number) => <div key={i} style={{ marginBottom: 6, color: "rgba(230,243,250,.8)" }}>✦ {b}</div>)}
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontFamily: MONO, fontSize: 12, color: CYAN, flexWrap: "wrap" }}>
            <span>★ {Number(om.communaute?.github_etoiles || 0).toLocaleString(loc())} étoiles</span>
            <span>{om.communaute?.contributeurs} contributeurs</span>
            <span>{Number(om.communaute?.telechargements_annee_1 || 0).toLocaleString(loc())} téléchargements</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(230,243,250,.5)", marginTop: 8 }}>{om.fondation?.split(":")[0]} · {om.version_installee}</div>
        </div> });
      // puis les captures d'Omarchy, empilées à droite au fil de la présentation
      const order = ["omarchy-site", "omarchy-quattro", "omarchy-theme", "bureau", "barre", "fastfetch", "btop", "orbe", "menu"];
      [...shots].sort((x, y) => order.indexOf(x.nom) - order.indexOf(y.nom)).forEach((s, i) =>
        panels.push({ id: `shot-${s.nom}`, zone: "R", width: 600, color: CYAN, title: "Omarchy", subtitle: s.nom, body: <Shot name={s.nom} caption={s.legende} color={CYAN} />, delay: step(i, 5000, 7000) }));
      // pour finir : le brief des systèmes et des outils
      const etat: any[] = d.etat || [];
      if (etat.length) panels.push({ id: "self-brief", zone: "R", width: 560, color: GREEN, title: "Brief · systèmes et outils",
        subtitle: `${etat.filter((e) => e.ok).length}/${etat.length} opérationnels`, delay: 7000 + shots.length * 5000,
        body: <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 18px" }}>{etat.map((e, i) => (
          <div key={e.nom} style={{ display: "flex", alignItems: "center", gap: 8, animation: `rwIn .35s ease-out ${i * 0.12}s both` }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: e.ok ? GREEN : ORANGE, boxShadow: `0 0 8px ${e.ok ? GREEN : ORANGE}` }} />
            <div><div style={{ fontSize: 12.5 }}>{e.nom}</div><div style={{ fontSize: 10.5, color: "rgba(230,243,250,.5)" }}>{e.detail}</div></div>
          </div>))}</div> });
      // et en bas, ce que je sais faire
      Object.entries(d.outils?.groupes || {}).forEach(([g, list]: [string, any], i) =>
        panels.push({ id: `grp-${g}`, zone: "B", width: 210, color: [CYAN, ORANGE, BLUE, VIOLET, GREEN][i % 5], title: g, body:
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: "rgba(230,243,250,.75)", lineHeight: 1.6 }}>{(list as string[]).join(" · ")}</div>, delay: step(i, 500, 1600) }));
      return { theme: { title: "Qui suis-je", subtitle: `JARVIS · interface vocale sur la couche Omarchy · ${d.outils?.total ?? ""} outils · ${a.appareils_reseau ?? "?"} appareils autour de moi`, color: MAGENTA }, panels };
    }
    case "documentary": {
      const ch: any[] = (m.chapters as any[]) || [];
      const col = ORANGE;
      return {
        theme: { title: tx(m.title), subtitle: `Documentaire · ${ch.length} chapitres`, color: col },
        panels: ch.map((c, i) => ({ id: `doc-${i}`, zone: i % 2 ? "R" : "L", width: 520, color: col, title: `${String(i + 1).padStart(2, "0")} · ${c.title}`, body: <Chapter c={c} color={col} />, delay: step(i, 7000, 1800) })),
      };
    }
    case "weather": {
      const w: any = m;
      return {
        theme: { title: `Météo · ${tx(w.place)}`, subtitle: "maintenant · 24 heures · 7 jours", color: CYAN },
        panels: [
          { id: "wx-now", zone: "L", width: 460, color: CYAN, title: "Maintenant", subtitle: tx(w.place), body: <WeatherNow w={w} />, delay: 200 },
          { id: "wx-24", zone: "R", width: 600, color: BLUE, title: "Prochaines 24 h", subtitle: "température · pluie", body: <HourlyChart h={w.hourly} />, delay: 1500 },
          { id: "wx-7", zone: "R", width: 560, color: MAGENTA, title: "7 jours", body: <WeatherWeek w={w} />, delay: 4200 },
        ],
      };
    }
    case "library": {
      const items: any[] = (m.items as any[]) || [], series = m.section === "Séries", col = series ? MAGENTA : ORANGE;
      const recent = items.slice(0, 8);
      return {
        theme: { title: series ? "Séries" : "Cinéma", subtitle: `${items.length} ${series ? "séries" : "films"} sur le ProLiant · derniers ajouts`, color: col },
        panels: [
          { id: "lib-all", zone: "L", width: 640, color: col, title: `Toute la bibliothèque`, subtitle: `${items.length}`, body: <div style={{ height: 520 }}><LibraryWindow section={tx(m.section)} items={items} /></div>, delay: 200 },
          ...recent.reverse().map((it, i) => ({ id: `rec-${it.key}`, zone: "R" as const, width: 280, color: col, title: it.title, subtitle: it.year ? String(it.year) : "",
            body: <div style={{ aspectRatio: "2 / 3", overflow: "hidden", borderRadius: 4 }}><Poster k={it.key} title={it.title} /></div>, delay: step(i, 900, 1400) })),
        ],
      };
    }
    case "project": {
      if (m.vue === "tous") {
        const ps: any[] = [...((m.projets as any[]) || [])].sort((a, b) => Number(!!b.diagramme) - Number(!!a.diagramme));
        const withDiag = ps.filter((p) => p.diagramme);
        return {
          theme: { title: "Mes projets", subtitle: `${ps.length} dépôts GitHub · ${withDiag.length} diagrammes d'architecture`, color: CYAN },
          panels: [
            // les diagrammes Archify s'empilent à gauche…
            ...withDiag.map((p, i) => ({ id: `pjd-${p.nom}`, zone: "L" as const, width: 640, color: VIOLET, title: `Architecture · ${p.nom}`, subtitle: "Archify",
              body: <Diagram name={String(p.nom).toLowerCase()} title={p.nom} />, flat: true,
              delay: step(i, 4000, 600) })),
            // …et les fiches des projets à droite, dans le même ordre
            ...ps.map((p, i) => ({ id: `pj-${p.nom}`, zone: "R" as const, width: 460, color: p.fork ? BLUE : CYAN, title: p.nom, subtitle: p.dernier_push,
              body: <ProjectCard p={p} />, delay: step(i, 2000, 900) })),
          ],
        };
      }
      const d: any = m, todo: string[] = d.a_faire || [];
      const panels: PanelSpec[] = [];
      if (d.diagramme) panels.push({ id: "pj-diag", zone: "L", width: 880, color: CYAN, title: "Architecture", subtitle: "Archify", delay: 200,
        body: <Diagram name={tx(d.nom).toLowerCase()} title="diagramme" />, flat: true });
      panels.push({ id: "pj-info", zone: d.diagramme ? "R" : "L", width: 520, color: CYAN, title: tx(d.nom), subtitle: [d.langage, `push ${d.dernier_push}`].filter(Boolean).join(" · "), delay: 1200,
        body: <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(230,243,250,.85)" }}>{d.description || d.resume_readme}</div> });
      panels.push({ id: "pj-commits", zone: "R", width: 520, color: ORANGE, title: "Dernières modifications", delay: 3000,
        body: <div>{(d.derniers_commits || []).slice(0, 7).map((c: any, i: number) => <div key={i} style={{ fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: ORANGE, fontFamily: MONO, fontSize: 10, marginRight: 8 }}>{c.date}</span>{c.message}</div>)}</div> });
      if (todo.length) panels.push({ id: "pj-todo", zone: "R", width: 520, color: MAGENTA, title: "Prochaines étapes", subtitle: tx(d.a_faire_source), delay: 5200,
        body: <div>{todo.slice(0, 7).map((t, i) => <div key={i} style={{ fontSize: 12.5, marginBottom: 5 }}>☐ {t}</div>)}</div> });
      return { theme: { title: `Projet · ${tx(d.nom)}`, subtitle: tx(d.description), color: CYAN }, panels };
    }
    case "home": {
      const d: any = m, groups = Object.entries(homeGroups(d));
      return {
        theme: { title: "La maison", subtitle: `${(d.tvs || []).length} télés · lave-linge · Freebox · ${(d.reseau || []).length} appareils sur le réseau`, color: ORANGE },
        panels: [
          { id: "h-tv", zone: "L", width: 520, color: ORANGE, title: "Télévisions", body: <HomeTVs d={d} />, delay: 200 },
          { id: "h-tab", zone: "R", width: 480, color: GREEN, title: "Tablettes des filles", subtitle: "aujourd'hui", body: <HomeTablets d={d} />, delay: 1300 },
          { id: "h-wash", zone: "L", width: 480, color: MAGENTA, title: "Lave-linge", body: <HomeWasher d={d} />, delay: 2600 },
          { id: "h-fbx", zone: "R", width: 440, color: BLUE, title: "Freebox", body: <HomeFreebox d={d} />, delay: 3600 },
          ...groups.map(([g, list], i) => ({ id: `h-net-${g}`, zone: "B" as const, width: 220, color: CYAN, title: g, subtitle: `${(list as any[]).length}`, body: <NetGroup list={list as any[]} />, delay: step(i, 450, 4800) })),
        ],
      };
    }
    case "camera_live": {
      const seen: string[] = (m.objets as string[]) || [], d: any = m.detail || null;
      const YEL = "#ffd700";
      const inv: any[] | null = (m.inventaire as any[]) || null;
      if (m.scan || inv) {
        const ps: PanelSpec[] = [{ id: "live-cam", zone: "L", width: 760, color: CYAN, title: "Caméra en direct", subtitle: inv ? `${inv.length} objets encadrés` : "scan de la surface", delay: 0, body: <LiveCam hidden={!!m.private} /> },
          { id: "live-detail", zone: "R", width: 460, color: YEL, title: inv ? "Inventaire" : "Scan…", subtitle: inv ? `${inv.length} objets` : "toute la largeur, toute la longueur", delay: 0,
            body: <div>
              <AnalyseBar key={inv && !m.scanning ? "scan-done" : `scan-${m.analyse_t}`} done={!!inv && !m.scanning} color={YEL} steps={SCAN_STEPS} />
              {inv && <div style={{ maxHeight: 560, overflow: "hidden", display: "flex", flexDirection: "column-reverse", gap: 6 }}>{inv.map((o, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 10, alignItems: "center",
                padding: 6, borderRadius: 8, border: `1px solid ${i === inv.length - 1 ? YEL : "rgba(255,255,255,.1)"}`, background: "rgba(0,0,0,.25)", animation: "rwIn .35s ease-out both" }}>
                {o.shot ? <img src={`${RELAY}/shot/${o.shot}.png`} alt="" style={{ width: 84, height: 64, objectFit: "contain", background: "#000", borderRadius: 6 }} /> : <div />}
                {o.ok === false
                  ? <div><div style={{ fontSize: 13, color: "rgba(230,243,250,.7)" }}><span style={{ fontFamily: MONO, color: YEL, marginRight: 6 }}>{i + 1}.</span>Identification…</div>
                      <AnalyseBar key={`it-${i}`} color={YEL} /></div>
                  : <div><div style={{ fontSize: 14, fontWeight: 600 }}><span style={{ fontFamily: MONO, color: YEL, marginRight: 6 }}>{i + 1}.</span>{o.nom}
                      <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 11, color: GREEN }}>✓ 100 %</span></div>
                      {o.detail && <div style={{ fontSize: 12, color: "rgba(230,243,250,.65)", lineHeight: 1.35 }}>{o.detail}</div>}</div>}
                </div>)}</div>}
            </div> }];
        return { theme: { title: "Scan de la surface", subtitle: inv ? `${inv.length} objets identifiés` : "balayage en cours", color: YEL }, panels: ps };
      }
      const panels: PanelSpec[] = [{ id: "live-cam", zone: "L", width: 760, color: CYAN, title: m.done ? "Caméra éteinte" : "Caméra en direct",
        subtitle: m.done ? `${seen.length} objet(s) vus` : "montrez-moi un objet", delay: 0,
        body: m.done ? <div style={{ fontSize: 14 }}>Séance terminée.</div> : <LiveCam hidden={!!m.private} /> }];
      const face: any = m.face || null;
      if (face) panels.push({ id: "live-face", zone: "R", width: 420, color: face.known ? GREEN : ORANGE, title: face.known ? tx(face.name) : "Qui est-ce ?",
        subtitle: face.known ? "signature validée" : face.face_found ? "visage inconnu" : "aucun visage", delay: 0,
        body: <Kv color={face.known ? GREEN : ORANGE} rows={[["Résultat", face.known ? `reconnu·e : ${face.name}` : face.face_found ? "pas dans la famille enregistrée" : "personne face à la caméra"],
          ["Confiance", face.known ? `${Math.round((face.confidence as number) * 100)} %` : "—"]]} /> });
      else panels.push({ id: "live-detail", zone: "R", width: 460, color: YEL, title: d ? tx(d.nom).toUpperCase() : m.analyse ? "Analyse…" : "En attente",
        subtitle: d ? "objet identifié" : m.analyse ? `le détecteur voit : ${m.analyse}` : "tenez l'objet face à la caméra", delay: 0,
        body: <div>
          {(d || m.analyse) ? <AnalyseBar key={d ? `done-${d.nom}` : `an-${m.analyse_t}`} done={!!d} color={YEL} /> : null}
          {d?.shot && <img src={`${RELAY}/shot/${d.shot}.png`} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 8, border: `2px solid ${YEL}`, display: "block", animation: "rwIn .4s ease-out both" }} />}
          {d ? <div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 10, animation: "rwIn .5s ease-out .2s both" }}>{tx(d.texte)}</div>
             : m.analyse ? <div style={{ fontSize: 13, color: "rgba(230,243,250,.65)" }}>Je regarde l'objet de près…</div>
             : <div style={{ fontSize: 13.5, color: "rgba(230,243,250,.7)" }}>Un objet à la fois : je l'encadre en jaune, je le regarde de près, et je vous dis ce que c'est.</div>}
        </div> });
      if (seen.length) panels.push({ id: "live-seen", zone: "B", width: 760, color: CYAN, title: "Objets vus", subtitle: `${seen.length}`, delay: 0,
        body: <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{seen.map((o, i) => <span key={i} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12.5,
          border: `1px solid ${i === seen.length - 1 ? YEL : "rgba(255,255,255,.18)"}`, color: i === seen.length - 1 ? YEL : "inherit" }}>{o}</span>)}</div> });
      return { theme: { title: "Reconnaissance d'objets", subtitle: d ? tx(d.nom) : "caméra en direct", color: YEL }, panels };
    }
    case "diagram":
      return { theme: { title: tx(m.title), subtitle: `${m.briques} briques · ${m.connexions} connexions`, color: VIOLET },
        panels: [{ id: `diag-${m.name}`, zone: "L", width: 1180, flat: true, color: VIOLET, title: "Architecture", subtitle: "Archify · vue en direct", delay: 100,
          body: <Diagram name={String(m.name)} title={tx(m.title)} /> }] };
    case "diagram_stack": {
      const items = ((m.items as any[]) || []).map((x) => ({ name: String(x.name), title: tx(x.title) }));
      const cur = items[items.length - 1];
      return { theme: { title: "Les projets", subtitle: cur ? `Diagramme · ${cur.title}` : "", color: VIOLET },
        panels: [{ id: "diag-stack", zone: "L", width: 1000, flat: true, color: VIOLET, title: "Architecture des projets",
          subtitle: `${items.length} diagramme${items.length > 1 ? "s" : ""}${m.building ? " · d'autres en construction" : ""}`, delay: 0,
          body: <DiagramStack items={items} /> }] };
    }
    case "social": {
      const vids: any[] = (m.videos as any[]) || [], post: any = m.post || null;
      const FB = "#4a7bff";
      const panels: PanelSpec[] = [{ id: "social-videos", zone: "L", width: 520, color: FB, title: "Médias prêts", subtitle: vids.length ? `${vids.length} vidéos et images` : "aucun pour l'instant", delay: 100,
        body: vids.length ? <div>{vids.map((v, i) => <div key={v.fichier} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "6px 0",
          borderTop: i ? "1px solid rgba(255,255,255,.06)" : "none", animation: `rwIn .3s ease-out ${i * 0.08}s both` }}>
          <span style={{ fontSize: 13.5 }}>{v.type === "image" ? "🖼" : "🎬"} {v.nom}</span><span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(230,243,250,.55)" }}>{v.date} · {v.taille_mo} Mo</span></div>)}</div>
          : <div style={{ fontSize: 13.5, color: "rgba(230,243,250,.7)" }}>Vos comptes Facebook et LinkedIn sont reliés : texte, photo ou vidéo, je publie avec votre accord.</div> }];
      if (post) panels.push({ id: "social-post", zone: "R", width: 480, color: FB, title: `Post ${tx(post.plateforme)}`, subtitle: "à relire avant publication", delay: 400,
        body: <div><div style={{ fontFamily: MONO, fontSize: 12, color: FB, marginBottom: 8 }}>{post.video ? `📎 ${tx(post.video)}` : "post texte"}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{tx(post.texte) || "texte en préparation…"}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: ORANGE }}>Publication seulement après votre « oui ».</div></div> });
      return { theme: { title: "Réseaux sociaux", subtitle: "Facebook · LinkedIn", color: FB }, panels };
    }
    case "camera_wait":
      return { theme: { title: tx(m.title), subtitle: "face à la caméra", color: CYAN },
        panels: [{ id: "camwait", zone: "R", width: 360, color: CYAN, title: "Caméra", subtitle: "photo dans…", delay: 0,
          body: <div key={String(m.n)} style={{ fontFamily: MONO, fontSize: 96, textAlign: "center", color: CYAN, textShadow: `0 0 24px ${CYAN}`, animation: "rwIn .35s ease-out both" }}>{String(m.n)}</div> }] };
    case "camera_snap":
      return { theme: { title: tx(m.title), subtitle: tx(m.question) || "la caméra, à l'instant", color: CYAN },
        panels: [{ id: `snap-${m.shot}`, zone: "L", width: 680, color: CYAN, title: "Caméra", subtitle: "photo à l'instant", delay: 100,
          body: m.private || !m.shot ? <Hidden what="Photo de la caméra" /> : <img src={`${RELAY}/shot/${m.shot}.png`} alt="" style={{ width: "100%", borderRadius: 8, display: "block", animation: "rwIn .5s ease-out both" }} /> }] };
    case "face": {
      const prof: string[] = (m.profiles as string[]) || [];
      const col = m.known ? GREEN : m.face_found ? ORANGE : "rgba(230,243,250,.5)";
      const panels: PanelSpec[] = [];
      if (m.shot) panels.push({ id: `face-${m.shot}`, zone: "L", width: 620, color: col, title: "Scan facial", subtitle: m.known ? "signature validée" : m.face_found ? "visage inconnu" : "aucun visage", delay: 100,
        body: <img src={`${RELAY}/shot/${m.shot}.png`} alt="" style={{ width: "100%", borderRadius: 8, display: "block" }} /> });
      panels.push({ id: `facer-${m.shot}`, zone: "R", width: 420, color: col, title: m.known ? tx(m.name) : "Qui est-ce ?", delay: 700,
        body: <div><Kv color={col} rows={[["Résultat", m.known ? `reconnu·e : ${m.name}` : m.face_found ? "pas dans la famille enregistrée" : "personne face à la caméra"],
          ["Confiance", m.known ? `${Math.round((m.confidence as number) * 100)} %` : "—"]]} />
          <div style={{ marginTop: 12, fontSize: 12, color: "rgba(230,243,250,.6)" }}>Visages connus</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{prof.length ? prof.map((n) => <span key={n} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12.5,
            border: `1px solid ${n === m.name ? GREEN : "rgba(255,255,255,.18)"}`, color: n === m.name ? GREEN : "inherit" }}>{n}</span>) : <span style={{ fontSize: 12.5 }}>aucun pour l'instant</span>}</div></div> });
      return { theme: { title: "Reconnaissance", subtitle: m.known ? `bonjour ${m.name}` : "scan facial", color: col }, panels };
    }
    case "face_enroll": {
      const pct = Math.min(100, Math.round(((m.samples as number) || 0) / ((m.needed as number) || 8) * 100));
      const col = m.done ? GREEN : CYAN;
      const panels: PanelSpec[] = [{ id: `enr-${m.name}`, zone: "R", width: 440, color: col, title: tx(m.title), subtitle: m.done ? "empreinte faciale acquise" : "regardez la caméra, tournez doucement la tête", delay: 100,
        body: <div><div style={{ fontFamily: MONO, fontSize: 30, color: col, textAlign: "center", margin: "6px 0 10px" }}>{pct} %</div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.08)" }}><div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: col, boxShadow: `0 0 10px ${col}`, transition: "width .8s ease-out" }} /></div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: "rgba(230,243,250,.65)" }}>{String(m.samples || 0)} / {String(m.needed || 8)} échantillons · aucune photo n'est gardée, seulement une empreinte</div></div> }];
      if (m.shot) panels.unshift({ id: `enrs-${m.name}`, zone: "L", width: 600, color: col, title: "Matrice faciale", delay: 50,
        body: <img src={`${RELAY}/shot/${m.shot}.png`} alt="" style={{ width: "100%", borderRadius: 8, display: "block" }} /> });
      return { theme: { title: "Apprentissage d'un visage", subtitle: tx(m.name), color: col }, panels };
    }
    case "vps": {
      const ct: any[] = (m.conteneurs as any[]) || [], al: string[] = (m.alertes as string[]) || [];
      const col = (v: any, lim: number) => v == null ? "rgba(230,243,250,.5)" : v > lim ? "#f2246b" : v > lim * 0.75 ? ORANGE : GREEN;
      const gauge = (lab: string, v: any, lim: number) => <div key={lab} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{lab}</span>
          <span style={{ fontFamily: MONO, color: col(v, lim) }}>{v == null ? "—" : `${v} %`}</span></div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)", marginTop: 4 }}>
          <div style={{ height: 6, borderRadius: 3, width: `${Math.min(100, v || 0)}%`, background: col(v, lim), boxShadow: `0 0 8px ${col(v, lim)}`, transition: "width 1.2s ease-out" }} /></div></div>;
      const ok = m.etat === "running" && !al.length;
      const panels: PanelSpec[] = [
        { id: `vps-${m.n}`, zone: "L", width: 440, color: ok ? GREEN : ORANGE, title: tx(m.nom), subtitle: `${tx(m.systeme)} · ${tx(m.ip)}`, delay: 150,
          body: <div>
            <Kv color={CYAN} rows={[["État", m.etat === "running" ? "en ligne" : tx(m.etat)], ["En service depuis", m.uptime_jours == null ? "—" : `${m.uptime_jours} j`],
              ["Ressources", `${m.cpus ?? "?"} vCPU · ${m.memoire_go} Go · ${m.disque_go} Go`], ["Trafic 24 h", m.trafic_24h_go == null ? "—" : `${m.trafic_24h_go} Go`]]} />
            <div style={{ marginTop: 12 }}>{gauge("Processeur", m.cpu, 80)}{gauge("Mémoire", m.ram, 80)}{gauge("Disque", m.disque, 85)}</div></div> },
        { id: `vpsc-${m.n}`, zone: "R", width: 460, color: CYAN, title: "Charge sur 24 h", subtitle: `pic processeur ${m.cpu_max_24h ?? "—"} %`, delay: 900,
          body: <div><div style={{ fontSize: 11.5, color: CYAN }}>Processeur</div><Spark pts={(m.courbes as any)?.cpu || []} color={CYAN} />
            <div style={{ fontSize: 11.5, color: MAGENTA, marginTop: 10 }}>Mémoire</div><Spark pts={(m.courbes as any)?.ram || []} color={MAGENTA} /></div> },
      ];
      if (ct.length) panels.push({ id: `vpsd-${m.n}`, zone: "R", width: 460, color: ct.every((c) => c.ok) ? GREEN : ORANGE, title: "Services",
        subtitle: `${ct.filter((c) => c.ok).length}/${ct.length} en marche`, delay: 1700,
        body: <div>{ct.map((c, i) => <div key={c.nom} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, padding: "3px 0", animation: `rwIn .3s ease-out ${i * 0.05}s both` }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.ok ? GREEN : "#f2246b", boxShadow: `0 0 6px ${c.ok ? GREEN : "#f2246b"}` }} />
          <span style={{ flex: 1 }}>{c.nom}</span><span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(230,243,250,.55)" }}>{c.statut}</span></div>)}</div> });
      if (al.length) panels.push({ id: `vpsa-${m.n}`, zone: "B", width: 620, color: ORANGE, title: "À surveiller", delay: 2300,
        body: <div>{al.map((a) => <div key={a} style={{ fontSize: 13.5 }}>⚠ {a}</div>)}</div> });
      return { theme: { title: "Santé du VPS", subtitle: ok ? "tout est au vert" : `${al.length} point(s) à surveiller`, color: ok ? GREEN : ORANGE }, panels };
    }
    case "mail": {
      const rows: any[] = (m.rows as any[]) || [];
      return { theme: { title: tx(m.title), subtitle: `${rows.filter((r) => !r.lu).length} non lus sur ${rows.length}`, color: "#ea4335" },
        panels: [{ id: `mail-${m.n}`, zone: "R", width: 600, color: "#ea4335", title: "Mails", delay: 150,
          body: <div>{rows.map((r, i) => <div key={r.uid} style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 10, padding: "7px 0",
            borderTop: i ? "1px solid rgba(255,255,255,.06)" : "none", animation: `rwIn .3s ease-out ${i * 0.06}s both` }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, background: r.lu ? "transparent" : "#ea4335" }} />
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: r.lu ? 400 : 700 }}>{r.de}</div>
              <div style={{ fontSize: 12, color: "rgba(230,243,250,.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.objet}</div></div>
            <span style={{ fontSize: 11, fontFamily: MONO, color: "rgba(230,243,250,.5)" }}>{r.date}</span></div>)}</div> }] };
    }
    case "mail_read":
      return { theme: { title: tx(m.objet), subtitle: `${tx(m.de)} · ${tx(m.date)}`, color: "#ea4335" },
        panels: [{ id: `mailr-${m.n}`, zone: "L", width: 620, color: "#ea4335", title: "Mail", delay: 150,
          body: <div style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap", maxHeight: 520, overflow: "hidden" }}>{tx(m.texte).slice(0, 2500)}</div> }] };
    case "agenda": {
      const evs: any[] = (m.events as any[]) || [];
      return { theme: { title: "Agenda", subtitle: evs.length ? `${evs.length} rendez-vous` : "rien de prévu", color: BLUE },
        panels: [{ id: `ag-${m.n}`, zone: "R", width: 560, color: BLUE, title: "Rendez-vous", delay: 150,
          body: <div>{evs.length ? evs.map((e, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "6px 0",
            borderTop: i ? "1px solid rgba(255,255,255,.06)" : "none", animation: `rwIn .3s ease-out ${i * 0.06}s both` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: BLUE }}>{e.quand}</span>
            <div><div style={{ fontSize: 14 }}>{e.quoi}</div>{e.ou && <div style={{ fontSize: 11.5, color: "rgba(230,243,250,.55)" }}>{e.ou}</div>}</div></div>)
            : <div style={{ fontSize: 14, color: "rgba(230,243,250,.7)" }}>Rien de prévu. Une journée libre.</div>}</div> }] };
    }
    case "document":
      return { theme: { title: tx(m.title), subtitle: `${m.doc_kind === "lettre" ? "Courrier" : "Document"} · ${tx(m.path)}${m.pdf ? " · PDF prêt" : ""}`, color: CYAN },
        panels: [{ id: `doc-${m.n}`, zone: "L", width: 620, color: CYAN, title: m.doc_kind === "lettre" ? "Courrier" : "Document", subtitle: m.pdf ? "Word + PDF" : "Word", body: <Paper m={m} />, delay: 150 }] };
    case "sheet":
      return { theme: { title: tx(m.title), subtitle: `Tableau · ${tx(m.path)}`, color: GREEN },
        panels: [{ id: `sheet-${m.n}`, zone: "R", width: 620, color: GREEN, title: "Tableau", subtitle: `${((m.rows as any[]) || []).length} lignes`, body: <Sheet m={m} />, delay: 150 }] };
    case "capabilities": {
      const fams: any[] = (m.familles as any[]) || [];
      return {
        theme: { title: "Ce que je sais faire", subtitle: "tout, à la voix — sans clavier ni souris", color: CYAN },
        panels: fams.map((f, i) => ({ id: `cap-${i}`, zone: (i % 2 ? "R" : "L") as "L" | "R", width: 480, color: f.couleur, title: f.famille, delay: step(i, 3200, 300),
          body: <div>{(f.exemples || []).map((e: string, k: number) => <div key={k} style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 6, animation: `rwIn .4s ease-out ${k * 0.3}s both` }}>
            <span style={{ color: f.couleur, marginRight: 8 }}>›</span>{e}</div>)}</div> })),
      };
    }
    case "lesson": {
      const fiche: any[] = (m.fiche as any[]) || [], schemas: any[] = (m.schemas as any[]) || [];
      const panels: PanelSpec[] = [];
      schemas.forEach((sc, i) => panels.push({ id: `sch-${sc.img}`, zone: "L", width: 620, color: PINK, title: sc.titre, subtitle: "schéma à légender", body: <Schema sc={sc} />, delay: 300 + i * 2500 }));
      fiche.forEach((part, i) => panels.push({ id: `fi-${i}-${part.titre}`, zone: "R", width: 560, color: PINK, title: part.titre, body: <FichePart part={part} />, delay: 900 + i * 2500 }));
      if (fiche.length > 1 && m.vocabulaire) panels.push({ id: "vocab", zone: "R", width: 560, color: VIOLET, title: "Les mots à connaître", body: <Vocab v={m.vocabulaire as any} />, delay: 900 + fiche.length * 2500 });
      return { theme: { title: tx(m.title), subtitle: fiche.length === 1 ? fiche[0].titre : tx(m.level), color: PINK }, panels };
    }
    case "quiz": {
      const qs: any[] = (m.questions as any[]) || [];
      return { theme: { title: tx(m.title) || "Quiz", subtitle: "clique sur ta réponse ou dis-la à voix haute", color: PINK },
        panels: [{ id: `quiz-${m.n}`, zone: "R", width: 640, color: PINK, title: "À toi de jouer !", body: <Quiz qs={qs} />, delay: 200 }] };
    }
    case "market": {
      const pf: any[] = (m.portefeuilles as any[]) || [];
      const active = pf.filter((p) => (p.stats?.trades_clotures || 0) > 0 || (p.compte?.open_positions || 0) > 0)
        .sort((a, b) => (a.stats?.trades_clotures || 0) - (b.stats?.trades_clotures || 0));
      const open = pf.flatMap((p) => (p.ouvertes || []).map((o: any) => ({ ...o, pf: p.code })))
        .sort((a, b) => Math.abs(a.pnl) - Math.abs(b.pnl));
      const closed = pf.flatMap((p) => p.clotures || []).sort((a, b) => (b.le || "").localeCompare(a.le || ""));
      const total = pf.reduce((t, p) => t + (p.compte?.total_pnl || 0), 0);
      const markets = [...new Set(open.map((o) => o.marche))];
      const panels: PanelSpec[] = [];
      active.forEach((p, i) => panels.push({ id: `acc-${p.code}`, zone: "L", width: 440, color: pnlCol(p.compte?.total_pnl) === GREEN ? GREEN : CYAN,
        title: p.code.replace(/_/g, " "), subtitle: `depuis le ${p.depuis}`, body: <Account p={p} />, delay: step(i, 1600, 300) }));
      open.forEach((o, i) => panels.push({ id: `pos-${o.pf}-${o.symbole}-${i}`, zone: "R", width: 460, color: MKT_COL[o.marche] || CYAN,
        title: o.symbole, subtitle: o.pf.replace(/_/g, " "), body: <Position o={o} />, delay: step(i, 1300, 1200) }));
      if (closed.length) panels.push({ id: "trades", zone: "B", width: 520, color: VIOLET, title: "Derniers trades clôturés", subtitle: `${closed.length}`,
        body: <Trades list={closed} />, delay: 1600 + open.length * 1300 });
      // Bien visible, même sans le son : ce ne sont pas de vrais placements.
      panels.unshift({ id: "virtual-notice", zone: "T", width: 720, color: ORANGE, title: "Portefeuilles virtuels", delay: 0,
        body: <div style={{ fontSize: 14, textAlign: "center" }}>Déployée sur le VPS en phase de test : les stratégies (Ichimoku…) sont validées sur des portefeuilles virtuels, aucun argent réel n'est engagé.</div> });
      return { theme: { title: "IchiVol · Marchés (virtuel)", subtitle: `phase de test · ${pf.length} portefeuilles virtuels · ${open.length} positions ouvertes${markets.length ? ` (${markets.join(", ")})` : ""} · total ${eur(total, true)}`, color: CYAN }, panels };
    }
    case "display": return buildDisplay(m);
    case "password_prompt":
      return { theme: { title: tx(m.title) || "Autorisation", subtitle: tx(m.reason), color: ORANGE },
        panels: m.done ? [] : [{ id: `pw-${m.id}`, zone: "R", width: 520, flat: true, color: ORANGE, title: tx(m.title) || "Autorisation",
          subtitle: "mot de passe requis", delay: 0, body: <PwForm id={String(m.id)} reason={tx(m.reason)} error={!!m.error} /> }] };
    case "launch_board": {
      const wins: any[] = (m.windows as any[]) || [], col = m.done ? (m.ok ? GREEN : "#f2246b") : CYAN;
      return { theme: { title: `Lancement · ${tx(m.name)}`, subtitle: m.done ? (m.ok ? "tout est en ligne" : "à vérifier") : tx(m.now) || "en direct", color: col },
        panels: [
          { id: `lb-${tx(m.name)}`, zone: "L", width: 440, color: col, title: "Ce que je fais", subtitle: m.done ? "✔ terminé" : "en cours", delay: 0,
            body: <Chantier m={{ steps: m.steps, files: [], progress: m.progress || null }} /> },
          ...(wins.length ? [{ id: `lbw-${tx(m.name)}`, zone: "R" as const, width: 1120, flat: true, color: col, title: "Fenêtres", subtitle: tx(m.now) || "", delay: 0,
            body: <WindowStack wins={wins} focus={String(m.focus || "")} /> }] : []),
        ] };
    }
    case "project_recap": {
      const deps: string[] = (m.deps as string[]) || [];
      const panels: PanelSpec[] = [
        { id: `rc-${tx(m.name)}`, zone: "L", width: 520, color: GREEN, title: "Check-list", subtitle: "✔ tout est en place", delay: 100,
          body: <Chantier m={{ ...m, progress: null }} /> },
        { id: `rcl-${tx(m.name)}`, zone: "B", width: 760, color: GREEN, title: "Installé", subtitle: tx(m.commit) || "premier commit", delay: 600,
          body: <Terminal lines={[...deps.map((d) => `✓ ${d}`), `✓ ${m.nb_fichiers} fichiers versionnés`]} /> },
      ];
      if (m.diagram) panels.push({ id: `rcd-${tx(m.name)}`, zone: "R", width: 900, flat: true, color: VIOLET, title: "Architecture",
        subtitle: "Archify", delay: 350, body: <Diagram name={String(m.name).toLowerCase()} title={tx(m.name)} /> });
      return { theme: { title: `Projet ${tx(m.name)}`, subtitle: "prêt à être lancé", color: GREEN }, panels };
    }
    case "workflow": {
      const col = m.done ? (m.ok ? GREEN : "#f2246b") : CYAN;
      return {
        theme: { title: tx(m.title), subtitle: m.done ? (m.ok ? "terminé" : "interrompu") : "en direct", color: col },
        panels: [
          { id: `wf-${tx(m.id)}`, zone: "L", width: 560, color: col, title: "Chantier", subtitle: m.done ? (m.ok ? "✔ terminé" : "✖ interrompu") : "en cours", delay: 100, body: <Chantier m={m} /> },
          { id: `wfl-${tx(m.id)}`, zone: "R", width: 600, color: col, title: "Terminal", subtitle: "en direct", delay: 300, body: <Terminal lines={(m.log as string[]) || []} /> },
        ],
      };
    }
    case "terminal": {
      const lines: string[] = (m.lines as string[]) || [], col = m.done ? (m.ok ? GREEN : "#f2246b") : ORANGE;
      return {
        theme: { title: tx(m.title), subtitle: m.done ? (m.ok ? "en ligne" : "échec") : "en cours sur le VPS de production", color: col },
        panels: [{ id: `term-${tx(m.id)}`, zone: "R", width: 680, color: col, title: "Terminal · VPS", subtitle: m.done ? (m.ok ? "✓ terminé" : "✗ échec") : "en direct", delay: 100,
          body: <Terminal lines={lines} /> }],
      };
    }
    case "youtube": case "flights": case "plex": case "camera": {
      const meta = m.kind === "youtube" ? ["YouTube", "#f2246b"] : m.kind === "flights" ? ["Le ciel en direct", BLUE] : m.kind === "camera" ? ["Caméra du salon", CYAN] : ["Plex", ORANGE];
      return {
        theme: { title: meta[0], subtitle: tx(m.title), color: meta[1] },
        panels: [{ id: `md-${m.kind}`, zone: "R", width: 720, color: meta[1], title: meta[0], subtitle: tx(m.title), delay: 150,
          body: <div style={{ aspectRatio: "16 / 9", background: "#000" }}><MediaBody media={m} /></div> }],
      };
    }
  }
  return null;
}

/** Résultat d'un outil sans scène dédiée : une fenêtre simple. */
export function kvPanel(id: string, title: string, color: string, rows: [string, string][], zone: "L" | "R"): PanelSpec {
  return { id, zone, width: 420, color, title, body: <Kv rows={rows} color={color} /> };
}

export const SCENE_CSS = `@keyframes scKen { from { transform: scale(1.12) } to { transform: scale(1) } }`;
