"use client";

/**
 * Fenêtre Maison : les TV (appli en cours), le lave-linge, la Freebox, le temps
 * d'écran (estimé) des tablettes des filles, et le réseau avec chaque appareil
 * connecté. Données : outil home_overview (Home Assistant + balayage réseau).
 */
import { loc } from "./locale";
import {
  Tv, WashingMachine, Router, Tablet, Smartphone, Printer, Server, Monitor, Laptop, Cpu, Wifi, PhoneMissed, ArrowDown, ArrowUp,
  Thermometer, type LucideIcon,
} from "lucide-react";

const CYAN = "#59ebff", ORANGE = "#ff941f", MAGENTA = "#c13fe0", GREEN = "#34d399", RED = "#f2246b", BLUE = "#6b8cff";
const MONO = "ui-monospace, monospace";

export function deviceIcon(d: any): [LucideIcon, string] {
  const s = `${d.nom} ${d.fabricant} ${d.modele}`.toLowerCase();
  if (d.routeur || /freebox|repeteur|répéteur|airport/.test(s)) return [Router, "Box et réseau"];
  if (/appletv|apple tv|chambre|bravia|samsung tv|tv\b/.test(s)) return [Tv, "Télévisions"];
  if (/washer|lave|samjin/.test(s)) return [WashingMachine, "Électroménager"];
  if (/print|imprim|epson|canon|brother|hp ?(laser|desk|office)/.test(s)) return [Printer, "Imprimantes"];
  if (/ipad|tab|tablet/.test(s)) return [Tablet, "Tablettes"];
  if (/android|galaxy|iphone|a26|phone|randomised/.test(s)) return [Smartphone, "Téléphones"];
  if (/proliant|ilo|hewlett packard enterprise|nuc|server/.test(s) || d.moi) return [Server, "Serveurs"];
  if (/raspberry|salon/.test(s)) return [Cpu, "Objets connectés"];
  if (/lenovo|desktop|laptop|intel/.test(s)) return [Laptop, "Ordinateurs"];
  return [Monitor, "Autres"];
}

const Title = ({ children, color = CYAN }: { children: React.ReactNode; color?: string }) => (
  <div style={{ fontSize: 9.5, letterSpacing: "0.28em", color: `${color}cc`, fontFamily: MONO, margin: "4px 0 8px" }}>{children}</div>
);
const Card = ({ children, color = CYAN }: { children: React.ReactNode; color?: string }) => (
  <div style={{ padding: "10px 12px", borderRadius: 10, background: `${color}0c`, border: `1px solid ${color}2e`, marginBottom: 10 }}>{children}</div>
);
const Dot = ({ on }: { on: boolean }) => <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? GREEN : "#3b4757", boxShadow: on ? `0 0 8px ${GREEN}` : "none", display: "inline-block" }} />;

export const homeGroups = (d: any) => {
  const groups: Record<string, any[]> = {};
  (d.reseau || []).forEach((x: any) => { const [, g] = deviceIcon(x); (groups[g] ||= []).push(x); });
  return groups;
};

export function HomeTVs({ d }: { d: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {(d.tvs || []).map((t: any) => (
        <Card key={t.nom} color={t.allumee ? ORANGE : BLUE}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Tv size={15} color={t.allumee ? ORANGE : "#56657a"} /><Dot on={t.allumee} />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{t.nom}</span></div>
          <div style={{ fontSize: 11, marginTop: 6, color: t.allumee ? "#fff" : "rgba(255,255,255,.4)" }}>
            {t.allumee ? (t.app ? `▶ ${t.app}${t.titre ? ` · ${t.titre}` : ""}` : t.etat && t.etat !== "unavailable" ? t.etat : "allumée") : "éteinte"}</div>
        </Card>
      ))}
    </div>
  );
}

export function HomeWasher({ d }: { d: any }) {
  const fin = d.lave_linge?.fin ? new Date(d.lave_linge.fin) : null;
  const finTxt = fin && fin > new Date() ? `fin à ${fin.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" })}` : "";
  const enMarche = d.lave_linge?.etat && d.lave_linge.etat !== "stop";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <WashingMachine size={40} color={enMarche ? MAGENTA : "#56657a"} style={enMarche ? { animation: "hwSpin 2s linear infinite" } : {}} />
      <div>
        <div style={{ fontSize: 15 }}>{enMarche ? `En marche · ${d.lave_linge.tache ?? ""}` : "À l'arrêt"}</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>{finTxt || (d.lave_linge?.connecte ? "connecté" : "hors ligne")}
          {enMarche && d.lave_linge.puissance_w ? ` · ${d.lave_linge.puissance_w} W` : ""}</div>
      </div>
      <style>{`@keyframes hwSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function HomeFreebox({ d }: { d: any }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, fontSize: 13, fontFamily: MONO }}>
        <span><Wifi size={14} color={d.freebox?.internet ? GREEN : RED} /> {d.freebox?.internet ? "internet" : "coupé"}</span>
        <span><Thermometer size={14} color={RED} /> {d.freebox?.temperature ?? "—"}°</span>
        <span><ArrowDown size={14} color={CYAN} /> {d.freebox?.debit_down ?? "—"}</span>
        <span><ArrowUp size={14} color={ORANGE} /> {d.freebox?.debit_up ?? "—"}</span>
      </div>
      {Number(d.freebox?.appels_manques) > 0 && <div style={{ marginTop: 8, fontSize: 11.5, color: ORANGE }}>
        <PhoneMissed size={13} /> {d.freebox.appels_manques} appels manqués</div>}
    </div>
  );
}

export function HomeTablets({ d }: { d: any }) {
  const maxMin = Math.max(120, ...(d.tablettes || []).map((t: any) => t.minutes || 0));
  return (
    <div>
      {(d.tablettes || []).map((t: any) => {
        const m = t.minutes ?? 0, col = m < 60 ? GREEN : m < 120 ? ORANGE : RED;
        return (
          <div key={t.nom} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
              <Tablet size={15} color={col} /><Dot on={t.allumee} /> {t.nom}
              <span style={{ marginLeft: "auto", fontFamily: MONO, color: col }}>{t.minutes == null ? "—" : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.07)", marginTop: 4 }}>
              <div style={{ height: 5, borderRadius: 3, width: `${Math.min(100, (m / maxMin) * 100)}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.35)" }}>Durée active sur le Wi-Fi — pas le « Temps d'écran » d'Apple.</div>
    </div>
  );
}

export function NetGroup({ list }: { list: any[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {list.slice(0, 7).map((x: any) => { const [Ic] = deviceIcon(x); return (
        <div key={x.ip} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5 }}>
          <Ic size={13} color={CYAN} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.nom && x.nom.length < 28 ? x.nom : x.modele || x.fabricant || x.ip}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,.4)" }}>{String(x.ip).split(".").pop()}</span>
        </div>); })}
      {list.length > 7 && <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", fontFamily: MONO }}>+ {list.length - 7}</div>}
    </div>
  );
}

export default function HomeWindow({ d }: { d: any }) {
  const fin = d.lave_linge?.fin ? new Date(d.lave_linge.fin) : null;
  const finTxt = fin && fin > new Date() ? `fin à ${fin.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" })}` : "";
  const enMarche = d.lave_linge?.etat && d.lave_linge.etat !== "stop";
  const groups: Record<string, any[]> = {};
  (d.reseau || []).forEach((x: any) => { const [, g] = deviceIcon(x); (groups[g] ||= []).push(x); });
  const maxMin = Math.max(120, ...(d.tablettes || []).map((t: any) => t.minutes || 0));

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, color: "#e6f3fa", fontFamily: "system-ui, sans-serif" }}>
      <div>
        <Title>TÉLÉVISIONS</Title>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {(d.tvs || []).map((t: any) => (
            <Card key={t.nom} color={t.allumee ? ORANGE : BLUE}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Tv size={15} color={t.allumee ? ORANGE : "#56657a"} /><Dot on={t.allumee} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{t.nom}</span></div>
              <div style={{ fontSize: 11, marginTop: 6, color: t.allumee ? "#fff" : "rgba(255,255,255,.4)" }}>
                {t.allumee ? (t.app ? `▶ ${t.app}${t.titre ? ` · ${t.titre}` : ""}` : t.etat && t.etat !== "unavailable" ? t.etat : "allumée") : "éteinte"}</div>
            </Card>
          ))}
        </div>

        <Title color={MAGENTA}>LAVE-LINGE</Title>
        <Card color={MAGENTA}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <WashingMachine size={30} color={enMarche ? MAGENTA : "#56657a"} style={enMarche ? { animation: "hwSpin 2s linear infinite" } : {}} />
            <div>
              <div style={{ fontSize: 14 }}>{enMarche ? `En marche · ${d.lave_linge.tache ?? ""}` : "À l'arrêt"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{finTxt || (d.lave_linge?.connecte ? "connecté" : "hors ligne")}
                {enMarche && d.lave_linge.puissance_w ? ` · ${d.lave_linge.puissance_w} W` : ""}</div>
            </div>
          </div>
        </Card>

        <Title color={BLUE}>FREEBOX</Title>
        <Card color={BLUE}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 12, fontFamily: MONO }}>
            <span><Wifi size={13} color={d.freebox?.internet ? GREEN : RED} /> {d.freebox?.internet ? "internet" : "coupé"}</span>
            <span><ArrowDown size={13} color={CYAN} /> {d.freebox?.debit_down ?? "—"}</span>
            <span><ArrowUp size={13} color={ORANGE} /> {d.freebox?.debit_up ?? "—"}</span>
            <span><Thermometer size={13} color={RED} /> {d.freebox?.temperature ?? "—"}°</span>
          </div>
          {Number(d.freebox?.appels_manques) > 0 && <div style={{ marginTop: 8, fontSize: 11.5, color: ORANGE }}>
            <PhoneMissed size={13} /> {d.freebox.appels_manques} appels manqués</div>}
        </Card>
      </div>

      <div>
        <Title color={GREEN}>TABLETTES · TEMPS D'ÉCRAN AUJOURD'HUI (ESTIMÉ)</Title>
        <Card color={GREEN}>
          {(d.tablettes || []).map((t: any) => {
            const m = t.minutes ?? 0, col = m < 60 ? GREEN : m < 120 ? ORANGE : RED;
            return (
              <div key={t.nom} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                  <Tablet size={14} color={col} /><Dot on={t.allumee} /> {t.nom}
                  <span style={{ marginLeft: "auto", fontFamily: MONO, color: col }}>{t.minutes == null ? "—" : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.07)", marginTop: 4 }}>
                  <div style={{ height: 5, borderRadius: 3, width: `${Math.min(100, (m / maxMin) * 100)}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.35)" }}>Durée où la tablette était active sur le Wi-Fi — pas le « Temps d'écran » d'Apple.</div>
        </Card>

        <Title>RÉSEAU · {(d.reseau || []).length} APPAREILS</Title>
        {Object.entries(groups).map(([g, list]) => (
          <div key={g} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>{g}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {list.map((x: any) => { const [Ic] = deviceIcon(x); return (
                <span key={x.ip} title={`${x.ip} · ${x.fabricant}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 12,
                  fontSize: 10.5, background: "rgba(89,235,255,.06)", border: "1px solid rgba(89,235,255,.18)" }}>
                  <Ic size={12} color={CYAN} /> {x.nom && x.nom.length < 28 ? x.nom : x.modele || x.fabricant || x.ip}</span>); })}
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes hwSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
