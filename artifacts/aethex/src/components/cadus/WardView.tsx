/**
 * Ward round: a de-identified list of your patients (bed, age and sex,
 * diagnosis, problems, medicines, plan and jobs) kept only on this device, with
 * a round checklist, the jobs across the ward, and handovers: SBAR written by
 * Cadus, or a printable handover sheet.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, BedDouble, Check, ChevronDown, ClipboardCheck, ClipboardList, Copy, FileDown, FileText, ListChecks,
  LogOut, MoreHorizontal, NotebookPen, Plus, Printer, ShieldCheck, Sparkles, Stethoscope, Trash2, X,
} from "lucide-react";
import {
  byBed, handoverMarkdown, localDate, newPatient, patientSummary, pendingJobs, readWard, ROUND_CHECKS, saveWard, startDay, STATUS_LABEL, who,
  type WardJob, type WardPatient, type WardState, type WardStatus,
} from "@/lib/cadus/wardlist";
import { deidentify, KIND_LABEL, type IdentifierKind } from "@/lib/cadus/deidentify";
import { checkText } from "@/lib/cadus/interactions";
import { downloadBlob, fileSlug, markdownToDocx } from "@/lib/cadus/docx";
import { printMarkdown } from "@/lib/cadus/printdoc";
import type { Letterhead } from "@/lib/cadus/letterhead";
import { InteractionNotice } from "./ClinicalCalculators";

type Filter = "all" | "sick" | "jobs" | "unseen";

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

/** A small example ward so you can see how it works (all details invented). */
function sampleWard(): WardPatient[] {
  const now = Date.now();
  const job = (text: string, done = false): WardJob => ({ id: uid(), text, done, at: now });
  return [
    newPatient({
      bed: "3", label: "58M", diagnosis: "Community-acquired pneumonia, CURB-65 of 2", status: "watch",
      problems: "T2DM on metformin\nHypertension\nDay 2 of admission; still febrile, RR 24, SpO₂ 94% on 2 L",
      meds: "Ceftriaxone 1 g IV OD\nAzithromycin 500 mg OD\nMetformin 500 mg BD\nAmlodipine 5 mg OD",
      plan: "Continue IV antibiotics, repeat CXR if not improving at 48 h, wean oxygen to SpO₂ 92 to 96%",
      jobs: [job("Chase sputum and blood cultures"), job("Repeat CBC, urea and creatinine tomorrow"), job("ECG", true)],
    }, now),
    newPatient({
      bed: "7", label: "34F", diagnosis: "Dengue with warning signs (day 5 of fever)", status: "sick",
      problems: "Abdominal pain, vomiting\nHCT rising 38 to 44%, platelets 35,000",
      meds: "Paracetamol 650 mg QDS (no NSAIDs)\nIV crystalloid as per HCT",
      plan: "Strict input-output, 4-hourly HCT, watch for plasma leak, NS bolus if HCT rises further",
      jobs: [job("HCT at 2 pm"), job("Inform the senior if the pulse pressure is 20 mmHg or less")],
    }, now + 1),
    newPatient({
      bed: "12", label: "71M", diagnosis: "Acute kidney injury on CKD 3, likely pre-renal", status: "stable",
      problems: "Diarrhoea 3 days\nCKD 3 (baseline creatinine 1.6)\nOn warfarin for AF",
      meds: "Warfarin 3 mg OD\nRamipril 5 mg OD (held)\nFurosemide 40 mg OD (held)\nCiprofloxacin 500 mg BD",
      plan: "IV fluids, daily creatinine and potassium, restart ramipril when creatinine is back to baseline",
      jobs: [job("INR today (on ciprofloxacin)"), job("Renal ultrasound")],
    }, now + 2),
    newPatient({
      bed: "15", label: "45F", diagnosis: "DKA, resolving", status: "stable",
      problems: "Type 1 DM, missed insulin\npH 7.32 now, ketones 0.8",
      meds: "Insulin infusion 0.1 U/kg/h\nIV potassium as per protocol",
      plan: "Switch to subcutaneous basal-bolus insulin once eating and ketones are below 0.6",
      jobs: [job("Diabetes educator review"), job("Capillary glucose hourly", true)],
    }, now + 3),
  ];
}

const DOC_ACTIONS: { label: string; mode: string; icon: typeof FileText; ask: string }[] = [
  { label: "Progress note", mode: "progress", icon: NotebookPen, ask: "Write today's progress note for this patient." },
  { label: "SBAR", mode: "handover", icon: ClipboardCheck, ask: "Present this patient in SBAR for the ward round." },
  { label: "Discharge summary", mode: "discharge", icon: FileText, ask: "Draft the discharge summary for this patient." },
];

export default function WardView({ onAsk, onOpenChecker, letterhead, toast }: {
  onAsk: (text: string, mode: string, title?: string) => void;
  onOpenChecker: (drugs: string[]) => void;
  letterhead: Letterhead | null;
  toast: (t: string) => void;
}) {
  const [ward, setWard] = useState<WardState>(() => startDay(readWard(), localDate()));
  const [selId, setSelId] = useState(() => [...ward.patients].sort(byBed)[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [listTab, setListTab] = useState<"patients" | "jobs">("patients");
  const [menu, setMenu] = useState<"" | "handover" | "patient">("");
  const [confirm, setConfirm] = useState<"" | "discharge" | "delete">("");
  const [jobText, setJobText] = useState("");
  const [mobileEdit, setMobileEdit] = useState(false);
  const bedRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveWard(ward), [ward]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement)?.closest?.(".cx-wd-menu-wrap")) setMenu(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);
  useEffect(() => { setConfirm(""); setJobText(""); }, [selId]);

  const sorted = useMemo(() => [...ward.patients].sort(byBed), [ward.patients]);
  const sel = ward.patients.find((p) => p.id === selId);
  const jobs = pendingJobs(ward);
  const sick = ward.patients.filter((p) => p.status === "sick").length;
  const watch = ward.patients.filter((p) => p.status === "watch").length;
  const seen = ward.patients.filter((p) => p.checks.includes("seen")).length;
  const shownList = sorted.filter((p) =>
    filter === "sick" ? p.status !== "stable"
    : filter === "jobs" ? p.jobs.some((j) => !j.done)
    : filter === "unseen" ? !p.checks.includes("seen")
    : true,
  );
  const ix = useMemo(() => (sel?.meds.trim() ? checkText(sel.meds) : null), [sel?.meds]);
  const ident = useMemo(() => {
    if (!sel) return null;
    const r = deidentify([sel.bed, sel.label, sel.diagnosis, sel.problems, sel.meds, sel.plan, ...sel.jobs.map((j) => j.text)].join("\n"));
    return r.total ? (Object.keys(r.hits) as IdentifierKind[]).map((k) => KIND_LABEL[k]) : null;
  }, [sel]);

  const update = (id: string, patch: Partial<WardPatient>) =>
    setWard((w) => ({ ...w, patients: w.patients.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)) }));
  const addPatient = () => {
    const p = newPatient({ admittedOn: localDate() });
    setWard((w) => ({ ...w, patients: [...w.patients, p] }));
    setSelId(p.id);
    setListTab("patients");
    setFilter("all");
    setMobileEdit(true);
    window.setTimeout(() => bedRef.current?.focus(), 60);
  };
  const remove = (p: WardPatient, discharged: boolean) => {
    setWard((w) => ({
      ...w,
      patients: w.patients.filter((x) => x.id !== p.id),
      discharged: discharged ? [{ id: p.id, bed: p.bed, label: p.label, diagnosis: p.diagnosis, at: Date.now() }, ...w.discharged].slice(0, 30) : w.discharged,
    }));
    const next = sorted.filter((x) => x.id !== p.id)[0];
    setSelId(next?.id ?? "");
    setConfirm("");
    setMenu("");
    setMobileEdit(false);
    toast(discharged ? `${who(p)} discharged` : "Patient removed from the list");
  };
  const toggleJob = (p: WardPatient, jid: string) => update(p.id, { jobs: p.jobs.map((j) => (j.id === jid ? { ...j, done: !j.done, at: Date.now() } : j)) });
  const addJob = (p: WardPatient) => {
    const t = jobText.trim();
    if (!t) return;
    update(p.id, { jobs: [...p.jobs, { id: uid(), text: t.slice(0, 300), done: false, at: Date.now() }] });
    setJobText("");
  };
  const toggleCheck = (p: WardPatient, c: string) => {
    const on = p.checks.includes(c);
    update(p.id, { checks: on ? p.checks.filter((x) => x !== c) : [...p.checks, c], ...(c === "seen" ? { seenAt: on ? undefined : Date.now() } : {}) });
  };
  const scrub = (p: WardPatient) => {
    const clean = (t: string) => deidentify(t).text;
    update(p.id, {
      bed: clean(p.bed), label: clean(p.label), diagnosis: clean(p.diagnosis), problems: clean(p.problems), meds: clean(p.meds), plan: clean(p.plan),
      jobs: p.jobs.map((j) => ({ ...j, text: clean(j.text) })),
    });
    toast("Identifiers replaced with placeholders");
  };

  const unitName = ward.unit.trim() || "Ward";
  const sheetTitle = `${unitName} handover`;
  const handover = (kind: "sbar" | "print" | "word" | "copy") => {
    setMenu("");
    if (!ward.patients.length) return;
    const md = handoverMarkdown(ward);
    // The printed and Word sheets have the unit and date in their title.
    const sheetMd = handoverMarkdown(ward, new Date(), { heading: false });
    if (kind === "sbar") {
      onAsk(
        `Write the handover for the next team: a short SBAR for each patient below, sickest first, then a checklist of outstanding jobs by bed and anything to watch for overnight.\n\n${ward.unit ? `${ward.unit}. ` : ""}${sorted.map(patientSummary).join("\n\n")}`,
        "handover",
        sheetTitle,
      );
    } else if (kind === "print") {
      void printMarkdown({ title: sheetTitle, md: sheetMd, letterhead, landscape: true, footer: "De-identified handover from Cadus. Keep patient names and numbers off this sheet." });
    } else if (kind === "word") {
      downloadBlob(`${fileSlug(sheetTitle, "handover")}.docx`, markdownToDocx(sheetTitle, sheetMd, { letterhead, note: "De-identified handover from Cadus." }));
      toast("Handover sheet downloaded for Word");
    } else {
      void navigator.clipboard?.writeText(md).then(() => toast("Handover table copied"), () => toast("Couldn't copy to the clipboard"));
    }
  };

  const statusSeg = (p: WardPatient) => (
    <div className="cx-wd-status" role="radiogroup" aria-label="Status">
      {(["stable", "watch", "sick"] as WardStatus[]).map((s) => (
        <button key={s} role="radio" aria-checked={p.status === s} className={`${s} ${p.status === s ? "on" : ""}`} onClick={() => update(p.id, { status: s })} title={STATUS_LABEL[s]}>
          <i />{s === "watch" ? "Watch" : STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );

  const editor = (p: WardPatient) => {
    const open = p.jobs.filter((j) => !j.done);
    const done = p.jobs.filter((j) => j.done);
    return (
      <div className="cx-wp">
        <button className="cx-back cx-wd-back" onClick={() => setMobileEdit(false)}><ArrowLeft size={15} /> All patients</button>
        <header className="cx-wp-h">
          <label className="cx-wp-bed">
            <span>Bed</span>
            <input ref={bedRef} value={p.bed} onChange={(e) => update(p.id, { bed: e.target.value.slice(0, 20) })} placeholder="12" aria-label="Bed" />
          </label>
          <label className="cx-wp-who">
            <span>Patient</span>
            <input value={p.label} onChange={(e) => update(p.id, { label: e.target.value.slice(0, 40) })} placeholder="Age and sex or initials, e.g. 58M" aria-label="Age and sex or initials" />
          </label>
          {statusSeg(p)}
          <div className="cx-rel cx-wd-menu-wrap">
            <button className={`cx-ib ${menu === "patient" ? "open" : ""}`} onClick={() => { setConfirm(""); setMenu(menu === "patient" ? "" : "patient"); }} aria-label="Patient options" aria-haspopup="menu" aria-expanded={menu === "patient"}><MoreHorizontal size={18} /></button>
            {menu === "patient" && (
              <div className="cx-pop cx-wd-pmenu" role="menu">
                {confirm ? (
                  <>
                    <p className="cx-pop-gl">{confirm === "discharge" ? `Discharge ${who(p)}? Their notes leave the list.` : `Remove ${who(p)} and their notes?`}</p>
                    <button className={`cx-pop-i ${confirm === "delete" ? "danger" : ""}`} onClick={() => remove(p, confirm === "discharge")}>{confirm === "discharge" ? <LogOut size={16} /> : <Trash2 size={16} />} {confirm === "discharge" ? "Discharge" : "Remove"}</button>
                    <button className="cx-pop-i" onClick={() => setConfirm("")}><X size={16} /> Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="cx-pop-i" onClick={() => { setMenu(""); onAsk(`${patientSummary(p)}\n\n${DOC_ACTIONS[2].ask}`, "discharge", `Discharge summary: ${who(p)}`); }}><FileText size={16} /> Discharge summary</button>
                    <button className="cx-pop-i" onClick={() => setConfirm("discharge")}><LogOut size={16} /> Discharge from the list</button>
                    <div className="cx-pop-sep" />
                    <button className="cx-pop-i danger" onClick={() => setConfirm("delete")}><Trash2 size={16} /> Remove</button>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
        <input className="cx-wp-dx" value={p.diagnosis} onChange={(e) => update(p.id, { diagnosis: e.target.value.slice(0, 200) })} placeholder="Working diagnosis" aria-label="Working diagnosis" />
        {ident && (
          <div className="cx-wp-ident" role="alert">
            <AlertTriangle size={15} />
            <span>This looks like it includes a {ident.join(" and a ")}. Keep the list de-identified: bed, age and sex or initials only.</span>
            <button onClick={() => scrub(p)}>Replace with placeholders</button>
          </div>
        )}
        <div className="cx-wp-fields">
          <label className="cx-wp-f">
            <span>Background and active problems</span>
            <textarea value={p.problems} onChange={(e) => update(p.id, { problems: e.target.value.slice(0, 3000) })} placeholder={"One per line, e.g.\nT2DM, HTN\nDay 2: still febrile, RR 24"} rows={4} />
          </label>
          <label className="cx-wp-f">
            <span>Medicines</span>
            <textarea value={p.meds} onChange={(e) => update(p.id, { meds: e.target.value.slice(0, 3000) })} placeholder={"One per line, e.g.\nCeftriaxone 1 g IV OD"} rows={4} />
          </label>
          <label className="cx-wp-f wide">
            <span>Plan</span>
            <textarea value={p.plan} onChange={(e) => update(p.id, { plan: e.target.value.slice(0, 3000) })} placeholder="Today's plan" rows={2} />
          </label>
        </div>
        {ix && ix.matches.length > 0 && (
          <InteractionNotice matches={ix.matches} onOpen={() => onOpenChecker(ix.drugs.map((d) => d.label))} />
        )}
        <div className="cx-wp-cols">
          <section className="cx-wp-box">
            <header><b><ListChecks size={15} /> Jobs</b><span>{open.length ? `${open.length} to do` : p.jobs.length ? "All done" : ""}</span></header>
            <ul className="cx-wp-jobs">
              {open.map((j) => (
                <li key={j.id}>
                  <button className="cx-ck" role="checkbox" aria-checked={false} onClick={() => toggleJob(p, j.id)} aria-label={`Mark done: ${j.text}`} />
                  <span>{j.text}</span>
                  <button className="cx-wp-x" onClick={() => update(p.id, { jobs: p.jobs.filter((x) => x.id !== j.id) })} aria-label={`Delete job: ${j.text}`}><X size={13} /></button>
                </li>
              ))}
              {done.map((j) => (
                <li key={j.id} className="done">
                  <button className="cx-ck on" role="checkbox" aria-checked onClick={() => toggleJob(p, j.id)} aria-label={`Mark not done: ${j.text}`} />
                  <span>{j.text}</span>
                  <button className="cx-wp-x" onClick={() => update(p.id, { jobs: p.jobs.filter((x) => x.id !== j.id) })} aria-label={`Delete job: ${j.text}`}><X size={13} /></button>
                </li>
              ))}
            </ul>
            <form className="cx-wp-add" onSubmit={(e) => { e.preventDefault(); addJob(p); }}>
              <Plus size={14} />
              <input value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="Add a job, e.g. chase the CT report" aria-label="Add a job" maxLength={300} />
              {jobText.trim() && <button type="submit">Add</button>}
            </form>
          </section>
          <section className="cx-wp-box">
            <header><b><ClipboardList size={15} /> Round checklist</b><span>{p.checks.filter((c) => ROUND_CHECKS.some((r) => r.id === c)).length} of {ROUND_CHECKS.length}</span></header>
            <div className="cx-wp-round">
              {ROUND_CHECKS.map((c) => {
                const on = p.checks.includes(c.id);
                return (
                  <button key={c.id} className={`cx-wp-chk ${on ? "on" : ""}`} role="checkbox" aria-checked={on} onClick={() => toggleCheck(p, c.id)}>
                    <span className="cx-ck-i" aria-hidden>{on && <Check size={12} strokeWidth={3} />}</span>{c.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        <footer className="cx-wp-acts">
          <button className="cx-btn primary" onClick={() => onAsk(`${patientSummary(p)}\n\nWhat am I missing? Suggest the differentials to consider, the investigations and the plan for today, and any red flags.`, "ddx", `Ward round: ${who(p)}`)}><Sparkles size={14} /> Ask Cadus</button>
          {DOC_ACTIONS.slice(0, 2).map((a) => (
            <button key={a.mode} className="cx-btn" onClick={() => onAsk(`${patientSummary(p)}\n\n${a.ask}`, a.mode, `${a.label}: ${who(p)}`)}><a.icon size={14} /> {a.label}</button>
          ))}
          <span className="cx-wp-note"><ShieldCheck size={13} /> Saved on this device only{p.updatedAt ? ` · edited ${new Date(p.updatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : ""}</span>
        </footer>
      </div>
    );
  };

  if (!ward.patients.length) {
    return (
      <section className="cx-page cx-wd">
        <header className="cx-page-h">
          <div>
            <h1>Ward round</h1>
            <p>Your patients for today's round, kept on this device: problems, medicines, plan and jobs, a checklist for each patient, and a handover in one click.</p>
          </div>
        </header>
        <div className="cx-empty-state cx-wd-empty">
          <span className="cx-proj-ic" style={{ marginBottom: 0 }}><BedDouble size={20} /></span>
          <h3>Start your patient list</h3>
          <p>Add each patient by bed number and age and sex, such as “Bed 12 · 58M”, never by name. Cadus checks their medicines for interactions, keeps track of jobs, and writes progress notes and the SBAR handover from your notes.</p>
          <div className="cx-ideas">
            <button className="cx-btn primary" onClick={addPatient}><Plus size={15} /> Add a patient</button>
            <button className="cx-btn" onClick={() => { const list = sampleWard(); setWard((w) => ({ ...w, unit: w.unit || "Medicine Unit 2", patients: list })); setSelId([...list].sort(byBed)[0].id); }}><Stethoscope size={15} /> Try an example ward</button>
          </div>
          <small className="cx-wd-priv"><ShieldCheck size={13} /> The list never leaves this device unless you ask Cadus about a patient, and the privacy guard checks every question first.</small>
        </div>
      </section>
    );
  }

  return (
    <section className="cx-page cx-wd">
      <header className="cx-page-h">
        <div>
          <h1>Ward round</h1>
          <p>
            <input className="cx-wd-unit" value={ward.unit} onChange={(e) => setWard((w) => ({ ...w, unit: e.target.value.slice(0, 60) }))} placeholder="Name your unit" aria-label="Unit name" />
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="cx-page-acts">
          <div className="cx-rel cx-wd-menu-wrap">
            <button className={`cx-btn ${menu === "handover" ? "open" : ""}`} onClick={() => setMenu(menu === "handover" ? "" : "handover")} aria-haspopup="menu" aria-expanded={menu === "handover"}><ClipboardCheck size={15} /> Handover <ChevronDown size={14} /></button>
            {menu === "handover" && (
              <div className="cx-pop cx-wd-hmenu" role="menu">
                <button className="cx-pop-i" onClick={() => handover("sbar")}><Sparkles size={16} /> SBAR handover by Cadus</button>
                <button className="cx-pop-i" onClick={() => handover("print")}><Printer size={16} /> Print the handover sheet</button>
                <button className="cx-pop-i" onClick={() => handover("word")}><FileDown size={16} /> Handover sheet for Word</button>
                <button className="cx-pop-i" onClick={() => handover("copy")}><Copy size={16} /> Copy as a table</button>
              </div>
            )}
          </div>
          <button className="cx-btn primary" onClick={addPatient}><Plus size={15} /> Add patient</button>
        </div>
      </header>

      <div className="cx-wd-stats">
        <button className={filter === "all" ? "on" : ""} onClick={() => { setFilter("all"); setListTab("patients"); }}><small>Patients</small><b>{ward.patients.length}</b></button>
        <button className={`sick ${filter === "sick" ? "on" : ""}`} onClick={() => { setFilter(filter === "sick" ? "all" : "sick"); setListTab("patients"); }}><small>Sick or watch</small><b>{sick + watch}{sick ? <em>{sick} sick</em> : null}</b></button>
        <button className={filter === "unseen" ? "on" : ""} onClick={() => { setFilter(filter === "unseen" ? "all" : "unseen"); setListTab("patients"); }}><small>Seen today</small><b>{seen}<em>of {ward.patients.length}</em></b></button>
        <button className={listTab === "jobs" ? "on" : ""} onClick={() => setListTab(listTab === "jobs" ? "patients" : "jobs")}><small>Jobs to do</small><b>{jobs.length}</b></button>
      </div>

      <div className={`cx-wd-grid ${mobileEdit ? "editing" : ""}`}>
        <aside className="cx-wd-list" aria-label="Patients">
          <div className="cx-tabs">
            <button className={listTab === "patients" ? "on" : ""} onClick={() => setListTab("patients")}>Patients</button>
            <button className={listTab === "jobs" ? "on" : ""} onClick={() => setListTab("jobs")}>Jobs{jobs.length ? ` · ${jobs.length}` : ""}</button>
          </div>
          {listTab === "jobs" ? (
            jobs.length ? (
              <ul className="cx-wd-alljobs">
                {jobs.map(({ patient, job }) => (
                  <li key={job.id}>
                    <button className="cx-ck" role="checkbox" aria-checked={false} onClick={() => toggleJob(patient, job.id)} aria-label={`Mark done: ${job.text}`} />
                    <button className="t" onClick={() => { setSelId(patient.id); setMobileEdit(true); }}>
                      <span>{job.text}</span>
                      <small>{who(patient)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="cx-wd-none"><Check size={15} /> No jobs left. Well done.</p>
          ) : (
            <>
              {filter !== "all" && (
                <div className="cx-filter-chip">
                  <span>{filter === "sick" ? "Sick or needs watching" : filter === "unseen" ? "Not seen yet" : "With jobs"}</span>
                  <button onClick={() => setFilter("all")}>Show all</button>
                </div>
              )}
              {shownList.map((p) => {
                const open = p.jobs.filter((j) => !j.done).length;
                const ticks = p.checks.filter((c) => ROUND_CHECKS.some((r) => r.id === c)).length;
                return (
                  <button key={p.id} className={`cx-wd-row ${p.id === selId ? "on" : ""}`} onClick={() => { setSelId(p.id); setMobileEdit(true); }}>
                    <span className={`cx-wd-dot ${p.status}`} title={STATUS_LABEL[p.status]} />
                    <span className="cx-wd-bed">{p.bed || "–"}</span>
                    <span className="cx-wd-t">
                      <b>{p.label || "New patient"}{p.diagnosis ? <span> · {p.diagnosis}</span> : null}</b>
                      <small>
                        {p.checks.includes("seen") ? <span className="seen"><Check size={11} strokeWidth={3} /> Seen</span> : <span>Not seen</span>}
                        <span>{ticks}/{ROUND_CHECKS.length} checks</span>
                        {open > 0 && <span className="jobs">{open} job{open === 1 ? "" : "s"}</span>}
                      </small>
                    </span>
                  </button>
                );
              })}
              {!shownList.length && <p className="cx-wd-none">No patients match this filter.</p>}
            </>
          )}
          {ward.discharged.length > 0 && listTab === "patients" && (
            <p className="cx-wd-dc">{ward.discharged.length} discharged recently</p>
          )}
        </aside>
        <div className="cx-wd-main">
          {sel ? editor(sel) : (
            <div className="cx-empty-state">
              <h3>Select a patient</h3>
              <p>Pick a patient from the list to update their notes, jobs and checklist.</p>
            </div>
          )}
        </div>
      </div>
      <p className="cx-wd-foot"><ShieldCheck size={13} /> De-identified and kept only in this browser. Write bed numbers and age and sex, never names, phone numbers or hospital numbers. Clear the list from the patient menu when you hand over.</p>
    </section>
  );
}
