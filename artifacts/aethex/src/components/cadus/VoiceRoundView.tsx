/**
 * Ward Rounds by Voice: go bed by bed through the ward list, dictate the review at each bed, and
 * Cadus updates the patient's problems, medicines, plan, jobs and status, and writes today's SOAP
 * progress note. Every change is shown before it is applied to the ward list.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BedDouble, Check, ClipboardList, Copy, Loader2, Printer, Sparkles, TriangleAlert } from "lucide-react";
import DictateBox from "./DictateBox";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { byBed, readWard, saveWard, who, type WardPatient, type WardState } from "@/lib/cadus/wardlist";
import { addRoundNote, readRoundNotes } from "@/lib/cadus/clinic22";

interface Update { status: "stable" | "watch" | "sick"; diagnosis: string; problems: string; meds: string; plan: string; newJobs: string[]; doneJobs: string[]; note: string; unclear: string[] }
const jid = () => Math.random().toString(36).slice(2, 10);

export default function VoiceRoundView({ generate, friendlyError, toast, onPrint, language }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  language: string;
}) {
  const [ward, setWard] = useState<WardState>(readWard);
  const patients = useMemo(() => [...ward.patients].sort(byBed), [ward]);
  const [i, setI] = useState(0);
  const [said, setSaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [upd, setUpd] = useState<Update | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const p: WardPatient | undefined = patients[i];
  useEffect(() => { setSaid(""); setUpd(null); }, [i]);

  const run = async () => {
    if (!p) return;
    setBusy(true);
    try {
      const r = await generate({ action: "round-update", said: deidentify(said).text, patient: { bed: p.bed, label: p.label, diagnosis: p.diagnosis, status: p.status, problems: p.problems, meds: p.meds, plan: p.plan, jobs: p.jobs.filter((j) => !j.done).map((j) => j.text) } });
      if (!r?.result) throw new Error("Nothing came back");
      setUpd(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const apply = () => {
    if (!p || !upd) return;
    const now = Date.now();
    const doneSet = new Set(upd.doneJobs.map((x) => x.toLowerCase()));
    const next: WardState = {
      ...ward,
      patients: ward.patients.map((x) => (x.id !== p.id ? x : {
        ...x, status: upd.status, diagnosis: upd.diagnosis || x.diagnosis, problems: upd.problems || x.problems, meds: upd.meds || x.meds, plan: upd.plan || x.plan,
        jobs: [...x.jobs.map((j) => (doneSet.has(j.text.toLowerCase()) ? { ...j, done: true } : j)), ...upd.newJobs.map((t) => ({ id: jid(), text: t, done: false, at: now }))],
        seenAt: now, updatedAt: now,
      })),
    };
    saveWard(next);
    setWard(next);
    addRoundNote(p.id, upd.note, now);
    setDone((d) => [...new Set([...d, p.id])]);
    toast(`${who(p)} updated`);
    if (i < patients.length - 1) setI(i + 1);
  };
  const notesToday = () => {
    const all = readRoundNotes();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return patients.map((x) => ({ x, n: (all[x.id] ?? []).find((n) => n.at >= start.getTime()) })).filter((r) => r.n).map((r) => `## ${who(r.x)}: ${r.x.diagnosis}\n\n${r.n!.note}`).join("\n\n");
  };

  if (!patients.length) {
    return (
      <section className="cx-page cx-lab cx-vround">
        <header className="cx-page-h"><div><h1>Ward Rounds by Voice</h1><p>Dictate your review at each bed; Cadus updates the ward list and writes the progress note.</p></div></header>
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><BedDouble size={20} /></span><h3>Your ward list is empty</h3><p>Add your patients in Ward round first, then come back to round on them by voice.</p></div>
      </section>
    );
  }
  const open = p ? p.jobs.filter((j) => !j.done) : [];
  return (
    <section className="cx-page cx-lab cx-vround">
      <header className="cx-page-h"><div><h1>Ward Rounds by Voice</h1><p>Bed by bed: dictate your review and Cadus updates the problems, medicines, plan, jobs and status, and writes today's SOAP progress note. You check each change before it's saved.</p></div></header>
      <div className="cx-vround-beds" role="tablist">{patients.map((x, k) => <button key={x.id} role="tab" aria-selected={k === i} className={`${k === i ? "on" : ""} ${done.includes(x.id) ? "done" : ""} s-${x.status}`} onClick={() => setI(k)} data-vround-bed={x.bed}>{done.includes(x.id) && <Check size={12} />} {x.bed || k + 1}</button>)}</div>
      {p && (
        <div className="cx-vround-card" data-vround="patient">
          <div className="cx-vround-h"><b>{who(p)}</b><span className={`cx-sim-status s-${p.status === "sick" ? "critical" : p.status === "watch" ? "worsening" : "stable"}`}>{p.status}</span><small>{p.diagnosis}</small></div>
          <div className="cx-vround-now">
            {p.problems && <p><b>Problems:</b> {p.problems}</p>}
            {p.meds && <p><b>Medicines:</b> {p.meds}</p>}
            {p.plan && <p><b>Plan:</b> {p.plan}</p>}
            {open.length > 0 && <p><b>Jobs:</b> {open.map((j) => j.text).join(" · ")}</p>}
          </div>
          <DictateBox key={p.id} value={said} onChange={setSaid} rows={5} lang={language === "Hindi" ? "hi-IN" : "en-IN"} toast={toast} label="Your review" placeholder={"e.g. Afebrile since yesterday, sats 96 on room air. Creat down to 1.4. Stop IV ceftriaxone, start oral cefuroxime 500 BD. Repeat RFT tomorrow. Plan discharge day after."} />
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => void run()} disabled={busy || said.trim().split(/\s+/).length < 4} data-vround="go">{busy ? <><Loader2 size={14} className="cx-rot" /> Updating…</> : <><Sparkles size={14} /> Update from what I said</>}</button>
            <button className="cx-btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous bed"><ArrowLeft size={14} /></button>
            <button className="cx-btn" onClick={() => setI(Math.min(patients.length - 1, i + 1))} disabled={i >= patients.length - 1} data-vround="next">Next bed <ArrowRight size={14} /></button>
          </div>
          {upd && (
            <div className="cx-cmp-out" data-vround="update">
              {upd.unclear.length > 0 && <div className="cx-sc-gaps"><b>Confirm:</b> {upd.unclear.join(" · ")}</div>}
              <table className="cx-vround-diff"><tbody>
                {upd.status !== p.status && <tr><th>Status</th><td className="old">{p.status}</td><td>{upd.status}</td></tr>}
                {upd.problems && upd.problems !== p.problems && <tr><th>Problems</th><td className="old">{p.problems || "—"}</td><td>{upd.problems}</td></tr>}
                {upd.meds && upd.meds !== p.meds && <tr><th>Medicines</th><td className="old">{p.meds || "—"}</td><td>{upd.meds}</td></tr>}
                {upd.plan && upd.plan !== p.plan && <tr><th>Plan</th><td className="old">{p.plan || "—"}</td><td>{upd.plan}</td></tr>}
                {upd.newJobs.length > 0 && <tr><th>New jobs</th><td className="old"></td><td>{upd.newJobs.join(" · ")}</td></tr>}
                {upd.doneJobs.length > 0 && <tr><th>Jobs done</th><td className="old"></td><td>{upd.doneJobs.join(" · ")}</td></tr>}
              </tbody></table>
              <div className="cx-sc-note"><h3 className="cx-lab-h3"><ClipboardList size={14} /> Progress note</h3><MdBlock text={upd.note} /></div>
              <div className="cx-sc-acts">
                <button className="cx-btn primary" onClick={apply} data-vround="apply"><Check size={14} /> Save to the ward list{i < patients.length - 1 ? " and next bed" : ""}</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(upd.note); toast("Copied"); }}><Copy size={14} /> Copy note</button>
              </div>
            </div>
          )}
        </div>
      )}
      {done.length > 0 && <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Progress notes", `# Progress notes, ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n${notesToday()}`)} data-vround="print"><Printer size={14} /> Print today's progress notes ({done.length})</button></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Speech can be misheard: check drug names and doses in each change before you save it. Names said aloud are hidden before sending.</p>
    </section>
  );
}
