/**
 * Small shared pieces for the update 50 tools: tick boxes, number fields and the coloured plan box.
 */
import type { ReactNode } from "react";

export function Tick({ on, set, label, data }: { on: boolean; set: (v: boolean) => void; label: string; data: string }) {
  return <label className="cx-pa-mine"><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} data-t={data} /> {label}</label>;
}

export function NumField({ label, value, set, placeholder, data, max = 9999, decimals = false }: { label: string; value: number; set: (n: number) => void; placeholder?: string; data: string; max?: number; decimals?: boolean }) {
  return (
    <label className="cx-field"><span>{label}</span>
      <input className="cx-input" inputMode={decimals ? "decimal" : "numeric"} value={value || ""} placeholder={placeholder}
        onChange={(e) => { const v = Number(e.target.value.replace(decimals ? /[^\d.]/g : /\D/g, "").slice(0, 8)) || 0; set(Math.min(max, v)); }} data-t={data} />
    </label>
  );
}

export function PlanOut({ urgency, steps, data, children }: { urgency: "emergency" | "urgent" | "routine"; steps: string[]; data: string; children?: ReactNode }) {
  return (
    <div className={`cx-cmp-out ${urgency === "emergency" ? "cx-st-out" : urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-t={data} data-urgency={urgency}>
      {children}
      <ol className="cx-c23-steps">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
    </div>
  );
}
