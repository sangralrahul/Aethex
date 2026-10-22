/**
 * Poisoning & Snakebite: the agent (or just the findings), time, amount and patient in;
 * severity, first actions in order, antidotes with doses for this patient, what to avoid,
 * tests, monitoring and where to manage. Indian protocols (national snakebite protocol).
 */
import { useEffect, useState } from "react";
import { Copy, FlaskRound, Phone, Printer, ShieldAlert, ShieldCheck, Siren, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { blankRxPatient, rxPatientPayload, rxPatientSummary, type RxPatient } from "@/lib/cadus/labs";
import { POISONS, poisonMarkdown, readPoisons, savePoisons, SEVERITY_TONE, type PoisonRecord } from "@/lib/cadus/clinicalAi";
import { sid } from "@/lib/cadus/studio";
import { Bullets, PatientFields, PresetPicker, SavedList } from "./BedsideParts";

export default function PoisonView({ generate, friendlyError, toast, onPrint }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [agent, setAgent] = useState("");
  const [since, setSince] = useState("");
  const [amount, setAmount] = useState("");
  const [findings, setFindings] = useState("");
  const [patient, setPatient] = useState<RxPatient>(blankRxPatient);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<PoisonRecord[]>(readPoisons);
  const [openId, setOpenId] = useState("");
  useEffect(() => savePoisons(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;
  const ready = agent.trim().length >= 3 || findings.trim().split(/\s+/).length >= 4;

  const run = async () => {
    if (!ready) { toast("Choose the poison, or describe the findings"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "poison", agent: agent.trim(), since, amount, findings: deidentify(findings).text, patient: rxPatientPayload(patient) });
      if (!r?.result?.immediate?.length) throw new Error("No plan came back");
      const rec: PoisonRecord = { id: sid(), at: Date.now(), agent: agent.trim() || "Unknown poison", patient: rxPatientSummary(patient), result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const x = open?.result;
  const tone = x ? SEVERITY_TONE[x.severity] : "review";
  return (
    <section className="cx-page cx-bs cx-tox">
      <header className="cx-page-h"><div><h1>Poisoning &amp; Snakebite</h1><p>First actions, antidotes with doses for this patient, what to avoid and how to monitor, following Indian protocols. Unknown poison? Describe what you see.</p></div></header>
      <PresetPicker groups={POISONS} value={agent} onPick={setAgent} testId="poisons" />
      <div className="cx-bs-row">
        <input className="cx-input" value={agent} onChange={(e) => setAgent(e.target.value.slice(0, 160))} placeholder="Or type it (leave empty if unknown)" aria-label="Poison" data-tox="agent" />
        <input className="cx-input" value={since} onChange={(e) => setSince(e.target.value.slice(0, 60))} placeholder="Time since, e.g. 3 hours" aria-label="Time since exposure" data-tox="since" />
        <input className="cx-input" value={amount} onChange={(e) => setAmount(e.target.value.slice(0, 120))} placeholder="Amount, e.g. 20 tablets of 500 mg" aria-label="Amount" data-tox="amount" />
      </div>
      <PatientFields p={patient} set={(p) => setPatient((y) => ({ ...y, ...p }))} show={["age", "sex", "weight", "pregnant"]} />
      <textarea className="cx-input" rows={3} value={findings} onChange={(e) => setFindings(e.target.value.slice(0, 3000))} placeholder="Symptoms, signs and vitals: e.g. ptosis, pupils pinpoint, HR 48, SpO₂ 90%, 20WBCT clotted" aria-label="Findings" data-tox="findings" />
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-tox="go"><FlaskRound size={15} /> {busy ? "Making a plan…" : "Get management"}</button></div>
      <p className="cx-rs-foot"><Phone size={13} /> Call your regional poison information centre for advice, especially for rare or mixed poisonings. <TriangleAlert size={13} /> Never delay resuscitation to read this.</p>

      {x && open ? (
        <div className="cx-cmp-out" data-tox="out">
          <div className={`cx-rxc-verdict v-${tone}`} data-tox="severity">
            {tone === "unsafe" ? <Siren size={22} /> : tone === "ok" ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            <div><b>{open.agent} · {x.severity === "unclear" ? "severity unclear" : `${x.severity}`}</b><p>{x.summary}</p></div>
          </div>
          <div className="cx-sim-card bad"><h3>Do now</h3><ol data-tox="immediate">{x.immediate.map((s) => <li key={s}>{s}</li>)}</ol></div>
          {x.antidotes.length > 0 && (
            <div className="cx-abx-regs" data-tox="antidotes">
              {x.antidotes.map((a) => <article key={a.name} className="cx-abx-reg first"><div className="cx-abx-h"><b>{a.name}</b></div><p><b>{a.dose}</b></p><p>{a.how}</p>{a.endpoint && <p><small>Endpoint: {a.endpoint}</small></p>}</article>)}
            </div>
          )}
          <div className="cx-sim-cols">
            <Bullets title="Avoid" items={x.avoid} tone="warn" />
            <Bullets title="Investigations" items={x.investigations} />
            <Bullets title="Monitoring" items={x.monitoring} />
            <Bullets title="Red flags" items={x.redFlags} tone="bad" />
          </div>
          {x.disposition && <p className="cx-tox-disp"><b>Where:</b> {x.disposition}</p>}
          {x.source && <p className="cx-rs-foot">{x.source}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint(open.agent, poisonMarkdown(open))}><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(poisonMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-ib" onClick={() => { setList((l) => l.filter((y) => y.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Choose the poison or bite</h3><p>Add weight and time since exposure for exact doses.</p></div>
      ) : null}
      <SavedList title="Recent" items={list} openId={openId} onOpen={setOpenId} render={(r) => ({ b: r.agent, s: `${r.result.severity} · ${r.patient}` })} />
    </section>
  );
}
