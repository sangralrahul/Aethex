/**
 * Shift Handover (I-PASS): the ward list, with open jobs, written up for the next team:
 * illness severity, a short summary, the action list, "if this, then that" plans and what
 * to watch, with the shift's priorities on top. The receiver ticks each patient as read
 * back (the S of I-PASS). Print or copy; everything stays on this device.
 */
import { useEffect, useState } from "react";
import { ArrowRightLeft, BedDouble, CheckCircle2, Circle, Copy, Printer, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { handoverMarkdown, readHandovers, saveHandovers, SEVERITY_LABEL, SHIFTS, sid, type HandoverRecord } from "@/lib/cadus/studio";

export interface HandoverWardPatient { id: string; bed: string; label: string; diagnosis: string; status: string; problems: string; meds: string; plan: string; jobs: { text: string; done: boolean }[] }

export default function HandoverView({ ward, generate, friendlyError, toast, onPrint, onOpenWard }: {
  ward: HandoverWardPatient[];
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onOpenWard: () => void;
}) {
  const [shift, setShift] = useState<(typeof SHIFTS)[number]["id"]>(() => (new Date().getHours() >= 14 ? "night" : "day"));
  const [picked, setPicked] = useState<string[]>(() => ward.map((p) => p.id));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<HandoverRecord[]>(readHandovers);
  const [openId, setOpenId] = useState("");
  useEffect(() => saveHandovers(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;
  const chosen = ward.filter((p) => picked.includes(p.id));
  const ready = chosen.length > 0 || notes.trim().split(/\s+/).length >= 8;

  const run = async () => {
    if (!ready) { toast("Add patients to your ward list, or type them in"); return; }
    setBusy(true);
    try {
      const clean = (s: string) => deidentify(s).text;
      const patients = chosen.map((p) => ({ bed: p.bed, label: clean(p.label), diagnosis: clean(p.diagnosis), status: p.status, problems: clean(p.problems), meds: clean(p.meds), plan: clean(p.plan), jobs: p.jobs.filter((j) => !j.done).map((j) => clean(j.text)) }));
      const r = await generate({ action: "handover", shift, patients, notes: clean(notes) });
      if (!r?.result?.patients?.length) throw new Error("No handover came back");
      const rec: HandoverRecord = { id: sid(), at: Date.now(), shift, result: r.result, readBack: [] };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };
  const toggleRead = (key: string) => { if (!open) return; setList((l) => l.map((x) => (x.id === open.id ? { ...x, readBack: x.readBack.includes(key) ? x.readBack.filter((k) => k !== key) : [...x.readBack, key] } : x))); };

  if (open) {
    const r = open.result;
    const readAll = r.patients.every((p, i) => open.readBack.includes(`${i}`));
    return (
      <section className="cx-page cx-ho">
        <header className="cx-page-h"><div><h1>Handover to the {(SHIFTS.find((s) => s.id === open.shift)?.label ?? "next team").toLowerCase()}</h1><p>{r.patients.length} patient{r.patients.length === 1 ? "" : "s"} · {new Date(open.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {open.readBack.length}/{r.patients.length} read back</p></div></header>
        {r.priorities.length > 0 && <div className="cx-rxc-verdict v-review" data-ho="priorities"><TriangleAlert size={20} /><div><b>Priorities this shift</b><ol>{r.priorities.map((p) => <li key={p}>{p}</li>)}</ol></div></div>}
        <div className="cx-ho-list">
          {r.patients.map((p, i) => {
            const read = open.readBack.includes(`${i}`);
            return (
              <article key={i} className={`cx-ho-card sev-${p.severity} ${read ? "read" : ""}`} data-ho-patient={i}>
                <div className="cx-ho-h">
                  <b>Bed {p.bed || "?"}</b><span>{p.label}</span>
                  <em className={`cx-ho-sev sev-${p.severity}`}>{SEVERITY_LABEL[p.severity]}</em>
                  <button className={`cx-ho-read ${read ? "on" : ""}`} onClick={() => toggleRead(`${i}`)} aria-pressed={read} data-ho-read={i}>{read ? <CheckCircle2 size={15} /> : <Circle size={15} />} Read back</button>
                </div>
                <p className="cx-ho-sum"><abbr title="Patient summary">P</abbr> {p.summary}</p>
                {p.actions.length > 0 && <div className="cx-ho-sec"><abbr title="Action list">A</abbr><ul>{p.actions.map((a, n) => <li key={n}>{a.task}{a.when && <small> · {a.when}</small>}</li>)}</ul></div>}
                {(p.contingency.length > 0 || p.awareness) && (
                  <div className="cx-ho-sec"><abbr title="Situation awareness and contingency">S</abbr><ul>{p.contingency.map((c, n) => <li key={n}><b>If</b> {c.if} <b>→</b> {c.then}</li>)}{p.awareness && <li className="watch">Watch: {p.awareness}</li>}</ul></div>
                )}
              </article>
            );
          })}
        </div>
        {readAll && <p className="cx-ho-done" data-ho="all-read"><CheckCircle2 size={16} /> Every patient read back. Handover complete.</p>}
        <div className="cx-sc-acts">
          <button className="cx-btn primary" onClick={() => onPrint("Handover", handoverMarkdown(open))} data-ho="print"><Printer size={14} /> Print</button>
          <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(handoverMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
          <button className="cx-btn" onClick={() => setOpenId("")}>New handover</button>
          <button className="cx-ib" onClick={() => { setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
        </div>
      </section>
    );
  }

  return (
    <section className="cx-page cx-ho">
      <header className="cx-page-h"><div><h1>Shift Handover</h1><p>Turn your ward list into an I-PASS handover: severity, summary, actions, "if this, then that" plans and what to watch, for the next team.</p></div></header>
      <div className="cx-seg" role="radiogroup" aria-label="Handing over to">
        {SHIFTS.map((s) => <button key={s.id} role="radio" aria-checked={shift === s.id} className={shift === s.id ? "on" : ""} onClick={() => setShift(s.id)} data-ho-shift={s.id}>{s.label}</button>)}
      </div>
      {ward.length > 0 ? (
        <div className="cx-ho-pick" data-ho="pick">
          <p className="cx-gl"><span>Patients ({chosen.length} of {ward.length})</span><button className="cx-link" onClick={() => setPicked(picked.length === ward.length ? [] : ward.map((p) => p.id))}>{picked.length === ward.length ? "None" : "All"}</button></p>
          {ward.map((p) => {
            const open = p.jobs.filter((j) => !j.done).length;
            return (
              <label key={p.id} className="cx-ho-row">
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => setPicked((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))} />
                <b>Bed {p.bed}</b><span>{p.label} · {p.diagnosis}</span>{open > 0 && <em>{open} job{open === 1 ? "" : "s"}</em>}{p.status === "sick" && <em className="sick">Sick</em>}
              </label>
            );
          })}
        </div>
      ) : (
        <div className="cx-empty-state" data-ho="empty"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><BedDouble size={20} /></span><h3>Your ward list is empty</h3><p>Add patients on the ward round, or type them below.</p><button className="cx-btn" onClick={onOpenWard}>Open ward round</button></div>
      )}
      <textarea className="cx-input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={6000} aria-label="Anything else to hand over" data-ho="notes" placeholder="Anything else: patients not on the list, pending results, family meetings, beds expected…" />
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-ho="go"><ArrowRightLeft size={15} /> {busy ? "Writing handover…" : "Write handover"}</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Beds, initials and clinical details only: names and numbers are hidden before sending.</p>
      {list.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent handovers</span></p>
          {list.slice(0, 8).map((x) => <button key={x.id} className="cx-sc-row" onClick={() => setOpenId(x.id)}><b>{SHIFTS.find((s) => s.id === x.shift)?.label} · {x.result.patients.length} patients</b><small>{new Date(x.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {x.readBack.length}/{x.result.patients.length} read back</small></button>)}
        </div>
      )}
      {list.length === 0 && ward.length > 0 && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Your first handover</h3><p>Choose the team and the patients, then write it.</p></div>}
    </section>
  );
}
