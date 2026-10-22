/**
 * Antibiotic Guide: the infection, the setting and the patient in; empiric regimens out,
 * with doses adjusted for the kidneys, weight, pregnancy and allergy, what to send before the
 * first dose and when to review. Follows ICMR guidance and the hospital's antibiotic policy.
 */
import { useEffect, useState } from "react";
import { Copy, FlaskConical, Pill, Printer, ShieldAlert, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { blankRxPatient, rxPatientPayload, rxPatientSummary, type RxPatient } from "@/lib/cadus/labs";
import { ABX_RISKS, abxMarkdown, INFECTIONS, readAbx, saveAbx, type AbxRecord } from "@/lib/cadus/clinicalAi";
import { sid } from "@/lib/cadus/studio";
import { Bullets, PatientFields, PresetPicker, SavedList } from "./BedsideParts";

export default function AntibioticView({ generate, friendlyError, toast, onPrint, hasPolicy }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  hasPolicy: boolean;
}) {
  const [infection, setInfection] = useState("");
  const [setting, setSetting] = useState<"community" | "ward" | "icu">("ward");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [patient, setPatient] = useState<RxPatient>(blankRxPatient);
  const [risks, setRisks] = useState<string[]>([]);
  const [culture, setCulture] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<AbxRecord[]>(readAbx);
  const [openId, setOpenId] = useState("");
  useEffect(() => saveAbx(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;

  const run = async () => {
    if (infection.trim().length < 3) { toast("Choose or type the infection"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "antibiotic", infection: deidentify(infection).text, setting, severity, patient: rxPatientPayload(patient), risks, culture: deidentify(culture).text });
      if (!r?.result?.regimens?.length) throw new Error("No regimen came back");
      const rec: AbxRecord = { id: sid(), at: Date.now(), infection: infection.trim(), setting: setting === "community" ? "OPD" : setting === "icu" ? "ICU" : "Ward", severity, patient: rxPatientSummary(patient), result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const x = open?.result;
  return (
    <section className="cx-page cx-bs cx-abx">
      <header className="cx-page-h"><div><h1>Antibiotic Guide</h1><p>Empiric antibiotics for the infection in front of you, with doses adjusted for the patient, what to send first and when to step down. Follows ICMR guidance{hasPolicy ? " and your hospital's antibiotic policy" : ""}.</p></div></header>
      <PresetPicker groups={INFECTIONS} value={infection} onPick={setInfection} testId="infections" />
      <input className="cx-input" value={infection} onChange={(e) => setInfection(e.target.value.slice(0, 160))} placeholder="Or type the infection, e.g. cellulitis with abscess" aria-label="Infection" data-abx="infection" />
      <div className="cx-bs-row">
        <div className="cx-field"><span>Setting</span><div className="cx-seg">{([["community", "OPD"], ["ward", "Ward"], ["icu", "ICU"]] as const).map(([k, l]) => <button key={k} className={setting === k ? "on" : ""} onClick={() => setSetting(k)} data-abx-setting={k}>{l}</button>)}</div></div>
        <div className="cx-field"><span>Severity</span><div className="cx-seg">{(["mild", "moderate", "severe"] as const).map((k) => <button key={k} className={severity === k ? "on" : ""} onClick={() => setSeverity(k)} data-abx-sev={k}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div></div>
      </div>
      <PatientFields p={patient} set={(p) => setPatient((x) => ({ ...x, ...p }))} />
      <div className="cx-bs-chips" data-abx="risks">{ABX_RISKS.map((r) => <button key={r} className={risks.includes(r) ? "on" : ""} aria-pressed={risks.includes(r)} onClick={() => setRisks((l) => (l.includes(r) ? l.filter((y) => y !== r) : [...l, r]))}>{r}</button>)}</div>
      <input className="cx-input" value={culture} onChange={(e) => setCulture(e.target.value.slice(0, 2000))} placeholder="Culture result, if any: e.g. E. coli, ESBL, sensitive to nitrofurantoin and meropenem" aria-label="Culture result" data-abx="culture" />
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || infection.trim().length < 3} data-abx="go"><Pill size={15} /> {busy ? "Choosing antibiotics…" : "Suggest antibiotics"}</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Check doses against your formulary before prescribing. Send cultures before the first dose where you can.</p>

      {x && open ? (
        <div className="cx-cmp-out" data-abx="out">
          <div className="cx-rxc-verdict v-review"><FlaskConical size={22} /><div><b>{open.infection}</b><p>{x.summary}</p></div></div>
          <div className="cx-abx-regs">
            {x.regimens.map((g, i) => (
              <article key={i} className={`cx-abx-reg ${i === 0 ? "first" : ""}`} data-abx-reg={i}>
                <div className="cx-abx-h"><b>{g.label}</b>{g.duration && <em>{g.duration}</em>}</div>
                <ul>{g.drugs.map((d, n) => <li key={n}><b>{d.name}</b> <span>{d.dose} {d.route} {d.frequency}</span>{d.note && <small>{d.note}</small>}</li>)}</ul>
                {g.why && <p>{g.why}</p>}
              </article>
            ))}
          </div>
          <div className="cx-sim-cols">
            <Bullets title="Before the first dose" items={x.beforeStarting} />
            <Bullets title="Review" items={x.review} />
            <Bullets title="Cautions" items={x.cautions} tone="warn" />
            <Bullets title="Escalate if" items={x.redFlags} tone="bad" />
          </div>
          {x.source && <p className="cx-rs-foot"><ShieldAlert size={13} /> {x.source}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint(`Antibiotics: ${open.infection}`, abxMarkdown(open))}><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(abxMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-ib" onClick={() => { setList((l) => l.filter((y) => y.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Pick the infection</h3><p>Add the patient's kidney function and allergies for adjusted doses.</p></div>
      ) : null}
      <SavedList title="Recent" items={list} openId={openId} onOpen={setOpenId} render={(r) => ({ b: r.infection, s: `${r.setting} · ${r.result.regimens[0]?.drugs.map((d) => d.name).join(" + ")}` })} />
    </section>
  );
}
