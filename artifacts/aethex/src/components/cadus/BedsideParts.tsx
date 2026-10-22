/** Small pieces shared by the update-15 tools: grouped presets, patient details, saved lists. */
import type { ReactNode } from "react";
import type { RxPatient } from "@/lib/cadus/labs";

export function PresetPicker({ groups, value, onPick, testId }: { groups: { group: string; items: string[] }[]; value: string; onPick: (v: string) => void; testId: string }) {
  return (
    <div className="cx-bs-presets" data-bs={testId}>
      {groups.map((g) => (
        <div key={g.group} className="cx-bs-pg">
          <span>{g.group}</span>
          <div>{g.items.map((it) => <button key={it} className={value === it ? "on" : ""} onClick={() => onPick(it)} aria-pressed={value === it}>{it}</button>)}</div>
        </div>
      ))}
    </div>
  );
}

export function PatientFields({ p, set, show = ["age", "sex", "weight", "egfr", "allergies", "pregnant"] }: { p: RxPatient; set: (x: Partial<RxPatient>) => void; show?: string[] }) {
  const num = (v: string) => v.replace(/[^\d.]/g, "").slice(0, 6);
  return (
    <div className="cx-mr-pt cx-bs-pt">
      {show.includes("age") && <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="decimal" value={p.age} onChange={(e) => set({ age: num(e.target.value) })} placeholder="years" data-bs="age" /></label>}
      {show.includes("sex") && <label className="cx-field"><span>Sex</span><select className="cx-select" value={p.sex} onChange={(e) => set({ sex: e.target.value as RxPatient["sex"] })} data-bs="sex"><option value="">Not given</option><option value="M">Male</option><option value="F">Female</option></select></label>}
      {show.includes("weight") && <label className="cx-field"><span>Weight</span><input className="cx-input" inputMode="decimal" value={p.weightKg} onChange={(e) => set({ weightKg: num(e.target.value) })} placeholder="kg" data-bs="weight" /></label>}
      {show.includes("egfr") && <label className="cx-field"><span>eGFR</span><input className="cx-input" inputMode="decimal" value={p.egfr} onChange={(e) => set({ egfr: num(e.target.value) })} placeholder="mL/min" data-bs="egfr" /></label>}
      {show.includes("allergies") && <label className="cx-field"><span>Allergies</span><input className="cx-input" value={p.allergies} onChange={(e) => set({ allergies: e.target.value.slice(0, 300) })} placeholder="e.g. penicillin (rash)" data-bs="allergies" /></label>}
      {show.includes("pregnant") && p.sex !== "M" && <label className="cx-field"><span>Pregnant</span><select className="cx-select" value={p.pregnant} onChange={(e) => set({ pregnant: e.target.value as RxPatient["pregnant"] })}><option value="unknown">Not known</option><option value="no">No</option><option value="yes">Yes</option></select></label>}
    </div>
  );
}

export function SavedList<T extends { id: string; at: number }>({ title, items, openId, onOpen, render }: { title: string; items: T[]; openId: string; onOpen: (id: string) => void; render: (x: T) => { b: ReactNode; s: ReactNode } }) {
  if (!items.length) return null;
  return (
    <div className="cx-lf-saved">
      <p className="cx-gl"><span>{title}</span></p>
      {items.slice(0, 8).map((x) => { const r = render(x); return <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => onOpen(x.id)}><b>{r.b}</b><small>{r.s} · {new Date(x.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>; })}
    </div>
  );
}

export const Bullets = ({ title, items, ordered, tone }: { title: string; items: string[]; ordered?: boolean; tone?: "ok" | "warn" | "bad" }) =>
  items.length ? (
    <div className={`cx-sim-card ${tone ?? ""}`}><h3>{title}</h3>{ordered ? <ol>{items.map((x) => <li key={x}>{x}</li>)}</ol> : <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>}</div>
  ) : null;

/** A small JPEG preview of an image data URL (kept instead of the full photo). */
export function thumbnail(dataUrl: string, width = 360): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image/")) { resolve(""); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, width / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      } catch { resolve(""); }
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}
