/**
 * Diet Chart Maker: calories and protein worked out on the device from the patient's details, then
 * a one-day Indian diet chart for their conditions, diet type and region, in their language, to
 * print or send on WhatsApp.
 */
import { useMemo, useState } from "react";
import { Copy, Loader2, MessageCircle, Printer, Salad, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { energyNeeds, saveDraft23, type Activity, type EnergyIn } from "@/lib/cadus/clinic23";

interface Diet { title: string; kcal: number; protein: number; meals: { time: string; name: string; items: string[] }[]; prefer: string[]; limit: string[]; swaps: string[]; tips: string[]; local: string }
const CONDITIONS = ["Type 2 diabetes", "Hypertension", "CKD (not on dialysis)", "On dialysis", "Heart disease", "High cholesterol", "Fatty liver", "Weight loss", "Pregnancy", "Breastfeeding", "Anaemia", "Hypothyroidism", "PCOS", "Gout", "Underweight"];
const REGIONS = ["North India", "Punjab", "Uttar Pradesh and Bihar", "Gujarat", "Rajasthan", "Maharashtra", "Bengal", "Odisha", "Assam and the North East", "Tamil Nadu", "Kerala", "Karnataka", "Andhra and Telangana"];
const DIETS = [["vegetarian", "Vegetarian"], ["eggetarian", "Eggs"], ["non-vegetarian", "Non-veg"], ["jain", "Jain"], ["vegan", "Vegan"]] as const;

export function dietMarkdown(d: Diet): string {
  return [
    `# ${d.title}`, `**About ${d.kcal} kcal and ${d.protein} g protein a day**`, "",
    "| Time | Meal | What to eat |", "|---|---|---|",
    ...d.meals.map((m) => `| ${m.time || ""} | ${m.name} | ${m.items.join("; ")} |`),
    d.prefer.length ? `\n**Choose more often:** ${d.prefer.join(", ")}` : "", d.limit.length ? `\n**Limit or avoid:** ${d.limit.join(", ")}` : "",
    d.swaps.length ? `\n**Easy swaps:**\n${d.swaps.map((s) => `- ${s}`).join("\n")}` : "", d.tips.length ? `\n**Tips:**\n${d.tips.map((s) => `- ${s}`).join("\n")}` : "",
    d.local ? `\n---\n\n${d.local}` : "",
  ].filter(Boolean).join("\n");
}

export default function DietView({ generate, friendlyError, toast, onPrint, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  defaultLanguage: string;
}) {
  const [conds, setConds] = useState<string[]>(["Type 2 diabetes"]);
  const [other, setOther] = useState("");
  const [p, setP] = useState({ sex: "M" as "M" | "F", age: "50", weight: "", height: "", activity: "light" as Activity, goal: "maintain" as EnergyIn["goal"] });
  const [diet, setDiet] = useState<string>("vegetarian");
  const [region, setRegion] = useState(REGIONS[0]);
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "Hindi");
  const [notes, setNotes] = useState("");
  const [kcalOverride, setKcalOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Diet | null>(null);

  const pregnancy: EnergyIn["pregnancy"] = conds.includes("Breastfeeding") ? "lactation" : conds.includes("Pregnancy") ? "t2" : "";
  const renal: EnergyIn["renal"] = conds.includes("On dialysis") ? "dialysis" : conds.includes("CKD (not on dialysis)") ? "ckd" : "";
  const goal = conds.includes("Weight loss") ? "lose" : conds.includes("Underweight") ? "gain" : p.goal;
  const e = useMemo(() => energyNeeds({ sex: p.sex, age: Number(p.age), weightKg: Number(p.weight), heightCm: Number(p.height), activity: p.activity, goal, pregnancy: p.sex === "F" ? pregnancy : "", renal }), [p, goal, pregnancy, renal]);
  const kcal = Number(kcalOverride) || e?.kcal || 0;
  const all = [...conds, ...other.split(",").map((x) => x.trim()).filter(Boolean)];

  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "diet-chart", conditions: all, goal: goal === "lose" ? "weight loss" : goal === "gain" ? "weight gain" : "", kcal, protein: e?.protein ?? 0, diet, region, language, notes: notes.trim(), patient: [p.age && `${p.age} years`, p.sex === "F" ? "female" : "male", p.weight && `${p.weight} kg`].filter(Boolean).join(", ") });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result);
      saveDraft23("diet", r.result.title, r.result);
    } catch (err) { toast(friendlyError(err instanceof Error ? err.message : String(err))); } finally { setBusy(false); }
  };

  return (
    <section className="cx-page cx-lab cx-diet">
      <header className="cx-page-h"><div><h1>Diet Chart Maker</h1><p>A day's Indian diet chart for the patient's conditions, diet and region, with the calories and protein worked out from their details, in their language to print or send on WhatsApp.</p></div></header>
      <div className="cx-oncall-calls" role="group" aria-label="Conditions">{CONDITIONS.map((c) => <button key={c} className={conds.includes(c) ? "on" : ""} aria-pressed={conds.includes(c)} onClick={() => setConds((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))} data-diet-cond={c}>{c}</button>)}</div>
      <div className="cx-c23-grid">
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={p.sex} onChange={(ev) => setP({ ...p, sex: ev.target.value as "M" | "F" })}><option value="M">Male</option><option value="F">Female</option></select></label>
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={p.age} onChange={(ev) => setP({ ...p, age: ev.target.value.replace(/\D/g, "").slice(0, 3) })} data-diet="age" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={p.weight} onChange={(ev) => setP({ ...p, weight: ev.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="70" data-diet="weight" /></label>
        <label className="cx-field"><span>Height (cm)</span><input className="cx-input" inputMode="decimal" value={p.height} onChange={(ev) => setP({ ...p, height: ev.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="165" data-diet="height" /></label>
        <label className="cx-field"><span>Activity</span><select className="cx-select" value={p.activity} onChange={(ev) => setP({ ...p, activity: ev.target.value as Activity })}><option value="bed">In bed or very little</option><option value="light">Light (desk work, housework)</option><option value="moderate">Moderate (on the feet, walks daily)</option><option value="heavy">Heavy (labour, farm work)</option></select></label>
        <label className="cx-field"><span>Diet</span><select className="cx-select" value={diet} onChange={(ev) => setDiet(ev.target.value)} data-diet="type">{DIETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="cx-field"><span>Region</span><select className="cx-select" value={region} onChange={(ev) => setRegion(ev.target.value)}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="cx-field"><span>Language</span><select className="cx-select" value={language} onChange={(ev) => setLanguage(ev.target.value)} data-diet="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
      </div>
      <div className="cx-roster-in">
        <label className="cx-field"><span>Other conditions (comma-separated)</span><input className="cx-input" value={other} onChange={(ev) => setOther(ev.target.value.slice(0, 200))} placeholder="e.g. lactose intolerance, celiac disease" /></label>
        <label className="cx-field"><span>Notes for the chart (optional)</span><input className="cx-input" value={notes} onChange={(ev) => setNotes(ev.target.value.slice(0, 400))} placeholder="e.g. night shift worker, fasts on Tuesdays, K⁺ 5.6" /></label>
      </div>
      <div className="cx-diet-energy" data-diet="energy">
        {e ? <span>About <b>{e.kcal} kcal</b> and <b>{e.protein} g protein</b> a day · BMI {e.bmi} · ideal weight about {e.ibw} kg</span> : <span>Add age, weight and height to work out the calories, or enter them:</span>}
        <label><span>kcal</span><input className="cx-input sm" inputMode="numeric" value={kcalOverride} onChange={(ev) => setKcalOverride(ev.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={e ? String(e.kcal) : "1600"} aria-label="Calories a day" data-diet="kcal" /></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !(kcal >= 800 && kcal <= 4500) || !all.length} data-diet="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Salad size={14} />} Make the diet chart</button></div>
      {res && (
        <div className="cx-cmp-out" data-diet="out">
          <h3 className="cx-lab-h3">{res.title} · {res.kcal || kcal} kcal · {res.protein || e?.protein} g protein</h3>
          <div className="cx-c23-scroll"><table className="cx-c23-table"><thead><tr><th>Time</th><th>Meal</th><th>What to eat</th></tr></thead><tbody>{res.meals.map((m, i) => <tr key={i}><td>{m.time}</td><td><b>{m.name}</b></td><td>{m.items.join(" · ")}</td></tr>)}</tbody></table></div>
          <div className="cx-c23-two">
            {res.prefer.length > 0 && <div><h4>Choose more often</h4><ul>{res.prefer.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {res.limit.length > 0 && <div><h4>Limit or avoid</h4><ul>{res.limit.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          </div>
          {res.swaps.length > 0 && <><h4>Easy swaps</h4><ul>{res.swaps.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {res.tips.length > 0 && <><h4>Tips</h4><ul>{res.tips.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {res.local && <div className="cx-c23-local" data-diet="local"><h4>{language}</h4><MdBlock text={res.local} /></div>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint(res.title, dietMarkdown(res))} data-diet="print"><Printer size={14} /> Print</button>
            <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent((res.local || dietMarkdown(res)).slice(0, 3500))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(dietMarkdown(res)); toast("Copied"); }}><Copy size={14} /> Copy</button>
          </div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> A starting chart from standard advice (ICMR-NIN and disease guidelines). Adjust for the patient's labs, medicines and preferences, and refer to a dietitian for complex needs.</p>
    </section>
  );
}
