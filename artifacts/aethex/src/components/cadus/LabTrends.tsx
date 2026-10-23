/**
 * Lab trends: paste serial results and see each test as a small chart against
 * its usual reference range, with the latest value flagged and a table that
 * Cadus can interpret. Parsing and charts run in the browser.
 */
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, ChartLine, ClipboardPaste, Copy, MessageSquare, X } from "lucide-react";
import { flag, LAB_EXAMPLE, parseLabText, trend, trendTable, type Flag, type LabTable, type Series } from "@/lib/cadus/labtrends";

const FLAG_LABEL: Record<Flag, string> = { high: "High", low: "Low", normal: "In range", none: "" };

const fmt = (v: number) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-IN") : String(Math.round(v * 100) / 100));

/** One test over time: a line against the shaded reference range. */
function TrendChart({ s, points }: { s: Series; points: string[] }) {
  const W = 300, H = 132, L = 38, R = 18, T = 18, B = 24;
  const pw = W - L - R, ph = H - T - B;
  const vals = s.values.filter((v): v is number => v !== null);
  const n = points.length;
  const x = (i: number) => (n === 1 ? L + pw / 2 : L + (i * pw) / (n - 1));
  let lo = Math.min(...vals, ...(s.low !== undefined ? [s.low] : []));
  let hi = Math.max(...vals, ...(s.high !== undefined ? [s.high] : []));
  if (hi - lo < 1e-9) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
  const pad = (hi - lo) * 0.1;
  lo = Math.min(...vals) >= 0 && lo - pad < 0 ? 0 : lo - pad;
  hi += pad;
  const y = (v: number) => T + ph - ((v - lo) / (hi - lo)) * ph;
  // The line breaks where a value is missing.
  const segs: string[] = [];
  let cur = "";
  s.values.forEach((v, i) => {
    if (v === null) { if (cur) segs.push(cur); cur = ""; return; }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (cur) segs.push(cur);
  const bandTop = s.high !== undefined ? Math.max(T, y(Math.min(s.high, hi))) : T;
  const bandBot = s.low !== undefined ? Math.min(T + ph, y(Math.max(s.low, lo))) : T + ph;
  const hasBand = (s.low !== undefined || s.high !== undefined) && bandBot > bandTop;
  const idx = s.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const last = idx[idx.length - 1];
  const tr = trend(s);
  const label = `${s.name}${s.unit ? ` in ${s.unit}` : ""}: ${vals.map(fmt).join(", ")} across ${points.filter((_, i) => s.values[i] !== null).join(", ")}${s.low !== undefined && s.high !== undefined ? `. Usual range ${s.low} to ${s.high}` : ""}.`;
  const xLabels = n <= 5 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
  return (
    <svg className="cx-lt-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {hasBand && <rect className="lt-band" x={L} y={bandTop} width={pw} height={bandBot - bandTop} rx="3" />}
      {s.high !== undefined && s.high <= hi && s.high >= lo && <text className="lt-ax" x={L - 6} y={y(s.high) + 3} textAnchor="end">{fmt(s.high)}</text>}
      {s.low !== undefined && s.low >= lo && s.low <= hi && <text className="lt-ax" x={L - 6} y={y(s.low) + 3} textAnchor="end">{fmt(s.low)}</text>}
      <line className="lt-base" x1={L} x2={L + pw} y1={T + ph} y2={T + ph} />
      {segs.map((d) => <path key={d} className="lt-line" d={d} />)}
      {s.values.map((v, i) => v === null ? null : (
        <circle key={i} className={`lt-pt ${flag(s, v)} ${i === last ? "last" : ""}`} cx={x(i)} cy={y(v)} r={i === last ? 4.2 : 3.2} />
      ))}
      {last !== undefined && (
        <text className="lt-v" x={x(last)} y={y(s.values[last]!) - 8} textAnchor={n === 1 ? "middle" : "end"}>{fmt(s.values[last]!)}</text>
      )}
      {xLabels.map((i) => (
        <text key={i} className="lt-ax" x={x(i)} y={H - 6} textAnchor={n === 1 ? "middle" : i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{points[i].length > 12 ? `${points[i].slice(0, 11)}…` : points[i]}</text>
      ))}
      <title>{label}{tr.pct !== undefined ? ` ${tr.dir === "up" ? "Rising" : tr.dir === "down" ? "Falling" : "Stable"} ${Math.abs(Math.round(tr.pct))}%.` : ""}</title>
    </svg>
  );
}

function TrendCard({ s, points }: { s: Series; points: string[] }) {
  const tr = trend(s);
  const latest = tr.last;
  const f = flag(s, latest ?? null);
  const Dir = tr.dir === "up" ? ArrowUpRight : tr.dir === "down" ? ArrowDownRight : ArrowRight;
  const firstAt = points[s.values.findIndex((v) => v !== null)];
  return (
    <article className={`cx-lt-card ${f}`}>
      <header>
        <div className="cx-lt-name"><b>{s.name}</b>{s.unit && <small>{s.unit}</small>}</div>
        <div className="cx-lt-now">
          <b>{latest !== undefined ? fmt(latest) : "–"}</b>
          {f !== "none" && <span className={`cx-lt-flag ${f}`}>{FLAG_LABEL[f]}</span>}
        </div>
      </header>
      <TrendChart s={s} points={points} />
      <footer>
        {tr.dir !== "none" ? (
          <span className={`cx-lt-tr ${tr.dir}`}><Dir size={13} /> {tr.dir === "flat" ? "Stable" : `${tr.dir === "up" ? "Up" : "Down"} ${tr.pct !== undefined ? `${Math.abs(Math.round(tr.pct))}%` : fmt(Math.abs(tr.change ?? 0))}`} since {firstAt}</span>
        ) : <span className="cx-lt-tr">One result</span>}
        {s.low !== undefined && s.high !== undefined && <span className="cx-lt-rng">Usual {fmt(s.low)} to {fmt(s.high)}</span>}
      </footer>
    </article>
  );
}

export default function LabTrends({ onAsk, toast, value, onChange, onExplain, explaining }: {
  onAsk: (text: string) => void;
  toast: (t: string) => void;
  /** Controlled text (Lab Trends page); the calculators keep their own. */
  value?: string;
  onChange?: (t: string) => void;
  /** Explains the trends on the page instead of in the chat. */
  onExplain?: (table: string) => void;
  explaining?: boolean;
}) {
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const setText = onChange ?? setOwn;
  const table: LabTable = useMemo(() => parseLabText(text), [text]);
  const has = table.series.length > 0;
  const abnormal = table.series.filter((s) => { const v = [...s.values].reverse().find((x) => x !== null); return v !== undefined && v !== null && (flag(s, v) === "high" || flag(s, v) === "low"); });

  const copyTable = async () => {
    try {
      await navigator.clipboard.writeText(trendTable(table));
      toast("Table copied (paste into Word or a note)");
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };

  return (
    <div className="cx-lt">
      <div className="cx-lt-in">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Paste serial results, one line per day:\nAdmission: Hb 9.8, TLC 18,600, Plt 0.9, Na 129, Cr 2.4\nDay 2: Hb 9.4, TLC 15,200, Plt 0.7, Na 131, Cr 2.1\n\nOr paste a table from Excel or a lab report."}
          aria-label="Lab results"
          spellCheck={false}
          rows={has ? 5 : 8}
        />
        <div className="cx-lt-bar">
          {!text ? (
            <button className="cx-btn" onClick={() => setText(LAB_EXAMPLE)}><ClipboardPaste size={14} /> Try an example</button>
          ) : (
            <button className="cx-btn" onClick={() => setText("")}><X size={14} /> Clear</button>
          )}
          <span>One line per day, or a table with dates across the top or down the side. Platelets in lakh, ×10³ or per µL; creatinine in mg/dL or µmol/L; temperature in °F or °C.</span>
        </div>
      </div>

      {has ? (
        <>
          <div className="cx-lt-sum">
            <span><ChartLine size={15} /> <b>{table.series.length} test{table.series.length === 1 ? "" : "s"}</b> over {table.points.length} result{table.points.length === 1 ? "" : "s"}, {table.points[0]} to {table.points[table.points.length - 1]}</span>
            <span className={abnormal.length ? "warn" : "ok"}>{abnormal.length ? `${abnormal.length} outside the usual range on the latest result` : "Latest results all within the usual range"}</span>
            <div className="cx-lt-acts">
              <button className="cx-btn" onClick={() => void copyTable()}><Copy size={14} /> Copy table</button>
              {onExplain && <button className="cx-btn primary" onClick={() => onExplain(trendTable(table))} disabled={explaining} data-lt="explain"><MessageSquare size={14} /> {explaining ? "Explaining…" : "Explain the trends"}</button>}
              <button className={`cx-btn ${onExplain ? "" : "primary"}`} onClick={() => onAsk(`Interpret these serial results (de-identified). Comment on each trend, what it suggests together, and what to check or do next.\n\n${trendTable(table)}`)}><MessageSquare size={14} /> Ask Cadus to interpret</button>
            </div>
          </div>
          {table.unknown.length > 0 && <p className="cx-lt-unknown">Not recognised, so not charted: {table.unknown.join(", ")}</p>}
          <div className="cx-lt-grid">
            {table.series.map((s) => <TrendCard key={s.id} s={s} points={table.points} />)}
          </div>
          <div className="cx-lt-table">
            <table>
              <thead>
                <tr><th>Test</th>{table.points.map((p, i) => <th key={i}>{p}</th>)}<th>Usual range</th></tr>
              </thead>
              <tbody>
                {table.series.map((s) => (
                  <tr key={s.id}>
                    <th>{s.name}{s.unit && <small> {s.unit}</small>}</th>
                    {s.values.map((v, i) => <td key={i} className={flag(s, v)}>{v === null ? "–" : fmt(v)}</td>)}
                    <td className="rng">{s.low !== undefined && s.high !== undefined ? `${fmt(s.low)} to ${fmt(s.high)}` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cx-lt-foot"><BadgeCheck size={14} /> Charted in your browser, not by AI. Ranges are usual adult values and differ between laboratories, ages and pregnancy: use your laboratory's range.</p>
        </>
      ) : text.trim() ? (
        <div className="cx-ix-empty">
          <ChartLine size={20} />
          <b>No results recognised yet</b>
          <span>Put each test name before its value, such as “Hb 9.4” or “Creatinine: 2.1”, with one day per line, or paste a table.</span>
        </div>
      ) : (
        <div className="cx-ix-empty">
          <ChartLine size={20} />
          <b>See how results are changing</b>
          <span>Paste results from several days to chart each test against its usual range. Cadus recognises about 40 common tests, including the names used on Indian lab reports such as TLC, SGPT and S. creatinine.</span>
        </div>
      )}
    </div>
  );
}
