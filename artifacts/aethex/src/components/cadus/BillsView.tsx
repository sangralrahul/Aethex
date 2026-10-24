/**
 * Clinic Bills & Receipts: OPD receipts on the letterhead with numbers that run through the
 * financial year, cash/UPI/card, cancelling (never deleting) a receipt, the day's collection by
 * mode, and a CSV for the accountant. Kept on this device only.
 */
import { useMemo, useState } from "react";
import { Ban, Download, Plus, Printer, ReceiptIndianRupee, Trash2 } from "lucide-react";
import { BILL_PRESETS, billMarkdown, billsCsv, billTotal, daySummary, isoDay, nextBillNo, readBills, rupees, saveBills, type Bill, type BillItem, type PayMode } from "@/lib/cadus/clinic24";

const MODES: [PayMode, string][] = [["cash", "Cash"], ["upi", "UPI"], ["card", "Card"], ["other", "Other"]];
const blankItem = (): BillItem => ({ text: "Consultation", qty: 1, rate: 0 });

export default function BillsView({ toast, onPrint, clinic }: { toast: (t: string) => void; onPrint: (title: string, md: string) => void; clinic: string }) {
  const [bills, setBills] = useState<Bill[]>(readBills);
  const today = isoDay(new Date());
  const [day, setDay] = useState(today);
  const [f, setF] = useState({ patient: "", phone: "", discount: "", mode: "cash" as PayMode, note: "" });
  const [items, setItems] = useState<BillItem[]>([blankItem()]);
  const put = (l: Bill[]) => { setBills(l); saveBills(l); };
  const total = billTotal({ items, discount: Number(f.discount) || 0 });
  const sum = useMemo(() => daySummary(bills, day), [bills, day]);
  const ofDay = useMemo(() => bills.filter((b) => b.date === day).sort((a, b) => b.at - a.at), [bills, day]);

  const save = (print: boolean) => {
    const good = items.filter((i) => i.text.trim() && Number(i.qty) > 0);
    if (!good.length || billTotal({ items: good, discount: Number(f.discount) || 0 }) <= 0) { toast("Add an item with an amount"); return; }
    const b: Bill = { id: Math.random().toString(36).slice(2, 10), no: nextBillNo(bills), date: today, patient: f.patient.trim().slice(0, 80), phone: f.phone.trim().slice(0, 15), items: good, discount: Number(f.discount) || 0, mode: f.mode, paid: 0, note: f.note.trim().slice(0, 120), at: Date.now() };
    b.paid = billTotal(b);
    put([b, ...bills]);
    setItems([blankItem()]); setF({ patient: "", phone: "", discount: "", mode: f.mode, note: "" }); setDay(today);
    toast(`Receipt ${b.no} saved`);
    if (print) onPrint(`Receipt ${b.no}`, billMarkdown(b, clinic));
  };
  const csv = () => {
    const url = URL.createObjectURL(new Blob([billsCsv(bills)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `receipts-${today}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <section className="cx-page cx-lab cx-bills">
      <header className="cx-page-h"><div><h1>Clinic Bills &amp; Receipts</h1><p>Receipts on your letterhead, numbered through the financial year, with the day's collection by cash, UPI and card. Kept on this device; export a CSV for your accountant.</p></div></header>
      <div className="cx-roster-in">
        <label className="cx-field"><span>Received from</span><input className="cx-input" value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} placeholder="Patient or payer's name" data-bill="patient" /></label>
        <label className="cx-field"><span>Phone (optional)</span><input className="cx-input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+ ]/g, "") })} placeholder="98xxxxxxxx" /></label>
      </div>
      <div className="cx-bill-items" data-bill="items">
        {items.map((it, i) => (
          <div key={i} className="cx-bill-item">
            <input className="cx-input" list="cx-bill-presets" value={it.text} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, text: e.target.value.slice(0, 80) } : x)))} aria-label={`Item ${i + 1}`} data-bill-item={i} />
            <input className="cx-input sm" inputMode="numeric" value={it.qty || ""} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, qty: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} aria-label="Quantity" placeholder="Qty" />
            <input className="cx-input sm" inputMode="decimal" value={it.rate || ""} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, rate: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 } : x)))} aria-label="Rate in rupees" placeholder="₹" data-bill-rate={i} />
            <button className="cx-ib" onClick={() => setItems(items.length > 1 ? items.filter((_, k) => k !== i) : [blankItem()])} aria-label="Remove item"><Trash2 size={14} /></button>
          </div>
        ))}
        <datalist id="cx-bill-presets">{BILL_PRESETS.map((p) => <option key={p} value={p} />)}</datalist>
        <button className="cx-btn" onClick={() => setItems([...items, { text: "", qty: 1, rate: 0 }])} data-bill="add-item"><Plus size={14} /> Add item</button>
      </div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Discount ₹</span><input className="cx-input" inputMode="decimal" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0" data-bill="discount" /></label>
        <div className="cx-seg" role="radiogroup" aria-label="Paid by">{MODES.map(([v, l]) => <button key={v} role="radio" aria-checked={f.mode === v} className={f.mode === v ? "on" : ""} onClick={() => setF({ ...f, mode: v })} data-bill-mode={v}>{l}</button>)}</div>
        <b className="cx-bill-total" data-bill="total">{rupees(total)}</b>
      </div>
      <div className="cx-sc-acts">
        <button className="cx-btn primary" onClick={() => save(true)} data-bill="save-print"><Printer size={14} /> Save and print · {nextBillNo(bills)}</button>
        <button className="cx-btn" onClick={() => save(false)} data-bill="save">Save</button>
      </div>
      <div className="cx-bill-day">
        <label className="cx-vax-dob"><span>Day</span><input className="cx-input" type="date" value={day} max={today} onChange={(e) => setDay(e.target.value || today)} aria-label="Day" /></label>
        <div className="cx-sim-stats" data-bill="summary">
          <div><b>{rupees(sum.total)}</b><small>{sum.count} receipt{sum.count === 1 ? "" : "s"}</small></div>
          <div><b>{rupees(sum.by.cash)}</b><small>cash</small></div>
          <div><b>{rupees(sum.by.upi + sum.by.card + sum.by.other)}</b><small>UPI, card and other</small></div>
        </div>
      </div>
      {ofDay.length > 0 ? (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-bill="list"><thead><tr><th>No.</th><th>From</th><th>Items</th><th>Total</th><th>Mode</th><th /></tr></thead>
          <tbody>{ofDay.map((b) => (
            <tr key={b.id} className={b.cancelled ? "cx-bill-x" : ""} data-bill-no={b.no}>
              <td>{b.no}</td><td>{b.patient || "–"}</td><td>{b.items.map((i) => i.text).join(", ")}</td><td>{rupees(billTotal(b))}</td><td>{b.cancelled ? "Cancelled" : b.mode.toUpperCase()}</td>
              <td className="cx-bill-acts"><button className="cx-ib" onClick={() => onPrint(`Receipt ${b.no}`, billMarkdown(b, clinic))} aria-label={`Print ${b.no}`}><Printer size={14} /></button>{!b.cancelled && <button className="cx-ib" onClick={() => { if (window.confirm(`Cancel receipt ${b.no}? It stays in the list, marked cancelled.`)) put(bills.map((x) => (x.id === b.id ? { ...x, cancelled: true } : x))); }} aria-label={`Cancel ${b.no}`}><Ban size={14} /></button>}</td>
            </tr>
          ))}</tbody></table></div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><ReceiptIndianRupee size={20} /></span><h3>No receipts this day</h3><p>Receipts you save appear here.</p></div>}
      {bills.length > 0 && <div className="cx-sc-acts"><button className="cx-btn" onClick={csv} data-bill="csv"><Download size={14} /> Export all receipts (CSV)</button></div>}
      <p className="cx-rs-foot"><ReceiptIndianRupee size={13} /> Receipts are kept only in this browser: export the CSV regularly as a backup. Ask your accountant about tax rules for your practice.</p>
    </section>
  );
}
