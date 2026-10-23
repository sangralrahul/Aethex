/**
 * Pregnancy & Breastfeeding: is each medicine safe now (by trimester, or while breastfeeding), why,
 * what to do, and a safer alternative, from current evidence rather than the old letter categories.
 */
import { useState } from "react";
import { Baby, Loader2, Pill, TriangleAlert } from "lucide-react";

interface Res { items: { drug: string; safety: "safe" | "caution" | "avoid" | "contraindicated" | "unknown"; why: string; action: string; alternative: string }[]; general: string }
const STAGES = ["Planning pregnancy", "First trimester", "Second trimester", "Third trimester", "Breastfeeding a newborn", "Breastfeeding an older baby"];
const LABEL = { safe: "Compatible", caution: "Use with care", avoid: "Avoid if possible", contraindicated: "Do not use", unknown: "Not enough data" };

export default function PregLactView({ generate, friendlyError, toast }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [drugs, setDrugs] = useState("");
  const [stage, setStage] = useState(STAGES[1]);
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  const list = drugs.split(/\n|,/).map((d) => d.trim()).filter(Boolean);
  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "preg-lact", drugs: list, stage, context: context.trim() });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-preg">
      <header className="cx-page-h"><div><h1>Pregnancy &amp; Breastfeeding</h1><p>Check medicines for a pregnant or breastfeeding woman: how safe each one is right now, why, what to do and the safer alternative.</p></div></header>
      <div className="cx-oncall-calls">{STAGES.map((s) => <button key={s} className={stage === s ? "on" : ""} onClick={() => setStage(s)} data-preg-stage={s}>{s}</button>)}</div>
      <div className="cx-roster-in">
        <label className="cx-field"><span><Pill size={13} /> Medicines (one per line)</span><textarea className="cx-input" rows={5} value={drugs} onChange={(e) => setDrugs(e.target.value.slice(0, 2000))} placeholder={"Telmisartan 40 mg\nMetformin 500 mg\nDoxycycline"} data-preg="drugs" /></label>
        <label className="cx-field"><span>Context (optional)</span><textarea className="cx-input" rows={5} value={context} onChange={(e) => setContext(e.target.value.slice(0, 300))} placeholder="e.g. chronic hypertension, 10 weeks; baby born at 34 weeks" /></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !list.length} data-preg="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Baby size={14} />} Check {list.length || ""} medicine{list.length === 1 ? "" : "s"}</button></div>
      {res && (
        <div className="cx-cmp-out" data-preg="out">
          {res.items.map((i) => (
            <div key={i.drug} className={`cx-preg-row s-${i.safety}`} data-preg-safety={i.safety}>
              <div className="cx-preg-h"><b>{i.drug}</b><span>{LABEL[i.safety]}</span></div>
              <p>{i.why}</p>
              {i.action && <p><b>What to do:</b> {i.action}</p>}
              {i.alternative && <p><b>Safer alternative:</b> {i.alternative}</p>}
            </div>
          ))}
          {res.general && <p className="cx-set-hint">{res.general}</p>}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Weigh the risk of the illness against the medicine, and check with obstetric or paediatric colleagues when unsure.</p>
    </section>
  );
}
