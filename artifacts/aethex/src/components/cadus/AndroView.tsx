/**
 * Cadus Andro (update 107): the male partner's fertility work-up, in four steps. A private intake (no name needed),
 * the semen report and hormones (typed in, or read from photos or PDFs and then confirmed), a doctor summary where
 * every value is judged by rules against WHO 2021 limits with AUA/ASRM 2020 and EAU steps cited, and a plain-language
 * explainer in English or Hinglish that is released only after a doctor signs off. Follow-up reminder by calendar file.
 * Rules: lib/cadus/andro.ts. Kept on this device only if the user agrees; deleted with one tap.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, CalendarPlus, Camera, ClipboardCopy, FlaskConical, Loader2, Lock, MessageSquareText, ShieldCheck, Siren, Sparkles, Stethoscope, Trash2, UserRound } from "lucide-react";
import { attachmentPayload, type Attachment } from "@/lib/cadus/files";
import { emptyCase, evaluate, exampleCase, explainer, summaryText, type AndroCase, type Intake, type SemenKey } from "@/lib/cadus/andro";

const KEY = "cadus.andro.v1";
interface Saved { c: AndroCase; signer: string; signedAt: number | null; note: string }
const read = (): Saved | null => { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; } };

const HISTORY: [keyof Intake, string][] = [
  ["smoking", "Smokes or chews tobacco"], ["alcohol", "Drinks alcohol most weeks"], ["heat", "Heat at work or habit (furnace, sauna, hot baths, laptop on lap)"],
  ["testosterone", "Uses testosterone, steroids or a \"testosterone booster\""], ["fever", "Fever in the last 3 months"], ["obesity", "BMI 30 or more"],
  ["drugs", "Recreational drugs (including cannabis)"], ["undescended", "Undescended testis as a child"], ["mumps", "Mumps with testicular swelling"],
  ["chemo", "Chemotherapy or radiotherapy"], ["injury", "Testicular injury or torsion"], ["sexual", "Erection or ejaculation problems"],
];
const RED: [keyof Intake, string][] = [["lump", "A lump in a testis"], ["pain", "Sudden painful swelling of a testis"]];

const MAP: [RegExp, SemenKey | "fsh" | "lh" | "testosterone" | "prolactin"][] = [
  [/progress|\bpr\b|rapid/i, "progressive"], [/total\s*(sperm\s*)?(count|number)|total sperm/i, "total"], [/concentration|density|sperm count|count\s*\/\s*ml/i, "concentration"],
  [/motil/i, "motility"], [/morpholog|normal form/i, "morphology"], [/vitality|viab|live sperm/i, "vitality"], [/\bph\b/i, "ph"], [/volume/i, "volume"],
  [/\bfsh\b|follicle/i, "fsh"], [/\blh\b|luteini/i, "lh"], [/testost/i, "testosterone"], [/prolactin|\bprl\b/i, "prolactin"],
];

const ics = (date: Date) => {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cadus//Andro//EN", "BEGIN:VEVENT", `UID:andro-${Date.now()}@cadus.aethex.in`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${d}`, "SUMMARY:Repeat semen analysis", "DESCRIPTION:Repeat semen analysis (after 2 to 7 days without ejaculation). Reminder from Cadus Andro.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
};

export default function AndroView({ generate, readFile, friendlyError, toast, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onAsk: (q: string) => void;
}) {
  const saved = useMemo(read, []);
  const [c, setC] = useState<AndroCase>(saved?.c ?? emptyCase());
  const [keep, setKeep] = useState(!!saved);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [signer, setSigner] = useState(saved?.signer ?? "");
  const [signedAt, setSignedAt] = useState<number | null>(saved?.signedAt ?? null);
  const [note, setNote] = useState(saved?.note ?? "");
  const [reading, setReading] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const r = useMemo(() => evaluate(c), [c]);

  useEffect(() => {
    try { if (keep) localStorage.setItem(KEY, JSON.stringify({ c, signer, signedAt, note } satisfies Saved)); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  }, [keep, c, signer, signedAt, note]);
  // any change after sign-off needs a new sign-off
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } setSignedAt(null); }, [c]);

  const setS = (k: SemenKey, v: string) => setC((x) => ({ ...x, semen: { ...x.semen, [k]: v.replace(/[^\d.,]/g, "").slice(0, 6) } }));
  const setH = (k: "fsh" | "lh" | "testosterone" | "prolactin", v: string) => setC((x) => ({ ...x, hormones: { ...x.hormones, [k]: v.replace(/[^\d.,]/g, "").slice(0, 6) } }));
  const setI = (k: keyof Intake, v: string | boolean) => setC((x) => ({ ...x, intake: { ...x.intake, [k]: v } }));

  const readReports = async (fl: FileList | null) => {
    const files: Attachment[] = [];
    for (const f of Array.from(fl ?? []).slice(0, 4)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add photos or PDFs of the reports"); continue; }
      try { files.push(await readFile(f)); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
    }
    if (fileRef.current) fileRef.current.value = "";
    if (!files.length) return;
    setReading(true);
    try {
      const res = await generate({ action: "lab-extract", files: attachmentPayload(files) });
      const rows = (res?.rows ?? []) as { test: string; value: string; unit: string }[];
      let n = 0;
      setC((x) => {
        const next = { ...x, semen: { ...x.semen }, hormones: { ...x.hormones } };
        for (const row of rows) {
          const hit = MAP.find(([re]) => re.test(row.test))?.[1];
          const val = String(row.value ?? "").match(/\d+(?:[.,]\d+)?/)?.[0];
          if (!hit || !val) continue;
          n++;
          if (hit === "fsh" || hit === "lh" || hit === "testosterone" || hit === "prolactin") {
            next.hormones[hit] = val;
            if (hit === "testosterone") next.hormones.tUnit = /nmol/i.test(row.unit) ? "nmol/L" : "ng/dL";
          } else next.semen[hit] = val;
        }
        return next;
      });
      setTimeout(() => { setReadCount(n); toast(n ? `${n} values read. Check each one against the report before going on.` : "No semen or hormone values found. Type them in instead."); }, 0);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setReading(false); }
  };

  const repeatDate = new Date(Date.now() + (r.repeatInMonths ?? 3) * 30.4 * 86400000);
  const downloadIcs = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics(repeatDate)], { type: "text/calendar" })); a.download = "repeat-semen-analysis.ics"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(summaryText(c, r) + (note.trim() ? `\nDoctor's note: ${note.trim()}` : "")); toast("Summary copied (no names)"); } catch { toast("Couldn't copy"); } };
  const ask = () => onAsk(`${summaryText(c, r)}\n\nAs the treating doctor's assistant: explain this pattern, the likely causes to look for, and anything in the suggested work-up I should add or question, citing AUA/ASRM 2020 or EAU where relevant. Do not change any value or limit.`);
  const reset = () => { setC(emptyCase()); setSigner(""); setSignedAt(null); setNote(""); setStep(0); setReadCount(0); toast("Cleared"); };

  const STEPS = ["Private intake", "Reports", "Doctor summary", "Patient explainer"];
  const flagged = r.rows.filter((x) => x.status === "low" || x.status === "absent").length;

  return (
    <section className="cx-page cx-lab cx-andro" data-andro="view">
      <style>{CSS}</style>
      <header className="cx-page-h">
        <div>
          <p className="cx-andro-kicker"><Stethoscope size={14} /> Cadus Andro</p>
          <h1>Male Fertility Work-up</h1>
          <p>Brings the male partner into the fertility work-up: a private intake, the semen report judged against WHO 2021 limits, a cited plan for the doctor, and a plain explainer for him in English or Hinglish.</p>
        </div>
        <div className="cx-andro-head-acts">
          <button className="cx-btn" onClick={() => { setC(exampleCase()); setStep(1); }} data-andro="example"><Sparkles size={14} /> Try an example</button>
          <button className="cx-btn ghost" onClick={reset} data-andro="clear"><Trash2 size={14} /> Clear</button>
        </div>
      </header>

      <ol className="cx-andro-steps" role="tablist">
        {STEPS.map((s, i) => (
          <li key={s}><button role="tab" aria-selected={step === i} className={step === i ? "on" : i < step ? "done" : ""} onClick={() => setStep(i)} data-andro-step={i}><span>{i + 1}</span>{s}</button></li>
        ))}
      </ol>

      {r.flags.some((f) => f.urgent) && (
        <div className="cx-andro-red" role="alert" data-andro="urgent"><Siren size={18} /><div>{r.flags.filter((f) => f.urgent).map((f) => <p key={f.text}><b>{f.text}</b></p>)}</div></div>
      )}

      {step === 0 && (
        <div className="cx-andro-card" data-andro="intake">
          <p className="cx-andro-private"><Lock size={14} /> No name needed. Nothing leaves this device unless you ask Cadus a question.</p>
          <div className="cx-c23-row">
            <label className="cx-field"><span>His age</span><input className="cx-input" inputMode="numeric" value={c.intake.age} onChange={(e) => setI("age", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="31" data-andro="age" /></label>
            <label className="cx-field"><span>Partner's age</span><input className="cx-input" inputMode="numeric" value={c.intake.partnerAge} onChange={(e) => setI("partnerAge", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="29" /></label>
            <label className="cx-field"><span>Months trying</span><input className="cx-input" inputMode="numeric" value={c.intake.months} onChange={(e) => setI("months", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="12" /></label>
          </div>
          <h4>History and habits</h4>
          <div className="cx-andro-ticks">{HISTORY.map(([k, label]) => <label key={k} className={`cx-pa-mine ${c.intake[k] ? "on" : ""}`}><input type="checkbox" checked={!!c.intake[k]} onChange={(e) => setI(k, e.target.checked)} data-andro-h={k} /> {label}</label>)}</div>
          <h4>Warning signs</h4>
          <div className="cx-andro-ticks red">{RED.map(([k, label]) => <label key={k} className={`cx-pa-mine ${c.intake[k] ? "on" : ""}`}><input type="checkbox" checked={!!c.intake[k]} onChange={(e) => setI(k, e.target.checked)} data-andro-h={k} /> {label}</label>)}</div>
          <h4>Examination (doctor)</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Varicocele</span><select className="cx-input" value={c.exam.varicocele} onChange={(e) => setC((x) => ({ ...x, exam: { ...x.exam, varicocele: e.target.value as AndroCase["exam"]["varicocele"] } }))}><option value="none">None found</option><option value="subclinical">Only on ultrasound</option><option value="clinical">Felt on examination</option></select></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={c.exam.smallTestes} onChange={(e) => setC((x) => ({ ...x, exam: { ...x.exam, smallTestes: e.target.checked } }))} /> Small or soft testes</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={c.exam.vasAbsent} onChange={(e) => setC((x) => ({ ...x, exam: { ...x.exam, vasAbsent: e.target.checked } }))} /> Vas deferens not felt</label>
          </div>
          <div className="cx-andro-next"><button className="cx-btn primary" onClick={() => setStep(1)} data-andro="to-reports">Next: reports</button></div>
        </div>
      )}

      {step === 1 && (
        <div className="cx-andro-card" data-andro="reports">
          <div className="cx-andro-upload">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => readReports(e.target.files)} />
            <button className="cx-btn" onClick={() => fileRef.current?.click()} disabled={reading} data-andro="upload">{reading ? <Loader2 size={14} className="cx-rot" /> : <Camera size={14} />} {reading ? "Reading the report…" : "Read a report (photo or PDF)"}</button>
            <span>{readCount ? `${readCount} values read: check each one below.` : "Or type the values from any lab's report."}</span>
          </div>
          <h4>Semen analysis <small>(after 2 to 7 days without ejaculation)</small></h4>
          <div className="cx-andro-grid">
            {r.rows.map((x) => (
              <label key={x.key} className={`cx-field cx-andro-val ${x.status}`} data-andro-v={x.key}>
                <span>{x.label}{x.unit ? ` (${x.unit})` : ""}</span>
                <input className="cx-input" inputMode="decimal" value={c.semen[x.key]} onChange={(e) => setS(x.key, e.target.value)} placeholder={x.calculated && x.value !== null ? `${x.value} (calculated)` : `limit ${x.low}`} />
                <small>WHO 2021 lower limit {x.low}{x.status === "low" ? " · below" : x.status === "absent" ? " · none seen" : x.status === "normal" ? " · within" : ""}</small>
              </label>
            ))}
          </div>
          <h4>Hormones <small>(if done)</small></h4>
          <div className="cx-andro-grid">
            <label className="cx-field"><span>FSH (IU/L)</span><input className="cx-input" inputMode="decimal" value={c.hormones.fsh} onChange={(e) => setH("fsh", e.target.value)} placeholder="e.g. 5.2" /></label>
            <label className="cx-field"><span>LH (IU/L)</span><input className="cx-input" inputMode="decimal" value={c.hormones.lh} onChange={(e) => setH("lh", e.target.value)} placeholder="e.g. 4.1" /></label>
            <label className="cx-field"><span>Total testosterone</span><div className="cx-andro-unit"><input className="cx-input" inputMode="decimal" value={c.hormones.testosterone} onChange={(e) => setH("testosterone", e.target.value)} placeholder={c.hormones.tUnit === "ng/dL" ? "e.g. 450" : "e.g. 15.6"} /><select className="cx-input" value={c.hormones.tUnit} onChange={(e) => setC((x) => ({ ...x, hormones: { ...x.hormones, tUnit: e.target.value as "ng/dL" | "nmol/L" } }))}><option>ng/dL</option><option>nmol/L</option></select></div></label>
            <label className="cx-field"><span>Prolactin (ng/mL)</span><input className="cx-input" inputMode="decimal" value={c.hormones.prolactin} onChange={(e) => setH("prolactin", e.target.value)} placeholder="e.g. 9" /></label>
          </div>
          <div className="cx-andro-next"><button className="cx-btn" onClick={() => setStep(0)}>Back</button><button className="cx-btn primary" onClick={() => setStep(2)} data-andro="to-summary">See the doctor summary</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="cx-andro-card" data-andro="summary">
          {r.entered === 0 ? <p className="cx-andro-empty"><FlaskConical size={16} /> Add the semen analysis in step 2, or try the example.</p> : (
            <>
              <div className={`cx-andro-pattern ${r.normal ? "ok" : "bad"}`} data-andro="pattern"><small>Pattern</small><b>{r.pattern}</b><span>{flagged ? `${flagged} value${flagged === 1 ? "" : "s"} below WHO 2021 limits` : "All entered values within limits"}</span></div>
              <table className="cx-andro-table" data-andro="table">
                <thead><tr><th>Parameter</th><th>Result</th><th>WHO 2021 limit</th><th>Cadus flag</th></tr></thead>
                <tbody>{r.rows.filter((x) => x.value !== null).map((x) => (
                  <tr key={x.key} className={x.status}><td>{x.label}</td><td>{x.value}{x.unit && x.unit !== "%" ? ` ${x.unit}` : x.unit}{x.calculated ? " *" : ""}</td><td>≥ {x.low}</td><td><em>{x.status === "normal" ? "Normal" : x.status === "absent" ? "None seen" : "Below limit"}</em></td></tr>
                ))}</tbody>
              </table>
              {r.rows.some((x) => x.calculated) && <p className="cx-andro-fine">* Total sperm number calculated from volume × concentration.</p>}
            </>
          )}
          {r.hormoneNotes.length > 0 && <><h4>Hormones</h4><ul className="cx-andro-list">{r.hormoneNotes.map((h) => <li key={h.text}>{h.text} <cite>{h.source}</cite></li>)}</ul></>}
          {r.flags.filter((f) => !f.urgent).length > 0 && <div className="cx-andro-flags">{r.flags.filter((f) => !f.urgent).map((f) => <p key={f.text}><Siren size={14} /> {f.text}</p>)}</div>}
          <h4>Suggested work-up</h4>
          <ol className="cx-andro-list" data-andro="workup">{r.workup.map((w) => <li key={w.text}>{w.text} <cite>{w.source}</cite></li>)}</ol>
          {r.lifestyle.length > 0 && <><h4>Things he can change</h4><ul className="cx-andro-list">{r.lifestyle.map((l) => <li key={l}>{l}</li>)}</ul></>}
          <div className="cx-andro-sign" data-andro="signoff">
            <h4><BadgeCheck size={16} /> Doctor review and sign-off</h4>
            <textarea className="cx-input" rows={2} value={note} onChange={(e) => { setNote(e.target.value); setSignedAt(null); }} placeholder="Your edits or notes for this patient (optional)" />
            <div className="cx-c23-row">
              <label className="cx-field"><span>Reviewing doctor</span><input className="cx-input" value={signer} onChange={(e) => { setSigner(e.target.value.slice(0, 80)); setSignedAt(null); }} placeholder="Dr name, registration no." data-andro="signer" /></label>
              <button className="cx-btn primary" disabled={!signer.trim() || r.entered === 0} onClick={() => { setSignedAt(Date.now()); toast("Signed off: the patient explainer is ready"); }} data-andro="approve">{signedAt ? "Signed off" : "Approve and sign off"}</button>
            </div>
            {signedAt && <p className="cx-andro-ok" data-andro="signed"><ShieldCheck size={14} /> Reviewed by {signer} on {new Date(signedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. Any change needs a new sign-off.</p>}
          </div>
          <div className="cx-andro-next">
            <button className="cx-btn" onClick={copy} data-andro="copy"><ClipboardCopy size={14} /> Copy summary</button>
            <button className="cx-btn" onClick={ask} disabled={r.entered === 0} data-andro="ask"><MessageSquareText size={14} /> Discuss with Cadus</button>
            <button className="cx-btn primary" onClick={() => setStep(3)} data-andro="to-patient">Patient explainer</button>
          </div>
          <p className="cx-andro-fine">Numbers are judged by fixed rules against WHO laboratory manual, 6th ed. (2021). Steps follow Schlegel PN et al., AUA/ASRM Guideline on Infertility in Men (2020), and EAU guidelines. Decision support for a doctor, not a diagnosis.</p>
        </div>
      )}

      {step === 3 && (
        <div className="cx-andro-card" data-andro="patient">
          <div className="cx-andro-lang" role="group" aria-label="Language">
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} data-andro-lang="en">English</button>
            <button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")} data-andro-lang="hi">Hinglish</button>
          </div>
          {signedAt ? (
            <div className="cx-andro-explain" data-andro="explainer">
              <p className="cx-andro-for"><UserRound size={15} /> {lang === "en" ? "For you, in plain words" : "Aapke liye, aasaan shabdon mein"}</p>
              {explainer(r, lang).map((p) => <p key={p}>{p}</p>)}
              {note.trim() && <p className="cx-andro-docnote"><b>{lang === "en" ? "From your doctor:" : "Doctor ki salah:"}</b> {note.trim()}</p>}
              <p className="cx-andro-ok"><ShieldCheck size={14} /> {lang === "en" ? `Reviewed by ${signer}` : `${signer} ne dekha hai`}</p>
            </div>
          ) : (
            <div className="cx-andro-locked" data-andro="locked"><Lock size={18} /><div><b>Awaiting doctor sign-off</b><p>The explainer is released to the patient only after a doctor reviews the summary in step 3.</p><button className="cx-btn" onClick={() => setStep(2)}>Go to sign-off</button></div></div>
          )}
          {r.repeatInMonths && (
            <div className="cx-andro-follow" data-andro="followup"><CalendarPlus size={16} /><div><b>Repeat semen analysis around {repeatDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</b><p>About {r.repeatInMonths} months: one full cycle of sperm production.</p></div><button className="cx-btn" onClick={downloadIcs} data-andro="ics">Add to calendar</button></div>
          )}
        </div>
      )}

      <div className="cx-andro-keep">
        <label className="cx-pa-mine"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} data-andro="keep" /> Keep this case on this device (you agree; delete any time)</label>
        {keep && <button className="cx-btn ghost" onClick={() => { setKeep(false); reset(); }}><Trash2 size={13} /> Delete it now</button>}
      </div>
    </section>
  );
}

const CSS = `
.cx-andro .cx-page-h{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
.cx-andro-kicker{display:inline-flex;align-items:center;gap:6px;margin:0 0 4px;padding:3px 10px;border-radius:999px;background:#e6f2ef;color:#1f5e57;font-size:12.5px;font-weight:700;letter-spacing:.02em}
.cx-andro-head-acts{display:flex;gap:8px;flex-wrap:wrap}
.cx-andro-steps{list-style:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0;padding:0}
.cx-andro-steps button{display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--t2);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;text-align:left}
.cx-andro-steps button span{display:grid;place-items:center;flex:none;width:22px;height:22px;border-radius:50%;background:var(--line);color:var(--text);font-size:12px}
.cx-andro-steps button.on{border-color:#1f5e57;color:var(--text);box-shadow:0 0 0 2px rgba(31,94,87,.15)}
.cx-andro-steps button.on span{background:#1f5e57;color:#fff}
.cx-andro-steps button.done span{background:#cfe6e1;color:#1f5e57}
.cx-andro-card{display:flex;flex-direction:column;gap:6px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-andro-card h4{margin:12px 0 4px;font-size:14px}
.cx-andro-card h4 small{font-weight:400;color:var(--t3)}
.cx-andro-private{display:flex;align-items:center;gap:6px;margin:0;color:#1f5e57;font-size:13px;font-weight:600}
.cx-andro-ticks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 14px}
.cx-andro-ticks .cx-pa-mine{padding:8px 10px;border:1px solid var(--line);border-radius:10px}
.cx-andro-ticks .cx-pa-mine.on{border-color:#1f5e57;background:#eef6f4}
.cx-andro-ticks.red .cx-pa-mine.on{border-color:#c2410c;background:#fff4ec}
.cx-andro-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.cx-andro-val small{color:var(--t3);font-size:11.5px}
.cx-andro-val.low input,.cx-andro-val.absent input{border-color:#dc2626;background:#fff5f5}
.cx-andro-val.low small,.cx-andro-val.absent small{color:#b91c1c;font-weight:600}
.cx-andro-val.normal small{color:#15803d}
.cx-andro-unit{display:flex;gap:6px}.cx-andro-unit select{flex:0 0 92px}
.cx-andro-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px;border:1px dashed var(--line);border-radius:12px;color:var(--t2);font-size:13px}
.cx-andro-next{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}
.cx-andro-pattern{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:12px;border:1px solid}
.cx-andro-pattern small{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--t3)}
.cx-andro-pattern b{font-size:18px;text-transform:capitalize}
.cx-andro-pattern span{font-size:13px;color:var(--t2)}
.cx-andro-pattern.bad{border-color:#f3c4c4;background:#fff6f6}.cx-andro-pattern.ok{border-color:#bfe3cf;background:#f2fbf6}
.cx-andro-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:14px}
.cx-andro-table th{padding:9px 10px;background:#1f5e57;color:#fff;text-align:left;font-weight:600}
.cx-andro-table td{padding:9px 10px;border-bottom:1px solid var(--line)}
.cx-andro-table em{font-style:normal;font-weight:700;padding:2px 8px;border-radius:6px}
.cx-andro-table tr.normal em{background:#dcf2e7;color:#166534}.cx-andro-table tr.low em,.cx-andro-table tr.absent em{background:#fde2e2;color:#b91c1c}
.cx-andro-list{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.5}
.cx-andro-list cite{font-style:normal;font-size:11.5px;font-weight:700;color:#1f5e57;background:#e6f2ef;padding:1px 6px;border-radius:5px;white-space:nowrap}
.cx-andro-flags p,.cx-andro-red p{margin:4px 0;display:flex;gap:6px;align-items:center;font-size:13.5px;color:#9a3412}
.cx-andro-red{display:flex;gap:10px;align-items:flex-start;margin:0 0 12px;padding:12px 14px;border:1px solid #fca5a5;border-radius:12px;background:#fff1f1;color:#b91c1c}
.cx-andro-red p{color:#b91c1c}
.cx-andro-sign{margin-top:14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--bg,#fff)}
.cx-andro-sign h4{display:flex;align-items:center;gap:6px;margin-top:0}
.cx-andro-ok{display:flex;align-items:center;gap:6px;margin:6px 0 0;color:#15803d;font-size:13px;font-weight:600}
.cx-andro-fine{margin:8px 0 0;color:var(--t3);font-size:12px}
.cx-andro-empty{display:flex;align-items:center;gap:8px;color:var(--t2)}
.cx-andro-lang{display:inline-flex;align-self:flex-start;padding:3px;border:1px solid var(--line);border-radius:10px}
.cx-andro-lang button{padding:6px 14px;border:0;border-radius:8px;background:none;font:inherit;font-size:13px;font-weight:600;color:var(--t2);cursor:pointer}
.cx-andro-lang button.on{background:#1f5e57;color:#fff}
.cx-andro-explain{padding:16px 18px;border-radius:14px;background:#1f5e57;color:#fff;font-size:16px;line-height:1.6}
.cx-andro-explain p{margin:0 0 8px}
.cx-andro-explain .cx-andro-ok{color:#bff0dd}
.cx-andro-for{display:flex;align-items:center;gap:6px;font-size:13px!important;font-weight:700;letter-spacing:.03em;text-transform:uppercase;opacity:.85}
.cx-andro-docnote{padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.12)}
.cx-andro-locked{display:flex;gap:12px;align-items:flex-start;padding:16px;border:1px dashed var(--line);border-radius:14px;color:var(--t2)}
.cx-andro-locked b{color:var(--text)}.cx-andro-locked p{margin:4px 0 8px}
.cx-andro-follow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px}
.cx-andro-follow div{flex:1;min-width:200px}.cx-andro-follow p{margin:2px 0 0;font-size:13px;color:var(--t2)}
.cx-andro-keep{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}
@media (max-width:760px){.cx-andro-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.cx-andro-ticks{grid-template-columns:1fr}.cx-andro-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cx-andro-table{font-size:12.5px}}
`;
