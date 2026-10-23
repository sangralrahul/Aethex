/**
 * Lab Trends: serial results charted over time. Paste them, or photograph the reports and Cadus
 * copies out the results (names and IDs left out); keep a set per patient; and have the trends
 * explained test by test, with what to check next and anything urgent.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Camera, ChartLine, FileText, Loader2, Save, Siren, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import LabTrends from "./LabTrends";
import { attachmentPayload, type Attachment } from "@/lib/cadus/files";
import { newLabSet, readLabSets, rowsToLabText, saveLabSets, type LabRow, type LabSet } from "@/lib/cadus/clinic20";

interface Explain { summary: string; items: { test: string; trend: "better" | "worse" | "stable" | "new" | "mixed"; meaning: string }[]; together: string; next: string[]; urgent: string[] }
const TREND_ICON = { better: ArrowDownRight, worse: ArrowUpRight, stable: ArrowRight, new: Sparkles, mixed: ArrowRight };

export default function LabTrendsView({ generate, readFile, friendlyError, toast, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onAsk: (q: string) => void;
}) {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [reading, setReading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explain, setExplain] = useState<Explain | null>(null);
  const [sets, setSets] = useState<LabSet[]>(readLabSets);
  const [openId, setOpenId] = useState("");
  const [label, setLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => saveLabSets(sets), [sets]);
  useEffect(() => setExplain(null), [text]);

  const readReports = async (fl: FileList | null) => {
    const files: Attachment[] = [];
    for (const f of Array.from(fl ?? []).slice(0, 6)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add photos or PDFs of the reports"); continue; }
      try { files.push(await readFile(f)); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
    }
    if (fileRef.current) fileRef.current.value = "";
    if (!files.length) return;
    setReading(true);
    try {
      const r = await generate({ action: "lab-extract", files: attachmentPayload(files) });
      const rows = (r?.rows ?? []) as LabRow[];
      if (!rows.length) throw new Error("No results could be read");
      const added = rowsToLabText(rows);
      setText((t) => (t.trim() ? `${t.trim()}\n${added}` : added));
      toast(`${rows.length} results read from ${files.length} report${files.length === 1 ? "" : "s"}. Check them against the reports.`);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setReading(false); }
  };

  const runExplain = async (table: string) => {
    setExplaining(true);
    try {
      const r = await generate({ action: "lab-explain", table, context: context.trim() });
      if (!r?.result) throw new Error("No explanation came back");
      setExplain(r.result);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setExplaining(false); }
  };

  const save = () => {
    if (!text.trim()) return;
    const name = label.trim() || `Patient ${sets.length + 1}`;
    const existing = sets.find((s) => s.id === openId);
    if (existing) setSets((l) => l.map((s) => (s.id === existing.id ? { ...s, label: name, text, at: Date.now() } : s)));
    else { const s = newLabSet(name, text); setSets((l) => [s, ...l]); setOpenId(s.id); }
    toast("Saved on this device");
  };

  return (
    <section className="cx-page cx-lab cx-ltv">
      <header className="cx-page-h"><div><h1>Lab Trends</h1><p>See how a patient's results are changing. Photograph the reports or paste the results; Cadus charts every test against its usual range and explains the trends.</p></div></header>
      <div className="cx-ltv-bar">
        <input ref={fileRef} type="file" hidden multiple accept="image/*,application/pdf,.pdf" onChange={(e) => void readReports(e.target.files)} data-ltv="file" />
        <button className="cx-btn primary" onClick={() => fileRef.current?.click()} disabled={reading} data-ltv="photo">{reading ? <><Loader2 size={14} className="cx-rot" /> Reading the reports…</> : <><Camera size={14} /> Photos or PDFs of reports</>}</button>
        <input className="cx-input" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 40))} placeholder="Label, e.g. Bed 12 or 58M (no names)" aria-label="Label" data-ltv="label" />
        <button className="cx-btn" onClick={save} disabled={!text.trim()} data-ltv="save"><Save size={14} /> Save</button>
      </div>
      <label className="cx-field cx-ltv-ctx"><span>Clinical context (optional, helps the explanation)</span><input className="cx-input" value={context} onChange={(e) => setContext(e.target.value.slice(0, 1200))} placeholder="e.g. 62M, sepsis from a UTI, on IV ceftriaxone since day 1; CKD 3a" data-ltv="context" /></label>
      <LabTrends value={text} onChange={setText} onAsk={onAsk} toast={toast} onExplain={(t) => void runExplain(t)} explaining={explaining} />

      {explain && (
        <div className="cx-ltv-ex" data-ltv="explain">
          {explain.urgent.length > 0 && <div className="cx-ltv-urgent" data-ltv="urgent"><Siren size={15} /><div><b>Act today</b><ul>{explain.urgent.map((u) => <li key={u}>{u}</li>)}</ul></div></div>}
          <p className="cx-ltv-sum">{explain.summary}</p>
          <ul className="cx-ltv-items">
            {explain.items.map((i) => { const Icon = TREND_ICON[i.trend]; return <li key={i.test} className={`t-${i.trend}`}><span className="cx-ltv-tag"><Icon size={13} /> {i.trend}</span><b>{i.test}</b> {i.meaning}</li>; })}
          </ul>
          {explain.together && <p><b>Together:</b> {explain.together}</p>}
          {explain.next.length > 0 && <div className="cx-sim-card"><h3>Check or do next</h3><ul>{explain.next.map((n) => <li key={n}>{n}</li>)}</ul></div>}
        </div>
      )}

      {sets.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Saved patients</span></p>
          {sets.map((s) => (
            <div key={s.id} className={`cx-sc-row ${s.id === openId ? "on" : ""}`}>
              <button className="cx-ltv-open" onClick={() => { setOpenId(s.id); setLabel(s.label); setText(s.text); }}><b><ChartLine size={13} /> {s.label}</b><small>{s.text.split("\n").length} reports · {new Date(s.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>
              <button className="cx-ib" aria-label={`Delete ${s.label}`} onClick={() => { setSets((l) => l.filter((x) => x.id !== s.id)); if (openId === s.id) setOpenId(""); }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Results read from photos can be misread: check them against the reports. <FileText size={12} /> Saved on this device only.</p>
    </section>
  );
}
