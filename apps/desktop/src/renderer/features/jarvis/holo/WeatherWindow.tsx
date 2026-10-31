"use client";

/**
 * Fenêtre météo (demande « agrandie ») : maintenant en grand, alertes (orages,
 * fortes pluies, vent violent), courbe des températures sur 24 h avec la pluie
 * en barres, tableau 7 jours avec barres min/max. Données : Open-Meteo, envoyées
 * par l'outil weather du Core.
 */
import { loc } from "./locale";
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Droplets, Wind, TriangleAlert, Thermometer } from "lucide-react";

const CYAN = "#59ebff", BLUE = "#3861f2", MAGENTA = "#c13fe0", RED = "#f2246b", ORANGE = "#ff941f";
const WMO: Record<number, string> = { 0: "Ciel dégagé", 1: "Plutôt dégagé", 2: "Partiellement nuageux", 3: "Couvert", 45: "Brouillard", 48: "Brouillard givrant",
  51: "Bruine légère", 53: "Bruine", 55: "Bruine forte", 61: "Pluie faible", 63: "Pluie", 65: "Forte pluie", 71: "Neige faible", 73: "Neige", 75: "Forte neige",
  80: "Averses", 81: "Averses", 82: "Fortes averses", 95: "Orages", 96: "Orages et grêle", 99: "Orages et grêle" };
const icon = (c: number) => c >= 95 ? CloudLightning : c >= 71 && c <= 77 ? CloudSnow : c >= 61 || c >= 80 ? CloudRain : c >= 51 ? CloudDrizzle
  : c >= 45 ? CloudFog : c === 3 ? Cloud : c >= 1 ? CloudSun : Sun;
const tempColor = (t: number) => (t <= 0 ? CYAN : t <= 10 ? BLUE : t <= 18 ? MAGENTA : t <= 26 ? ORANGE : RED);
const day = (iso: string, i: number) => (i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : new Date(iso).toLocaleDateString(loc(), { weekday: "long" }));

export type W = { place: string; current: any; hourly: any; daily: any };

export function HourlyChart({ h }: { h: any }) {
  const W = 680, H = 150, P = 26;
  const t: number[] = h.temperature_2m, rain: number[] = h.precipitation_probability, n = t.length;
  const lo = Math.floor(Math.min(...t) - 1), hi = Math.ceil(Math.max(...t) + 1);
  const x = (i: number) => P + (i / (n - 1)) * (W - 2 * P), y = (v: number) => H - 34 - ((v - lo) / (hi - lo || 1)) * (H - 64);
  const line = t.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="wt" x1="0" x2="1"><stop offset="0" stopColor={CYAN} /><stop offset=".5" stopColor={MAGENTA} /><stop offset="1" stopColor={ORANGE} /></linearGradient>
        <linearGradient id="wf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={MAGENTA} stopOpacity=".28" /><stop offset="1" stopColor={MAGENTA} stopOpacity="0" /></linearGradient>
      </defs>
      {rain.map((r, i) => r > 0 && <rect key={i} x={x(i) - 6} y={H - 22 - (r / 100) * 40} width={12} height={(r / 100) * 40} rx={2} fill={BLUE} opacity={0.25 + r / 200} />)}
      <path d={`${line} L${x(n - 1)} ${H - 22} L${x(0)} ${H - 22} Z`} fill="url(#wf)" />
      <path d={line} fill="none" stroke="url(#wt)" strokeWidth={2.5} style={{ filter: `drop-shadow(0 0 6px ${MAGENTA})` }} />
      {t.map((v, i) => i % 3 === 0 && (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={3} fill={tempColor(v)} />
          <text x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize={11} fill="#fff">{Math.round(v)}°</text>
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,.5)" fontFamily="ui-monospace, monospace">
            {String(h.time[i]).slice(11, 13)}h</text>
          {rain[i] >= 20 && <text x={x(i)} y={H - 26 - (rain[i] / 100) * 40} textAnchor="middle" fontSize={9} fill={CYAN}>{rain[i]}%</text>}
        </g>
      ))}
    </svg>
  );
}

/** Blocs séparés pour la mise en scène (une fenêtre chacun). */
export function WeatherNow({ w }: { w: W }) {
  const c = w.current, d = w.daily, Ic = icon(c.weather_code);
  const alerts = weatherAlerts(d);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Ic size={58} color={tempColor(c.temperature_2m)} style={{ filter: `drop-shadow(0 0 14px ${tempColor(c.temperature_2m)})` }} />
        <div>
          <div style={{ fontSize: 50, fontWeight: 200, lineHeight: 1 }}>{Math.round(c.temperature_2m)}°</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{WMO[c.weather_code] ?? ""} · {w.place}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: "rgba(255,255,255,.75)", fontFamily: "ui-monospace, monospace" }}>
        <span><Thermometer size={13} color={MAGENTA} /> {Math.round(c.apparent_temperature)}°</span>
        <span><Droplets size={13} color={CYAN} /> {c.relative_humidity_2m}%</span>
        <span><Wind size={13} color={BLUE} /> {Math.round(c.wind_speed_10m)} km/h</span>
      </div>
      {alerts.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {alerts.slice(0, 3).map((a) => <span key={a.txt} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 20, fontSize: 11,
          background: `${a.col}22`, border: `1px solid ${a.col}88` }}><TriangleAlert size={12} color={a.col} /> {a.txt}</span>)}
      </div>}
    </div>
  );
}

export function WeatherWeek({ w }: { w: W }) {
  const d = w.daily, lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max);
  return <div>{d.time.map((iso: string, i: number) => {
    const DI = icon(d.weather_code[i]), mn = d.temperature_2m_min[i], mx = d.temperature_2m_max[i];
    const left = ((mn - lo) / (hi - lo || 1)) * 100, width = ((mx - mn) / (hi - lo || 1)) * 100;
    return (
      <div key={iso} style={{ display: "grid", gridTemplateColumns: "88px 24px 34px 1fr 34px 48px", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? "1px solid rgba(255,255,255,.06)" : "none", fontSize: 12.5 }}>
        <span style={{ textTransform: "capitalize" }}>{day(iso, i)}</span><DI size={17} color={d.weather_code[i] >= 95 ? RED : CYAN} />
        <span style={{ textAlign: "right", color: "rgba(255,255,255,.55)" }}>{Math.round(mn)}°</span>
        <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)" }}>
          <div style={{ position: "absolute", left: `${left}%`, width: `${Math.max(4, width)}%`, top: 0, bottom: 0, borderRadius: 3, background: `linear-gradient(90deg, ${tempColor(mn)}, ${tempColor(mx)})` }} /></div>
        <span>{Math.round(mx)}°</span>
        <span style={{ color: CYAN, fontSize: 11, fontFamily: "ui-monospace, monospace" }}>{d.precipitation_probability_max[i]}%</span>
      </div>);
  })}</div>;
}

function weatherAlerts(d: any): { txt: string; col: string }[] {
  const out: { txt: string; col: string }[] = [];
  d.time.forEach((iso: string, i: number) => {
    if (d.weather_code[i] >= 95) out.push({ txt: `Orages ${day(iso, i).toLowerCase()}`, col: RED });
    else if (d.precipitation_sum[i] >= 10) out.push({ txt: `Fortes pluies ${day(iso, i).toLowerCase()}`, col: ORANGE });
    if (d.wind_gusts_10m_max[i] >= 60) out.push({ txt: `Rafales ${Math.round(d.wind_gusts_10m_max[i])} km/h ${day(iso, i).toLowerCase()}`, col: ORANGE });
  });
  return out;
}

export default function WeatherWindow({ w }: { w: W }) {
  const c = w.current, d = w.daily, h = w.hourly, Ic = icon(c.weather_code);
  const lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max);
  // Alertes : orages, fortes pluies, rafales.
  const alerts: { txt: string; col: string }[] = [];
  d.time.forEach((iso: string, i: number) => {
    if (d.weather_code[i] >= 95) alerts.push({ txt: `Orages ${day(iso, i).toLowerCase()}`, col: RED });
    else if (d.precipitation_sum[i] >= 10) alerts.push({ txt: `Fortes pluies ${day(iso, i).toLowerCase()} (${Math.round(d.precipitation_sum[i])} mm)`, col: ORANGE });
    if (d.wind_gusts_10m_max[i] >= 60) alerts.push({ txt: `Rafales à ${Math.round(d.wind_gusts_10m_max[i])} km/h ${day(iso, i).toLowerCase()}`, col: ORANGE });
  });
  return (
    <div style={{ height: "100%", overflow: "auto", padding: "14px 18px", color: "#e6f3fa", fontFamily: "system-ui, sans-serif" }}>
      {/* maintenant */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Ic size={64} color={tempColor(c.temperature_2m)} style={{ filter: `drop-shadow(0 0 14px ${tempColor(c.temperature_2m)})` }} />
        <div>
          <div style={{ fontSize: 54, fontWeight: 200, lineHeight: 1 }}>{Math.round(c.temperature_2m)}°</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{WMO[c.weather_code] ?? ""} · {w.place}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "grid", gap: 6, fontSize: 12, color: "rgba(255,255,255,.75)", fontFamily: "ui-monospace, monospace" }}>
          <span><Thermometer size={13} color={MAGENTA} /> ressenti {Math.round(c.apparent_temperature)}°</span>
          <span><Droplets size={13} color={CYAN} /> humidité {c.relative_humidity_2m}%</span>
          <span><Wind size={13} color={BLUE} /> vent {Math.round(c.wind_speed_10m)} km/h</span>
        </div>
      </div>
      {/* alertes */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {alerts.slice(0, 4).map((a) => (
            <span key={a.txt} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, fontSize: 11.5,
              background: `${a.col}22`, border: `1px solid ${a.col}88`, color: "#fff", animation: "wxBlink 2s ease-in-out infinite" }}>
              <TriangleAlert size={13} color={a.col} /> {a.txt}</span>
          ))}
        </div>
      )}
      {/* 24 heures */}
      <div style={{ fontSize: 9.5, letterSpacing: "0.3em", color: `${CYAN}aa`, margin: "14px 0 4px", fontFamily: "ui-monospace, monospace" }}>PROCHAINES 24 HEURES</div>
      <HourlyChart h={h} />
      {/* 7 jours */}
      <div style={{ fontSize: 9.5, letterSpacing: "0.3em", color: `${CYAN}aa`, margin: "10px 0 6px", fontFamily: "ui-monospace, monospace" }}>7 JOURS</div>
      {d.time.map((iso: string, i: number) => {
        const DI = icon(d.weather_code[i]), mn = d.temperature_2m_min[i], mx = d.temperature_2m_max[i];
        const left = ((mn - lo) / (hi - lo || 1)) * 100, width = ((mx - mn) / (hi - lo || 1)) * 100;
        return (
          <div key={iso} style={{ display: "grid", gridTemplateColumns: "92px 28px 46px 1fr 34px 56px 66px", alignItems: "center", gap: 8,
            padding: "5px 0", borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 12.5 }}>
            <span style={{ textTransform: "capitalize" }}>{day(iso, i)}</span>
            <DI size={18} color={d.weather_code[i] >= 95 ? RED : CYAN} />
            <span style={{ textAlign: "right", color: "rgba(255,255,255,.55)" }}>{Math.round(mn)}°</span>
            <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)" }}>
              <div style={{ position: "absolute", left: `${left}%`, width: `${Math.max(4, width)}%`, top: 0, bottom: 0, borderRadius: 3,
                background: `linear-gradient(90deg, ${tempColor(mn)}, ${tempColor(mx)})` }} />
            </div>
            <span>{Math.round(mx)}°</span>
            <span style={{ color: CYAN, fontSize: 11, fontFamily: "ui-monospace, monospace" }}><Droplets size={11} /> {d.precipitation_probability_max[i]}%</span>
            <span style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontFamily: "ui-monospace, monospace" }}><Wind size={11} /> {Math.round(d.wind_gusts_10m_max[i])}</span>
          </div>
        );
      })}
      <style>{`@keyframes wxBlink{50%{opacity:.6}}`}</style>
    </div>
  );
}
