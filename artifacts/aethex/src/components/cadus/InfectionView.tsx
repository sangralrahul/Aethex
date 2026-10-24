/**
 * Infection Control & Waste: isolation precautions by disease, and which biomedical waste bin
 * (Bio-Medical Waste Management Rules, 2016) each item goes in, searchable, with a wall chart.
 */
import { useState } from "react";
import { Printer, Search, ShieldPlus, Trash2 } from "lucide-react";
import { BMW_BINS, findBin, PRECAUTIONS } from "@/lib/cadus/clinic26";

export default function InfectionView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"waste" | "isolation">("waste");
  const [q, setQ] = useState("");
  const bins = findBin(q);
  const iso = PRECAUTIONS.filter((p) => !q.trim() || p.disease.toLowerCase().includes(q.trim().toLowerCase()));
  const chart = () => ["# Biomedical waste: which bin", "", "| Bin | What goes in | Treatment |", "|---|---|---|", ...BMW_BINS.map((b) => `| **${b.colour}** | ${b.what.join("; ")} | ${b.treatment} |`), "", "_Bio-Medical Waste Management Rules, 2016. Never mix; don't overfill (three-quarters full); label with the date and source._"].join("\n");

  return (
    <section className="cx-page cx-lab cx-infect">
      <header className="cx-page-h"><div><h1>Infection Control &amp; Waste</h1><p>Which bin each item goes in under the Bio-Medical Waste Management Rules, 2016, and the isolation precautions for common infections.</p></div></header>
      <div className="cx-c23-row">
        <div className="cx-seg" role="tablist">{([["waste", "Waste bins"], ["isolation", "Isolation"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => { setTab(v); setQ(""); }} data-ic-tab={v}>{v === "waste" ? <Trash2 size={13} /> : <ShieldPlus size={13} />} {l}</button>)}</div>
        <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "waste" ? "What are you throwing away? e.g. needle, vial, gloves" : "Disease, e.g. TB, measles"} aria-label="Search" data-ic="q" /></label>
      </div>
      {tab === "waste" ? (
        <>
          <div className="cx-bmw" data-ic="bins">{(bins.length ? bins : BMW_BINS).map((b) => (
            <div key={b.colour} className={`cx-bmw-bin c-${b.colour.split(" ")[0].toLowerCase()}`} data-ic-bin={b.colour.split(" ")[0]}>
              <b>{b.colour}</b><ul>{b.what.map((w) => <li key={w}>{w}</li>)}</ul><small>{b.treatment}</small>
            </div>
          ))}</div>
          {q && !bins.length && <p className="cx-set-hint">Nothing matched "{q}": all four bins are shown.</p>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Biomedical waste chart", chart())} data-ic="print"><Printer size={14} /> Print the wall chart</button></div>
        </>
      ) : (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-ic="iso"><thead><tr><th>Infection</th><th>Precautions</th><th>Notes</th></tr></thead><tbody>{iso.map((p) => <tr key={p.disease}><td><b>{p.disease}</b></td><td>{p.type}</td><td>{p.note}</td></tr>)}</tbody></table></div>
      )}
      <p className="cx-rs-foot"><ShieldPlus size={13} /> Follow your hospital infection control committee and state pollution control board rules where they differ.</p>
    </section>
  );
}
