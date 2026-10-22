/**
 * Differential Builder: age, sex, setting and the findings in, a ranked differential out.
 * Each diagnosis shows what fits and what doesn't and the one test that decides it; the
 * can't-miss diagnoses are flagged, with the next tests in order and what to ask or examine.
 */
import { useEffect, useState } from "react";
import { Copy, MessageSquare, Printer, Siren, Sparkles, Trash2, TriangleAlert, Waypoints } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { ddxMarkdown, readDdx, saveDdx, sid, type DdxRecord } from "@/lib/cadus/studio";

const SETTINGS = [{ id: "opd", label: "OPD" }, { id: "ward", label: "Ward" }, { id: "emergency", label: "Emergency" }, { id: "icu", label: "ICU" }] as const;
const EXAMPLES = [
  "Fever for 6 days with headache, myalgia and a rash on the trunk; platelets 40,000. Monsoon, farm worker.",
  "Breathlessness on exertion for 3 months, bilateral pedal oedema, raised JVP, basal crackles.",
  "Sudden severe headache while lifting, vomiting, neck stiffness, BP 180/100, GCS 14.",
  "Painless jaundice for 3 weeks, weight loss, pruritus, palpable gallbladder.",
];

export default function DifferentialView({ generate, friendlyError, toast, onPrint, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onAsk: (q: string) => void;
}) {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [setting, setSetting] = useState<(typeof SETTINGS)[number]["id"]>("opd");
  const [findings, setFindings] = useState("");
  const [results, setResults] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<DdxRecord[]>(readDdx);
  const [openId, setOpenId] = useState("");
  useEffect(() => saveDdx(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;
  const ready = findings.trim().split(/\s+/).length >= 4;

  const run = async () => {
    if (!ready) { toast("Describe the findings in a few words at least"); return; }
    setBusy(true);
    try {
      const f = deidentify(findings).text;
      const res = deidentify(results).text;
      const r = await generate({ action: "differential", age, sex, setting, findings: f, results: res });
      if (!r?.result?.diagnoses?.length) throw new Error("No differential came back");
      const rec: DdxRecord = { id: sid(), at: Date.now(), age, sex, setting, findings: f, results: res, result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const x = open?.result;
  const cantMiss = x ? x.diagnoses.filter((d) => d.cantMiss) : [];
  return (
    <section className="cx-page cx-dx">
      <header className="cx-page-h"><div><h1>Differential Builder</h1><p>Enter the findings and get a ranked differential: what fits, what doesn't, the test that decides each one, and the can't-miss diagnoses flagged.</p></div></header>
      <div className="cx-mr-pt cx-dx-pt">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="years" data-dx="age" /></label>
        <div className="cx-field"><span>Sex</span><div className="cx-seg">{(["male", "female"] as const).map((s) => <button key={s} className={sex === s ? "on" : ""} onClick={() => setSex(sex === s ? "" : s)} data-dx-sex={s}>{s === "male" ? "Male" : "Female"}</button>)}</div></div>
        <div className="cx-field cx-dx-set"><span>Seen in</span><div className="cx-seg">{SETTINGS.map((s) => <button key={s.id} className={setting === s.id ? "on" : ""} onClick={() => setSetting(s.id)} data-dx-setting={s.id}>{s.label}</button>)}</div></div>
      </div>
      <textarea className="cx-input" rows={5} value={findings} onChange={(e) => setFindings(e.target.value)} maxLength={8000} aria-label="Findings" data-dx="findings" placeholder="Symptoms with duration, examination findings, relevant history…" />
      <textarea className="cx-input cx-dx-res" rows={2} value={results} onChange={(e) => setResults(e.target.value)} maxLength={4000} aria-label="Results so far" placeholder="Results so far (optional): CBC, LFT, X-ray…" />
      {!findings && <div className="cx-tr-phrases">{EXAMPLES.map((e) => <button key={e} onClick={() => setFindings(e)}>{e}</button>)}</div>}
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-dx="go"><Waypoints size={15} /> {busy ? "Thinking it through…" : "Build differential"}</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> A thinking aid, not a diagnosis. Names and numbers are hidden before sending.</p>

      {x && open ? (
        <div className="cx-cmp-out" data-dx="out">
          {x.summary && <p className="cx-dx-sum">{x.summary}</p>}
          {(x.redFlags.length > 0 || cantMiss.length > 0) && (
            <div className="cx-rxc-verdict v-unsafe" data-dx="cantmiss"><Siren size={20} /><div>
              {cantMiss.length > 0 && <b>Can't miss: {cantMiss.map((d) => d.name).join(", ")}</b>}
              {x.redFlags.length > 0 && <p>{x.redFlags.join(" · ")}</p>}
            </div></div>
          )}
          <ol className="cx-dx-list">
            {x.diagnoses.map((d, i) => (
              <li key={i} className={`cx-dx-item l-${d.likelihood.replace(" ", "-")}`} data-dx-item={i}>
                <div className="cx-dx-h"><b>{d.name}</b><em className={`cx-dx-like l-${d.likelihood.replace(" ", "-")}`}>{d.likelihood === "likely" ? "Likely" : d.likelihood === "possible" ? "Possible" : "Less likely"}</em>{d.cantMiss && <em className="cx-dx-cm">Can't miss</em>}</div>
                <div className="cx-dx-fa">
                  {d.for.length > 0 && <p><span className="for">For</span> {d.for.join(" · ")}</p>}
                  {d.against.length > 0 && <p><span className="against">Against</span> {d.against.join(" · ")}</p>}
                  {d.test && <p><span className="test">Test</span> {d.test}</p>}
                </div>
                <button className="cx-link" onClick={() => onAsk(`Patient: ${open.age ? `${open.age} y` : ""} ${open.sex} in ${open.setting}. Findings: ${open.findings}${open.results ? `. Results: ${open.results}` : ""}. Walk me through ${d.name}: how to confirm or exclude it here, and how to manage it if confirmed.`)}><MessageSquare size={13} /> Discuss</button>
              </li>
            ))}
          </ol>
          <div className="cx-sim-cols">
            {x.nextTests.length > 0 && <div className="cx-sim-card"><h3>Next tests, in order</h3><ol>{x.nextTests.map((t) => <li key={t.test}><b>{t.test}</b>{t.why && ` · ${t.why}`}</li>)}</ol></div>}
            {x.ask.length > 0 && <div className="cx-sim-card"><h3>Ask or examine</h3><ul>{x.ask.map((a) => <li key={a}>{a}</li>)}</ul></div>}
          </div>
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint("Differential diagnosis", ddxMarkdown(open))}><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(ddxMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-ib" onClick={() => { setList((l) => l.filter((y) => y.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Start with the findings</h3><p>Or try one of the examples above.</p></div>
      ) : null}
      {list.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent differentials</span></p>
          {list.slice(0, 8).map((r) => <button key={r.id} className={`cx-sc-row ${r.id === openId ? "on" : ""}`} onClick={() => setOpenId(r.id)}><b>{r.result.diagnoses[0]?.name}{r.result.diagnoses.length > 1 ? ` and ${r.result.diagnoses.length - 1} more` : ""}</b><small>{r.findings.slice(0, 80)}… · {new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      )}
    </section>
  );
}
