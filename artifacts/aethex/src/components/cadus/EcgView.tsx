/**
 * ECG Reader: a photo or scan of a 12-lead ECG read systematically by the stronger model:
 * rate, rhythm, axis, intervals, findings by lead, the impression and next steps, with
 * urgent patterns (STEMI, complete heart block, hyperkalaemia, long QTc) flagged on top.
 */
import { useEffect, useRef, useState } from "react";
import { Activity, Camera, Copy, MessageSquare, Printer, ShieldCheck, Siren, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { attachmentPayload, type Attachment } from "@/lib/cadus/files";
import { ecgMarkdown, readEcgs, saveEcgs, type EcgRecord } from "@/lib/cadus/clinicalAi";
import { sid } from "@/lib/cadus/studio";
import { Bullets, SavedList, thumbnail } from "./BedsideParts";

export default function EcgView({ generate, readFile, friendlyError, toast, onPrint, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onAsk: (q: string) => void;
}) {
  const [file, setFile] = useState<Attachment | null>(null);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<EcgRecord[]>(readEcgs);
  const [openId, setOpenId] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => saveEcgs(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;

  const add = async (fl: FileList | null) => {
    const f = fl?.[0];
    if (ref.current) ref.current.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add a photo or PDF of the ECG"); return; }
    try { setFile(await readFile(f)); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
  };
  const run = async () => {
    if (!file) { toast("Add a photo or scan of the ECG"); return; }
    setBusy(true);
    try {
      const ctx = deidentify(context).text;
      const r = await generate({ action: "ecg", files: attachmentPayload([file]), age, sex, context: ctx });
      if (!r?.result) throw new Error("No read came back");
      const rec: EcgRecord = { id: sid(), at: Date.now(), age, sex, context: ctx.slice(0, 300), thumb: file.kind === "image" && file.data ? await thumbnail(file.data) : "", result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const x = open?.result;
  return (
    <section className="cx-page cx-bs cx-ecg">
      <header className="cx-page-h"><div><h1>ECG Reader</h1><p>Photograph a 12-lead ECG. Cadus reads it systematically and flags urgent patterns such as STEMI, heart block or hyperkalaemia, with what to do next.</p></div></header>
      <div className="cx-ecg-in">
        <input ref={ref} type="file" hidden accept="image/*,application/pdf,.pdf" capture="environment" onChange={(e) => void add(e.target.files)} data-ecg="file" />
        {file ? (
          <div className="cx-ecg-prev">{file.kind === "image" && file.data ? <img src={file.data} alt="The ECG to read" /> : <span>{file.name}</span>}<button className="cx-ib" onClick={() => setFile(null)} aria-label="Remove"><X size={15} /></button></div>
        ) : (
          <button className="cx-ecg-drop" onClick={() => ref.current?.click()} data-ecg="pick"><Camera size={22} /><b>Photo or scan of the ECG</b><small>Flat, well lit, all 12 leads and the calibration in view</small></button>
        )}
        <div className="cx-ecg-side">
          <div className="cx-mr-pt cx-bs-pt2">
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, "").slice(0, 3))} placeholder="years" data-ecg="age" /></label>
            <div className="cx-field"><span>Sex</span><div className="cx-seg">{(["male", "female"] as const).map((s) => <button key={s} className={sex === s ? "on" : ""} onClick={() => setSex(sex === s ? "" : s)}>{s === "male" ? "Male" : "Female"}</button>)}</div></div>
          </div>
          <textarea className="cx-input" rows={3} value={context} onChange={(e) => setContext(e.target.value.slice(0, 2000))} placeholder="Clinical context (optional): chest pain for 1 hour, on digoxin, K 6.2…" aria-label="Clinical context" data-ecg="context" />
          <button className="cx-btn primary" onClick={() => void run()} disabled={busy || !file} data-ecg="go"><Activity size={15} /> {busy ? "Reading the ECG…" : "Read ECG"}</button>
        </div>
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Crop the patient's name off the ECG. A machine-assisted read: always look at the tracing yourself.</p>

      {x && open ? (
        <div className="cx-cmp-out" data-ecg="out">
          <div className={`cx-rxc-verdict ${x.urgent ? "v-unsafe" : "v-ok"}`} data-ecg="verdict">
            {x.urgent ? <Siren size={22} /> : <ShieldCheck size={22} />}
            <div><b>{x.urgent ? `Urgent: ${x.urgentLabel}` : "No urgent pattern seen"}</b><p>{x.impression}</p></div>
          </div>
          <div className="cx-ecg-grid" data-ecg="numbers">
            {[["Rate", x.rate], ["Rhythm", x.rhythm], ["Axis", x.axis], ["PR", x.intervals.pr], ["QRS", x.intervals.qrs], ["QTc", x.intervals.qtc || x.intervals.qt]].map(([k, v]) => <div key={k}><small>{k}</small><b>{v || "—"}</b></div>)}
          </div>
          <ul className="cx-ecg-find">{x.findings.map((f, i) => <li key={i} className={`s-${f.significance}`}>{f.lead && <b>{f.lead}</b>}<span>{f.finding}</span></li>)}</ul>
          <div className="cx-sim-cols">
            <Bullets title="Next steps" items={x.actions} ordered tone={x.urgent ? "bad" : undefined} />
            <Bullets title="Also consider" items={x.differentials} />
          </div>
          <p className="cx-rs-foot">Confidence: {x.confidence}{x.limits ? ` · ${x.limits}` : ""}</p>
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint("ECG report", ecgMarkdown(open))}><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(ecgMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-btn" onClick={() => onAsk(`An ECG read: ${x.impression}. Findings: ${x.findings.map((f) => `${f.lead ? `${f.lead}: ` : ""}${f.finding}`).join("; ")}.${open.context ? ` Context: ${open.context}.` : ""} Explain the reasoning and the management.`)}><MessageSquare size={14} /> Discuss</button>
            <button className="cx-ib" onClick={() => { setList((l) => l.filter((y) => y.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>No ECGs read yet</h3><p>Take a photo of a 12-lead ECG to start.</p></div>
      ) : null}
      <SavedList title="Recent ECGs" items={list} openId={openId} onOpen={setOpenId} render={(r) => ({ b: <>{r.result.urgent && <Siren size={13} className="cx-ecg-urg" />} {r.result.impression.slice(0, 70)}</>, s: [r.age && `${r.age} y`, r.sex].filter(Boolean).join(" ") || "ECG" })} />
    </section>
  );
}
