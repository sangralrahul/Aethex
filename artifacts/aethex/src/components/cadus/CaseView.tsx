/**
 * Patient cases: a de-identified case sheet with a vitals and events timeline.
 * Cadus can be asked about the case (differentials, next steps) or write its
 * notes and letters from it, in chats that stay linked to the case.
 */
import { useMemo, useState } from "react";
import {
  Activity, ArrowLeft, BedDouble, ClipboardList, FileText, MessageSquare, Plus, Search, Send, ShieldAlert, Sparkles, Trash2, X,
} from "lucide-react";
import {
  CASE_ACTIONS, CASE_LIMITS, caseLabel, caseWho, ENTRY_LABEL, EXAMPLE_CASE, latestVitals, missingSections, newCase, newEntry, vitalFlags,
  vitalsText, cleanVitals, type CaseEntry, type CaseSex, type EntryKind, type PatientCase, type Vitals,
} from "@/lib/cadus/cases";
import { deidentify, describeHits } from "@/lib/cadus/deidentify";

export interface CaseChat {
  id: string;
  title: string;
  updatedAt: number;
}

const when = (t: number) => {
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return today ? `Today, ${time}` : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
};

const VITAL_FIELDS: { k: keyof Vitals; label: string; unit: string; step?: string }[] = [
  { k: "hr", label: "HR", unit: "/min" },
  { k: "sbp", label: "SBP", unit: "mmHg" },
  { k: "dbp", label: "DBP", unit: "mmHg" },
  { k: "rr", label: "RR", unit: "/min" },
  { k: "temp", label: "Temp", unit: "°C", step: "0.1" },
  { k: "spo2", label: "SpO₂", unit: "%" },
  { k: "gcs", label: "GCS", unit: "/15" },
];

function Section({ title, value, onChange, max, rows = 3, placeholder }: { title: string; value: string; onChange: (v: string) => void; max: number; rows?: number; placeholder: string }) {
  return (
    <label className="cx-field cx-cs-sec">
      <span>{title}</span>
      <textarea className="cx-input" rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function CaseView({ cases, onChange, chatsFor, onAsk, onOpenChat, onAddToWard, toast, openId, setOpenId }: {
  cases: PatientCase[];
  onChange: (list: PatientCase[]) => void;
  chatsFor: (caseId: string) => CaseChat[];
  onAsk: (c: PatientCase, mode: string, question: string, title: string) => boolean;
  onOpenChat: (sid: string) => void;
  onAddToWard: (c: PatientCase) => void;
  toast: (t: string) => void;
  openId: string;
  setOpenId: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [ask, setAsk] = useState("");
  const [entryKind, setEntryKind] = useState<EntryKind>("vitals");
  const [entryText, setEntryText] = useState("");
  const [vit, setVit] = useState<Record<string, string>>({});
  const [o2, setO2] = useState(false);
  const [problem, setProblem] = useState("");
  const [armed, setArmed] = useState(false);
  const c = cases.find((x) => x.id === openId) ?? null;

  const update = (patch: Partial<PatientCase>) => {
    if (!c) return;
    onChange(cases.map((x) => (x.id === c.id ? { ...x, ...patch, updatedAt: Date.now() } : x)));
  };
  const create = (fresh = newCase()) => {
    onChange([fresh, ...cases]);
    setOpenId(fresh.id);
  };

  // Identifiers typed into the sheet (the privacy guard still hides them before sending).
  const idWarning = useMemo(() => {
    if (!c) return "";
    const g = deidentify([c.complaint, c.history, c.exam, c.investigations, c.meds, c.plan, ...c.timeline.map((e) => e.text)].join("\n"));
    return g.total ? describeHits(g.hits) : "";
  }, [c]);

  if (!c) {
    const term = q.trim().toLowerCase();
    const match = (x: PatientCase) => !term || [caseLabel(x), x.complaint, ...x.problems].join(" ").toLowerCase().includes(term);
    const active = cases.filter((x) => x.status === "active" && match(x)).sort((a, b) => b.updatedAt - a.updatedAt);
    const closed = cases.filter((x) => x.status === "closed" && match(x)).sort((a, b) => b.updatedAt - a.updatedAt);
    const card = (x: PatientCase) => {
      const v = latestVitals(x);
      const flags = v ? Object.values(vitalFlags(v.vitals)) : [];
      const level = flags.includes("danger") ? "danger" : flags.includes("warn") ? "warn" : "";
      return (
        <button key={x.id} className="cx-cs-card" onClick={() => setOpenId(x.id)}>
          <span className="cx-cs-card-h">
            <b>{caseLabel(x)}</b>
            {level && <em className={`cx-cs-dot ${level}`} title={level === "danger" ? "A vital sign is in the danger range" : "A vital sign is abnormal"} />}
            <small>{when(x.updatedAt)}</small>
          </span>
          <span className="cx-cs-card-c">{x.complaint || "No presenting complaint yet"}</span>
          {x.problems.length > 0 && <span className="cx-cs-card-p">{x.problems.slice(0, 3).join(" · ")}{x.problems.length > 3 ? ` · +${x.problems.length - 3}` : ""}</span>}
          {v && <span className="cx-cs-card-v"><Activity size={12} /> {vitalsText(v.vitals)}</span>}
        </button>
      );
    };
    return (
      <section className="cx-page cx-cs">
        <header className="cx-page-h">
          <div>
            <h1>Patient cases</h1>
            <p>A structured, de-identified case sheet with a timeline of vitals and events. Ask Cadus about the case, or have it write the progress note, handover, referral or discharge summary from it. Stored only on this device.</p>
          </div>
          <div className="cx-page-acts">
            <button className="cx-btn primary" onClick={() => create()}><Plus size={15} /> New case</button>
          </div>
        </header>
        {cases.length === 0 ? (
          <div className="cx-empty-state">
            <span className="cx-proj-ic" style={{ marginBottom: 0 }}><ClipboardList size={20} /></span>
            <h3>No cases yet</h3>
            <p>Start a case for a patient you're managing: bed or age and sex, never a name. Cadus reads the whole sheet each time you ask.</p>
            <div className="cx-cs-empty-acts">
              <button className="cx-btn primary" onClick={() => create()}><Plus size={15} /> New case</button>
              <button className="cx-btn" onClick={() => { create(EXAMPLE_CASE()); toast("Example case added"); }}><Sparkles size={15} /> Try an example</button>
            </div>
          </div>
        ) : (
          <>
            <div className="cx-hs-tools">
              <label className="cx-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases" aria-label="Search cases" /></label>
              <span className="cx-hs-count">{active.length} active{closed.length ? ` · ${closed.length} closed` : ""}</span>
            </div>
            {active.length ? <div className="cx-cs-grid">{active.map(card)}</div> : <p className="cx-hs-none">No active cases{term ? " match" : ""}.</p>}
            {closed.length > 0 && (
              <>
                <button className="cx-cs-closed-t" onClick={() => setShowClosed(!showClosed)} aria-expanded={showClosed}>{showClosed ? "Hide" : "Show"} closed cases ({closed.length})</button>
                {showClosed && <div className="cx-cs-grid closed">{closed.map(card)}</div>}
              </>
            )}
          </>
        )}
      </section>
    );
  }

  const v = latestVitals(c);
  const flags = v ? vitalFlags(v.vitals) : {};
  const missing = missingSections(c);
  const chats = chatsFor(c.id);
  const addEntry = () => {
    const vitals = entryKind === "vitals" ? cleanVitals({ ...Object.fromEntries(Object.entries(vit).map(([k, x]) => [k, x])), o2 }) : undefined;
    if (entryKind === "vitals" && !vitals) { toast("Enter at least one vital sign in its usual range"); return; }
    if (entryKind !== "vitals" && !entryText.trim()) { toast("Write the entry first"); return; }
    update({ timeline: [newEntry(entryKind, entryText.trim(), vitals), ...c.timeline] });
    setEntryText("");
    setVit({});
    setO2(false);
    toast(entryKind === "vitals" ? "Vitals added" : "Added to the timeline");
  };
  const askCadus = (mode: string, question: string, title: string): boolean => {
    if (!c.complaint.trim() && !c.history.trim() && !c.investigations.trim()) { toast("Add the presenting complaint or history first"); return false; }
    return onAsk(c, mode, question, title);
  };
  const removeEntry = (e: CaseEntry) => update({ timeline: c.timeline.filter((x) => x.id !== e.id) });

  return (
    <section className="cx-page cx-cs cx-cs-open">
      <header className="cx-cs-top">
        <button className="cx-back" onClick={() => setOpenId("")}><ArrowLeft size={15} /> Cases</button>
        <div className="cx-cs-title">
          <h1>{caseLabel(c)}</h1>
          <p>{caseWho(c)}{c.complaint ? ` · ${c.complaint}` : ""}{c.status === "closed" ? " · closed" : ""}</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn" onClick={() => onAddToWard(c)} title="Add this patient to today's ward round"><BedDouble size={15} /> Add to ward round</button>
          <button className="cx-btn" onClick={() => { update({ status: c.status === "active" ? "closed" : "active" }); toast(c.status === "active" ? "Case closed" : "Case reopened"); }}>{c.status === "active" ? "Close case" : "Reopen"}</button>
          <button
            className={`cx-btn danger ${armed ? "armed" : ""}`}
            onClick={() => {
              if (!armed) { setArmed(true); window.setTimeout(() => setArmed(false), 3500); return; }
              onChange(cases.filter((x) => x.id !== c.id));
              setOpenId("");
              setArmed(false);
              toast("Case deleted");
            }}
          ><Trash2 size={15} /> {armed ? "Click again" : "Delete"}</button>
        </div>
      </header>

      <div className="cx-cs-layout">
        <div className="cx-cs-sheet">
          <div className="cx-cs-who">
            <label className="cx-field"><span>Bed</span><input className="cx-input" value={c.bed} maxLength={CASE_LIMITS.bed} onChange={(e) => update({ bed: e.target.value })} placeholder="14" /></label>
            <label className="cx-field"><span>Age</span><input className="cx-input" value={c.age} maxLength={CASE_LIMITS.age} onChange={(e) => update({ age: e.target.value })} placeholder="58" inputMode="numeric" /></label>
            <div className="cx-field">
              <span>Sex</span>
              <div className="cx-seg">
                {(["M", "F", "O"] as CaseSex[]).map((s) => <button key={s} type="button" className={c.sex === s ? "on" : ""} onClick={() => update({ sex: c.sex === s ? "" : s })}>{s === "M" ? "Male" : s === "F" ? "Female" : "Other"}</button>)}
              </div>
            </div>
          </div>
          <label className="cx-field cx-cs-sec">
            <span>Presenting complaint</span>
            <input className="cx-input" value={c.complaint} maxLength={CASE_LIMITS.complaint} onChange={(e) => update({ complaint: e.target.value })} placeholder="Fever and breathlessness for 3 days" />
          </label>
          <Section title="History" value={c.history} onChange={(x) => update({ history: x })} max={CASE_LIMITS.history} rows={4} placeholder="History of presenting illness, past history, medicines before admission, allergies, social history" />
          <Section title="Examination" value={c.exam} onChange={(x) => update({ exam: x })} max={CASE_LIMITS.exam} placeholder="General examination and systems" />
          <Section title="Investigations" value={c.investigations} onChange={(x) => update({ investigations: x })} max={CASE_LIMITS.investigations} placeholder="Blood results, ECG, imaging (with units)" />
          <div className="cx-field cx-cs-sec">
            <span>Problem list</span>
            {c.problems.length > 0 && (
              <ol className="cx-cs-probs">
                {c.problems.map((p, i) => (
                  <li key={`${i}-${p}`}>
                    <span>{p}</span>
                    <button className="cx-ib" onClick={() => update({ problems: c.problems.filter((_, k) => k !== i) })} aria-label={`Remove ${p}`}><X size={14} /></button>
                  </li>
                ))}
              </ol>
            )}
            <form className="cx-cs-add" onSubmit={(e) => { e.preventDefault(); if (!problem.trim() || c.problems.length >= CASE_LIMITS.problems) return; update({ problems: [...c.problems, problem.trim().slice(0, CASE_LIMITS.problem)] }); setProblem(""); }}>
              <input className="cx-input" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Add a problem, e.g. Acute kidney injury" aria-label="Add a problem" />
              <button className="cx-btn" type="submit" disabled={!problem.trim()}><Plus size={14} /> Add</button>
            </form>
          </div>
          <Section title="Medicines" value={c.meds} onChange={(x) => update({ meds: x })} max={CASE_LIMITS.meds} rows={2} placeholder="Current medicines with doses" />
          <Section title="Plan" value={c.plan} onChange={(x) => update({ plan: x })} max={CASE_LIMITS.plan} rows={3} placeholder="Management plan so far" />
          {idWarning && (
            <p className="cx-cs-warn" role="note"><ShieldAlert size={14} /> This sheet seems to contain {idWarning}. Cadus hides them before sending, but keep identifiers out of the case.</p>
          )}
        </div>

        <aside className="cx-cs-side">
          <div className="cx-cs-panel">
            <h2><Sparkles size={15} /> Ask Cadus about this case</h2>
            {missing.length > 0 && <p className="cx-cs-miss">Not filled in yet: {missing.join(", ")}. Cadus answers from what's there.</p>}
            <form className="cx-cs-ask" onSubmit={(e) => { e.preventDefault(); if (!ask.trim()) return; if (askCadus("general", ask.trim(), `${caseLabel(c)}: ${ask.trim()}`)) setAsk(""); }}>
              <textarea className="cx-input" rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. Should we start insulin? What antibiotic, given the creatinine?" aria-label="Ask about this case"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit(); } }} />
              <button className="cx-btn primary" type="submit" disabled={!ask.trim()}><Send size={14} /> Ask</button>
            </form>
            <div className="cx-cs-acts">
              {CASE_ACTIONS.map((a) => (
                <button key={a.id} className="cx-q" onClick={() => askCadus(a.mode, a.ask, `${caseLabel(c)}: ${a.label}`)}>
                  {a.id === "ddx" || a.id === "next" ? <Sparkles size={14} /> : <FileText size={14} />} {a.label}
                </button>
              ))}
            </div>
            {chats.length > 0 && (
              <div className="cx-cs-chats">
                <small>Chats about this case</small>
                {chats.slice(0, 6).map((ch) => (
                  <button key={ch.id} onClick={() => onOpenChat(ch.id)}><MessageSquare size={13} /><span>{ch.title}</span><em>{when(ch.updatedAt)}</em></button>
                ))}
              </div>
            )}
          </div>

          <div className="cx-cs-panel">
            <h2><Activity size={15} /> Vitals and timeline</h2>
            {v && (
              <div className="cx-cs-vitals" aria-label="Latest vitals">
                {VITAL_FIELDS.filter((f) => v.vitals[f.k] !== undefined && f.k !== "dbp").map((f) => (
                  <div key={f.k} className={flags[f.k] ?? "ok"}>
                    <small>{f.label}</small>
                    <b>{f.k === "sbp" ? `${v.vitals.sbp}${v.vitals.dbp !== undefined ? `/${v.vitals.dbp}` : ""}` : String(v.vitals[f.k])}</b>
                    <em>{f.k === "sbp" ? "mmHg" : f.unit}</em>
                  </div>
                ))}
                <p>{when(v.at)}{v.vitals.o2 ? " · on oxygen" : ""}</p>
              </div>
            )}
            <div className="cx-cs-entry">
              <div className="cx-seg">
                {(["vitals", "note", "labs", "event"] as EntryKind[]).map((k) => <button key={k} type="button" className={entryKind === k ? "on" : ""} onClick={() => setEntryKind(k)}>{ENTRY_LABEL[k]}</button>)}
              </div>
              {entryKind === "vitals" && (
                <div className="cx-cs-vin">
                  {VITAL_FIELDS.map((f) => (
                    <label key={f.k}>
                      <span>{f.label}</span>
                      <input type="number" inputMode="decimal" step={f.step ?? "1"} value={vit[f.k] ?? ""} onChange={(e) => setVit({ ...vit, [f.k]: e.target.value })} aria-label={`${f.label} (${f.unit})`} />
                    </label>
                  ))}
                  <button type="button" className={`cx-tg cx-cs-o2 ${o2 ? "on" : ""}`} role="checkbox" aria-checked={o2} onClick={() => setO2(!o2)}><span className="cx-tg-box" aria-hidden /><span className="cx-tg-l">On oxygen</span></button>
                </div>
              )}
              <textarea className="cx-input" rows={2} value={entryText} maxLength={CASE_LIMITS.entry} onChange={(e) => setEntryText(e.target.value)} placeholder={entryKind === "vitals" ? "Context (optional), e.g. after 1 L of fluid" : entryKind === "labs" ? "New results, e.g. Lactate 3.1 mmol/L" : entryKind === "event" ? "What happened, e.g. Started noradrenaline" : "Ward round note"} aria-label="Timeline entry" />
              <button className="cx-btn" onClick={addEntry}><Plus size={14} /> Add to timeline</button>
            </div>
            {c.timeline.length > 0 ? (
              <ol className="cx-cs-tl">
                {c.timeline.map((e) => {
                  const ef = e.vitals ? vitalFlags(e.vitals) : {};
                  const bad = Object.values(ef).includes("danger") ? "danger" : Object.values(ef).includes("warn") ? "warn" : "";
                  return (
                    <li key={e.id} className={`k-${e.kind} ${bad}`}>
                      <span className="when">{when(e.at)} · {ENTRY_LABEL[e.kind]}</span>
                      {e.vitals && <span className="vit">{vitalsText(e.vitals)}</span>}
                      {e.text && <span className="txt">{e.text}</span>}
                      <button className="cx-ib" onClick={() => removeEntry(e)} aria-label="Remove this entry"><X size={13} /></button>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="cx-cs-miss">Add vitals, results and events as they happen; Cadus reads the latest ones.</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
