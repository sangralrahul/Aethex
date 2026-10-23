/**
 * MLC Injury Report: the casualty doctor's examination notes (typed or dictated) organised into a
 * medico-legal injury report: each injury described, its age, the kind of weapon, and the nature
 * (simple, grievous under BNS Section 116, or under observation), with blanks for what is missing.
 */
import { useState } from "react";
import { Gavel, History, Loader2, Printer, Trash2, TriangleAlert } from "lucide-react";
import DictateBox from "./DictateBox";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { deleteDraft23, readDrafts23, saveDraft23, type Draft23 } from "@/lib/cadus/clinic23";

interface Mlc { injuries: { no: number; type: string; description: string; site: string; size: string; age: string; weapon: string; nature: string; why: string; awaiting: string }[]; report: string; samples: string[]; flags: string[] }

export default function MlcView({ generate, friendlyError, toast, onPrint }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [history, setHistory] = useState("");
  const [when, setWhen] = useState("");
  const [examined, setExamined] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Mlc | null>(null);
  const [past, setPast] = useState<Draft23[]>(() => readDrafts23("mlc"));

  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "mlc-report", notes: deidentify(notes).text, history: deidentify(history).text, when, examined });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result);
      saveDraft23("mlc", `${r.result.injuries.length} injur${r.result.injuries.length === 1 ? "y" : "ies"}: ${r.result.injuries[0].type}`, r.result);
      setPast(readDrafts23("mlc"));
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };

  return (
    <section className="cx-page cx-lab cx-mlc">
      <header className="cx-page-h"><div><h1>MLC Injury Report</h1><p>Turn your examination notes into a medico-legal injury report: each injury described with size, site and age, the likely weapon, and its nature (simple, grievous or under observation) under the Bharatiya Nyaya Sanhita. You examine and you decide; Cadus words it.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Time of the incident (as told)</span><input className="cx-input" value={when} onChange={(e) => setWhen(e.target.value.slice(0, 80))} placeholder="e.g. 9:30 pm, 23 Oct" data-mlc="when" /></label>
        <label className="cx-field"><span>Time of examination</span><input className="cx-input" value={examined} onChange={(e) => setExamined(e.target.value.slice(0, 80))} placeholder="e.g. 11:15 pm, 23 Oct" data-mlc="examined" /></label>
      </div>
      <label className="cx-field"><span>History as given (no names)</span><input className="cx-input" value={history} onChange={(e) => setHistory(e.target.value.slice(0, 600))} placeholder="e.g. Alleged assault with a wooden stick by a known person" data-mlc="history" /></label>
      <DictateBox value={notes} onChange={setNotes} rows={7} lang="en-IN" toast={toast} label="Examination findings" placeholder={"e.g. 1. Lacerated wound 4 × 1 cm × bone deep over the left parietal region, 6 cm above the left ear, margins irregular, bleeding present.\n2. Contusion 5 × 3 cm, reddish, over the right forearm, 8 cm below the elbow.\nSmell of alcohol: absent. Conscious, oriented."} />
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || notes.trim().split(/\s+/).length < 6} data-mlc="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Gavel size={14} />} Write the injury report</button></div>
      {res && (
        <div className="cx-cmp-out" data-mlc="out">
          {res.flags.length > 0 && <div className="cx-sc-gaps" data-mlc="flags"><b>Check before signing:</b> {res.flags.join(" · ")}</div>}
          <div className="cx-c23-scroll"><table className="cx-c23-table" data-mlc="injuries"><thead><tr><th>#</th><th>Injury</th><th>Age</th><th>Weapon</th><th>Nature</th></tr></thead>
            <tbody>{res.injuries.map((i) => <tr key={i.no} data-mlc-nature={i.nature}><td>{i.no}</td><td>{i.description}</td><td>{i.age}</td><td>{i.weapon}</td><td><b className={`cx-mlc-n n-${i.nature.replace(/\s+/g, "-")}`}>{i.nature}</b>{i.awaiting && <small>Awaiting {i.awaiting}</small>}{i.why && <small>{i.why}</small>}</td></tr>)}</tbody></table></div>
          {res.samples.length > 0 && <p><b>Preserve and hand over:</b> {res.samples.join(", ")}</p>}
          <div className="cx-c23-doc"><MdBlock text={res.report} /></div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("Injury report", res.report)} data-mlc="print"><Printer size={14} /> Print the report</button></div>
        </div>
      )}
      {past.length > 0 && (
        <details className="cx-opd-seen"><summary><History size={13} /> Recent ({past.length})</summary>
          <ul className="cx-c23-past">{past.map((d) => (
            <li key={d.id}><button className="cx-link" onClick={() => setRes(d.data as Mlc)}>{d.title}</button><small>{new Date(d.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small><button className="cx-ib" onClick={() => { deleteDraft23(d.id); setPast(readDrafts23("mlc")); }} aria-label="Delete"><Trash2 size={13} /></button></li>
          ))}</ul>
        </details>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> The opinion is the examining doctor's. Check every size, site and time against your own examination, follow your hospital's MLC register and police intimation procedure, and keep the original notes.</p>
    </section>
  );
}
