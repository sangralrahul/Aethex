/**
 * Pill Chart: a prescription from the prescriber as a picture chart (sunrise, sun, sunset and moon
 * for the times of day) that patients who don't read can follow, with before or after food. Made on
 * this device; print it large.
 */
import { useMemo, useState } from "react";
import { CalendarDays, Printer } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { readPrescriptions } from "@/lib/cadus/formulary";
import { pillChartMarkdown } from "@/lib/cadus/clinic22";

export default function PillChartView({ onPrint, onOpenPrescriber }: { onPrint: (title: string, md: string) => void; onOpenPrescriber: () => void }) {
  const list = useMemo(() => readPrescriptions().filter((p) => p.items.length), []);
  const [id, setId] = useState(list[0]?.id ?? "");
  const rx = list.find((p) => p.id === id) ?? null;
  const md = rx ? pillChartMarkdown(rx) : "";
  return (
    <section className="cx-page cx-lab cx-pill">
      <header className="cx-page-h"><div><h1>Pill Chart</h1><p>Turn a prescription into a picture chart the patient can follow without reading: a sunrise, sun, sunset and moon for the times of day, and how many to take at each.</p></div></header>
      {list.length ? (
        <>
          <label className="cx-field"><span>Prescription</span><select className="cx-select" value={id} onChange={(e) => setId(e.target.value)} data-pill="rx">{list.map((p) => <option key={p.id} value={p.id}>{[p.patient, p.diagnosis || p.items.map((i) => i.name).join(", ").slice(0, 50), new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })].filter(Boolean).join(" · ")}</option>)}</select></label>
          <div className="cx-sc-note cx-pill-chart" data-pill="chart"><MdBlock text={md} /></div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => rx && onPrint("Medicine chart", md)} data-pill="print"><Printer size={14} /> Print large</button></div>
        </>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><CalendarDays size={20} /></span><h3>No prescriptions yet</h3><p>Write one in the prescriber or the Prescription Writer, then come back.</p><button className="cx-btn primary" onClick={onOpenPrescriber}>Open the prescriber</button></div>
      )}
    </section>
  );
}
