/**
 * Drugs: the Cadus formulary (search 350 Indian generics and brands, with
 * usual doses, maximums, renal and hepatic notes and NLEM status, all from the
 * app's own data) and the prescriber (build a prescription, have the
 * interaction checker read it, print it on the letterhead or ask Cadus to
 * check it).
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Baby, Check, ClipboardList, Droplets, FileSignature, Pill, Plus, Printer, Search, ShieldCheck, Sparkles, Trash2, X,
} from "lucide-react";
import { checkText, type IxMatch } from "@/lib/cadus/interactions";
import {
  DOSING, DOSING_BY_ID, drugById, FORMS, FREQUENCIES, newPrescription, newRxItem, prescriptionDrugText, prescriptionMarkdown, readPrescriptions,
  ROUTES, rxItemFromDrug, savePrescriptions, searchDrugs, type Dosing, type DrugHit, type Prescription, type RxItem,
} from "@/lib/cadus/formulary";
import { DRUG_CLASSES_LIST, TOTAL_DRUG_COUNT, type Drug } from "@/data/drugDatabase";

type Tab = "reference" | "prescriber";

const COST: Record<NonNullable<Dosing["cost"]>, string> = { low: "₹", medium: "₹₹", high: "₹₹₹" };

function DrugCard({ hit, onPrescribe, onAsk }: { hit: DrugHit; onPrescribe: (d: Drug) => void; onAsk: (q: string) => void }) {
  const { drug, dosing } = hit;
  const [open, setOpen] = useState(false);
  return (
    <article className={`cx-dr-card ${open ? "open" : ""}`}>
      <button className="cx-dr-h" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="cx-dr-ic"><Pill size={16} /></span>
        <span className="cx-dr-t">
          <b>{drug.genericName}</b>
          <small>{drug.drugClass} · {drug.brandName}</small>
        </span>
        <span className="cx-dr-tags">
          {dosing?.nlem && <em className="nlem" title="On India's National List of Essential Medicines 2022">NLEM</em>}
          {dosing?.cost && <em title="Rough cost of a usual course or month">{COST[dosing.cost]}</em>}
          <em className={`sch s-${drug.schedule.toLowerCase()}`} title="Schedule under the Drugs and Cosmetics Rules">{drug.schedule}</em>
        </span>
      </button>
      {open && (
        <div className="cx-dr-b">
          {dosing ? (
            <dl className="cx-dr-dose">
              <div><dt>Adult dose</dt><dd>{dosing.adult}</dd></div>
              {dosing.child && <div><dt><Baby size={13} /> Children</dt><dd>{dosing.child}</dd></div>}
              {dosing.max && <div><dt>Maximum</dt><dd>{dosing.max}</dd></div>}
              {dosing.renal && <div className="warn"><dt><Droplets size={13} /> Kidney</dt><dd>{dosing.renal}</dd></div>}
              {dosing.hepatic && <div className="warn"><dt>Liver</dt><dd>{dosing.hepatic}</dd></div>}
              {dosing.pregnancy && <div className="warn"><dt>Pregnancy</dt><dd>{dosing.pregnancy}</dd></div>}
              {dosing.tips && <div><dt>Notes</dt><dd>{dosing.tips}</dd></div>}
            </dl>
          ) : (
            <p className="cx-dr-note">Strengths: {drug.dosages.join(", ")}. Usual doses for this medicine aren't in the formulary yet; ask Cadus for a dose with the patient's weight and kidney function.</p>
          )}
          <div className="cx-dr-cols">
            <div><h4>Indications</h4><ul>{drug.indications.map((i) => <li key={i}>{i}</li>)}</ul></div>
            <div><h4>Contraindications</h4><ul>{drug.contraindications.map((i) => <li key={i}>{i}</li>)}</ul></div>
            {drug.sideEffects?.length ? <div><h4>Side effects</h4><ul>{drug.sideEffects.map((i) => <li key={i}>{i}</li>)}</ul></div> : null}
            {drug.interactions?.length ? <div><h4>Interacts with</h4><ul>{drug.interactions.map((i) => <li key={i}>{i}</li>)}</ul></div> : null}
          </div>
          {drug.mechanism && <p className="cx-dr-mech"><b>Mechanism.</b> {drug.mechanism}</p>}
          <div className="cx-dr-meta">
            <span>Forms: {drug.forms.join(", ")}</span>
            <span>Strengths: {drug.dosages.join(", ")}</span>
            {drug.pregnancyCategory && <span>Pregnancy: {drug.pregnancyCategory}</span>}
            {drug.manufacturer && <span>{drug.manufacturer}</span>}
          </div>
          <div className="cx-dr-acts">
            <button className="cx-btn primary" onClick={() => onPrescribe(drug)}><Plus size={14} /> Add to prescription</button>
            <button className="cx-btn" onClick={() => onAsk(`${drug.genericName}: dose, adjustments and key cautions for a specific patient?`)}><Sparkles size={14} /> Ask Cadus</button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function DrugsView({ initialTab = "reference", initialQuery = "", letterhead, onPrint, onWord, onAsk, onCheck, toast }: {
  initialTab?: Tab;
  initialQuery?: string;
  letterhead: boolean;
  onPrint: (title: string, md: string) => void;
  onWord: (title: string, md: string) => void;
  onAsk: (question: string, mode?: string) => void;
  onCheck: (drugs: string[]) => void;
  toast: (t: string) => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState(initialQuery);
  const [cls, setCls] = useState("All Classes");
  const [nlemOnly, setNlemOnly] = useState(false);
  const [rxList, setRxList] = useState<Prescription[]>(readPrescriptions);
  const [rxId, setRxId] = useState<string>(() => readPrescriptions()[0]?.id ?? "");
  const [pick, setPick] = useState("");
  useEffect(() => savePrescriptions(rxList), [rxList]);
  useEffect(() => { setTab(initialTab); if (initialQuery) setQ(initialQuery); }, [initialTab, initialQuery]);

  const hits = useMemo(() => {
    let list = q.trim() ? searchDrugs(q, 60) : DOSING.map((d) => ({ drug: drugById(d.id)!, dosing: d, score: 0 })).filter((h) => h.drug);
    if (cls !== "All Classes") list = list.filter((h) => h.drug.category === cls || h.drug.drugClass.includes(cls));
    if (nlemOnly) list = list.filter((h) => h.dosing?.nlem);
    return list;
  }, [q, cls, nlemOnly]);

  const rx = rxList.find((p) => p.id === rxId) ?? null;
  const setRx = (patch: Partial<Prescription>) => rx && setRxList((l) => l.map((p) => (p.id === rx.id ? { ...p, ...patch, updatedAt: Date.now() } : p)));
  const setItem = (id: string, patch: Partial<RxItem>) => rx && setRx({ items: rx.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const ix: IxMatch[] = useMemo(() => (rx ? checkText(prescriptionDrugText(rx)).matches : []), [rx]);
  const pickHits = useMemo(() => (pick.trim() ? searchDrugs(pick, 8) : []), [pick]);

  const startRx = (drug?: Drug) => {
    const p = newPrescription({ items: drug ? [rxItemFromDrug(drug)] : [] });
    setRxList((l) => [p, ...l]);
    setRxId(p.id);
    setTab("prescriber");
  };
  const addDrug = (drug: Drug) => {
    if (!rx) { startRx(drug); return; }
    if (rx.items.some((i) => i.drugId === drug.id)) { toast(`${drug.genericName} is already on it`); return; }
    setRx({ items: [...rx.items, rxItemFromDrug(drug)] });
    setPick("");
    toast(`${drug.genericName} added`);
  };
  const title = rx ? `Prescription${rx.patient ? ` for ${rx.patient}` : ""}` : "Prescription";
  const md = rx ? prescriptionMarkdown(rx) : "";

  return (
    <section className="cx-page cx-dr">
      <header className="cx-page-h">
        <div>
          <h1>Drugs</h1>
          <p>The Cadus formulary: {TOTAL_DRUG_COUNT} Indian generics and brands with usual doses, maximums, kidney and liver notes and NLEM status, from the app's own data. The prescriber builds a prescription, checks it for interactions and prints it on your letterhead.</p>
        </div>
        <div className="cx-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "reference"} className={tab === "reference" ? "on" : ""} onClick={() => setTab("reference")}>Reference</button>
          <button role="tab" aria-selected={tab === "prescriber"} className={tab === "prescriber" ? "on" : ""} onClick={() => setTab("prescriber")}>Prescriber{rxList.length ? ` · ${rxList.length}` : ""}</button>
        </div>
      </header>

      {tab === "reference" && (
        <>
          <div className="cx-hs-tools cx-dr-tools">
            <label className="cx-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Generic, brand, class or indication" aria-label="Search drugs" autoFocus /></label>
            <select className="cx-select" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">{DRUG_CLASSES_LIST.map((c) => <option key={c}>{c}</option>)}</select>
            <button className={`cx-tgl ${nlemOnly ? "on" : ""}`} onClick={() => setNlemOnly(!nlemOnly)} aria-pressed={nlemOnly}><Check size={13} /> NLEM only</button>
            <span className="cx-hs-count">{q.trim() ? `${hits.length} match${hits.length === 1 ? "" : "es"}` : `${hits.length} with dosing`}</span>
          </div>
          {hits.length ? <div className="cx-dr-list">{hits.map((h) => <DrugCard key={h.drug.id} hit={h} onPrescribe={addDrug} onAsk={(x) => onAsk(x, "dosage")} />)}</div> : (
            <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Pill size={20} /></span><h3>No match</h3><p>Try the generic name, a brand or a class such as "fluoroquinolone". Cadus can still answer questions about medicines that aren't listed.</p>{q.trim() && <button className="cx-btn" onClick={() => onAsk(q, "dosage")}><Sparkles size={14} /> Ask Cadus about "{q}"</button>}</div>
          )}
          <p className="cx-rs-foot"><ShieldCheck size={13} /> Doses are usual starting references from the National Formulary of India, the BNF and standard texts, for the prescriber to confirm against the patient. Nothing here is generated by AI.</p>
        </>
      )}

      {tab === "prescriber" && (
        <div className="cx-dr-rx">
          <aside className="cx-dr-rxlist">
            <button className="cx-btn primary" onClick={() => startRx()}><Plus size={14} /> New prescription</button>
            {rxList.length ? rxList.map((p) => (
              <button key={p.id} className={`cx-dr-rxrow ${p.id === rxId ? "on" : ""}`} onClick={() => setRxId(p.id)}>
                <b>{p.patient || "Untitled"}</b>
                <small>{p.items.length} item{p.items.length === 1 ? "" : "s"}{p.diagnosis ? ` · ${p.diagnosis}` : ""}</small>
              </button>
            )) : <p className="cx-dr-note">Prescriptions stay on this device. Use age and sex, never a name.</p>}
          </aside>
          {rx ? (
            <div className="cx-dr-rxmain">
              <div className="cx-ob-two">
                <label className="cx-field"><span>Patient (age and sex, or bed)</span><input className="cx-input" value={rx.patient} onChange={(e) => setRx({ patient: e.target.value })} placeholder="54M" maxLength={60} /></label>
                <label className="cx-field"><span>Diagnosis</span><input className="cx-input" value={rx.diagnosis} onChange={(e) => setRx({ diagnosis: e.target.value })} placeholder="Community-acquired pneumonia" maxLength={200} /></label>
              </div>
              <div className="cx-dr-pick">
                <label className="cx-search"><Search size={15} /><input value={pick} onChange={(e) => setPick(e.target.value)} placeholder="Add a medicine by generic or brand" aria-label="Add a medicine" /></label>
                {pickHits.length > 0 && (
                  <ul className="cx-dr-sugg">{pickHits.map((h) => <li key={h.drug.id}><button onClick={() => addDrug(h.drug)}><b>{h.drug.genericName}</b><small>{h.drug.brandName} · {h.drug.dosages[0]}</small>{h.dosing?.nlem && <em>NLEM</em>}</button></li>)}</ul>
                )}
              </div>
              {rx.items.length ? (
                <ol className="cx-dr-items">
                  {rx.items.map((i, k) => {
                    const dosing = i.drugId ? DOSING_BY_ID[i.drugId] : undefined;
                    return (
                      <li key={i.id}>
                        <span className="n">{k + 1}</span>
                        <div className="cx-dr-item">
                          <div className="row">
                            <input className="cx-input name" value={i.name} onChange={(e) => setItem(i.id, { name: e.target.value })} aria-label="Medicine" />
                            <input className="cx-input sm" value={i.strength} onChange={(e) => setItem(i.id, { strength: e.target.value })} placeholder="500 mg" aria-label="Strength" />
                            <select className="cx-input sm" value={i.form} onChange={(e) => setItem(i.id, { form: e.target.value })} aria-label="Form">{[...new Set([i.form, ...FORMS])].map((f) => <option key={f}>{f}</option>)}</select>
                          </div>
                          <div className="row">
                            <input className="cx-input xs" value={i.dose} onChange={(e) => setItem(i.id, { dose: e.target.value })} placeholder="1" aria-label="Dose" />
                            <select className="cx-input sm" value={i.route} onChange={(e) => setItem(i.id, { route: e.target.value })} aria-label="Route">{[...new Set([i.route, ...ROUTES])].map((r) => <option key={r}>{r}</option>)}</select>
                            <select className="cx-input" value={i.frequency} onChange={(e) => setItem(i.id, { frequency: e.target.value })} aria-label="Frequency">{[...new Set([i.frequency, ...FREQUENCIES])].map((f) => <option key={f}>{f}</option>)}</select>
                            <input className="cx-input sm" value={i.duration} onChange={(e) => setItem(i.id, { duration: e.target.value })} placeholder="5 days" aria-label="Duration" />
                          </div>
                          <input className="cx-input" value={i.instructions} onChange={(e) => setItem(i.id, { instructions: e.target.value })} placeholder="After food; with a glass of water" aria-label="Instructions" maxLength={160} />
                          {dosing && <small className="cx-dr-ref">Usual: {dosing.adult}{dosing.max ? ` · max ${dosing.max}` : ""}{dosing.renal ? ` · kidney: ${dosing.renal}` : ""}</small>}
                        </div>
                        <button className="cx-ib" onClick={() => setRx({ items: rx.items.filter((x) => x.id !== i.id) })} aria-label={`Remove ${i.name}`}><X size={15} /></button>
                      </li>
                    );
                  })}
                </ol>
              ) : <p className="cx-dr-note">Add medicines from the box above or from the Reference tab.</p>}
              {ix.length > 0 && (
                <div className="cx-dr-ix" role="alert">
                  <b><AlertTriangle size={15} /> {ix.length} interaction{ix.length === 1 ? "" : "s"} on this prescription</b>
                  <ul>{ix.map((m, k) => <li key={k} className={m.severity}><em>{m.severity}</em> <span><b>{m.a} + {m.b}:</b> {m.effect} <i>{m.action}</i></span></li>)}</ul>
                  <button className="cx-link" onClick={() => onCheck(rx.items.map((i) => i.name))}>Open in the interaction checker</button>
                </div>
              )}
              {rx.items.length > 1 && !ix.length && <p className="cx-dr-ok"><ShieldCheck size={14} /> No interactions found among {rx.items.length} medicines ({checkText(prescriptionDrugText(rx)).drugs.length} recognised by the checker).</p>}
              <label className="cx-field"><span>Advice</span><textarea className="cx-input" rows={2} value={rx.advice} onChange={(e) => setRx({ advice: e.target.value })} placeholder="Rest, fluids; return if fever lasts more than 3 days or breathing worsens" maxLength={1000} /></label>
              <label className="cx-field"><span>Follow-up</span><input className="cx-input" value={rx.followUp} onChange={(e) => setRx({ followUp: e.target.value })} placeholder="OPD in 5 days" maxLength={120} /></label>
              <div className="cx-dr-rxacts">
                <button className="cx-btn primary" disabled={!rx.items.length} onClick={() => onPrint(title, md)}><Printer size={14} /> Print{letterhead ? " on letterhead" : ""}</button>
                <button className="cx-btn" disabled={!rx.items.length} onClick={() => onWord(title, md)}><FileSignature size={14} /> Word</button>
                <button className="cx-btn" disabled={!rx.items.length} onClick={() => onAsk(`Please check this prescription for dose errors, interactions, duplications and anything missing for the diagnosis.\n\n${prescriptionMarkdown(rx, { title: false })}`, "rx")}><Sparkles size={14} /> Ask Cadus to check it</button>
                <button className="cx-btn danger" onClick={() => { setRxList((l) => l.filter((p) => p.id !== rx.id)); setRxId(rxList.find((p) => p.id !== rx.id)?.id ?? ""); toast("Prescription deleted"); }}><Trash2 size={14} /> Delete</button>
              </div>
              {!letterhead && <p className="cx-dr-note"><FileSignature size={13} /> Add your letterhead in Settings to print prescriptions with your name, registration and clinic.</p>}
            </div>
          ) : (
            <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><ClipboardList size={20} /></span><h3>No prescription open</h3><p>Start one, or add a medicine from the Reference tab.</p><button className="cx-btn primary" onClick={() => startRx()}><Plus size={14} /> New prescription</button></div>
          )}
        </div>
      )}
    </section>
  );
}
