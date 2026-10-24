/**
 * Lab Reference Ranges: typical adult ranges for common tests, searchable by test or group.
 * Labs differ: their own range wins.
 */
import { useState } from "react";
import { Search, TestTubes } from "lucide-react";
import { findLab } from "@/lib/cadus/clinic27";

export default function LabRangesView() {
  const [q, setQ] = useState("");
  const rows = findLab(q);
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <section className="cx-page cx-lab cx-labr">
      <header className="cx-page-h"><div><h1>Lab Reference Ranges</h1><p>Typical adult reference ranges for common tests, for a quick check on the ward or before an exam.</p></div></header>
      <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Test or group, e.g. potassium, liver, thyroid" aria-label="Find a test" data-lr="q" /></label>
      {groups.length ? groups.map((g) => (
        <div key={g} className="cx-c23-scroll"><table className="cx-c23-table" data-lr-group={g}><thead><tr><th colSpan={3}>{g}</th></tr></thead><tbody>{rows.filter((r) => r.group === g).map((r) => <tr key={r.test} data-lr-test={r.test}><td><b>{r.test}</b></td><td>{r.range}</td><td>{r.unit}</td></tr>)}</tbody></table></div>
      )) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><TestTubes size={20} /></span><h3>No test matches "{q}"</h3><p>Try another name.</p></div>}
      <p className="cx-rs-foot"><TestTubes size={13} /> Typical adult ranges; every laboratory sets its own, and ranges differ in children, pregnancy and older age. Always use the range printed on the report.</p>
    </section>
  );
}
