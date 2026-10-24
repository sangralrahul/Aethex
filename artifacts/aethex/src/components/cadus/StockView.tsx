/**
 * Pharmacy Stock & Expiry: the clinic's medicines and consumables with batch and expiry, stock
 * in and out, low-stock, near-expiry and expired alerts, a reorder list to print, and a CSV.
 */
import { useMemo, useState } from "react";
import { Download, Minus, PackagePlus, Plus, Printer, Search, Trash2, TriangleAlert, Warehouse } from "lucide-react";
import { moveStock, newStockItem, readStock, reorderList, saveStock, stockCsv, stockFlags, stockValue, type StockFlag, type StockItem, type StockState } from "@/lib/cadus/clinic25";
import { rupees } from "@/lib/cadus/clinic24";

const FLAG: Record<StockFlag, string> = { expired: "Expired", expiring: "Expires soon", out: "Out of stock", low: "Low" };
const FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler", "IV fluid", "Dressing", "Consumable", "Other"];

export default function StockView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [s, setS] = useState<StockState>(readStock);
  const [f, setF] = useState<StockItem>(() => newStockItem());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "alerts">("all");
  const [adj, setAdj] = useState<Record<string, string>>({});
  const put = (n: StockState) => { setS(n); saveStock(n); };
  const alerts = s.items.filter((i) => stockFlags(i).length);
  const shown = useMemo(() => { const t = q.trim().toLowerCase(); return [...s.items].filter((i) => (filter === "all" || stockFlags(i).length) && (!t || `${i.name} ${i.batch}`.toLowerCase().includes(t))).sort((a, b) => stockFlags(b).length - stockFlags(a).length || a.name.localeCompare(b.name)); }, [s, q, filter]);
  const reorder = reorderList(s);
  const add = () => {
    if (!f.name.trim()) return;
    put({ items: [...s.items, { ...f, name: f.name.trim().slice(0, 80) }], moves: s.moves });
    setF(newStockItem({ form: f.form, unit: f.unit }));
  };
  const change = (i: StockItem, sign: 1 | -1) => {
    const n = Math.abs(Number(adj[i.id]) || 0);
    if (!n) return;
    put(moveStock(s, i.id, sign * n, sign > 0 ? "Received" : "Dispensed"));
    setAdj({ ...adj, [i.id]: "" });
  };
  const csv = () => { const url = URL.createObjectURL(new Blob([stockCsv(s)], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "clinic-stock.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); };

  return (
    <section className="cx-page cx-lab cx-stock">
      <header className="cx-page-h"><div><h1>Pharmacy Stock &amp; Expiry</h1><p>Medicines and consumables in your clinic with batch and expiry: stock in and out, alerts for low stock and anything expiring in the next 90 days, and a reorder list.</p></div></header>
      <div className="cx-sim-stats" data-stock="stats">
        <div><b>{s.items.length}</b><small>items</small></div>
        <div><b>{alerts.length}</b><small>need attention</small></div>
        <div><b>{rupees(stockValue(s))}</b><small>stock value at MRP</small></div>
      </div>
      <form className="cx-rec-visit" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <div className="cx-c23-row">
          <label className="cx-field"><span>Name and strength</span><input className="cx-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Paracetamol 500 mg" data-stock="name" /></label>
          <label className="cx-field"><span>Form</span><select className="cx-select" value={f.form} onChange={(e) => setF({ ...f, form: e.target.value })}>{FORMS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="cx-field"><span>Batch</span><input className="cx-input" value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value.slice(0, 30) })} placeholder="B2401" /></label>
          <label className="cx-field"><span>Expiry</span><input className="cx-input" type="month" value={f.expiry} onChange={(e) => setF({ ...f, expiry: e.target.value })} data-stock="expiry" /></label>
        </div>
        <div className="cx-c23-row">
          <label className="cx-field"><span>Quantity</span><input className="cx-input" inputMode="numeric" value={f.qty || ""} onChange={(e) => setF({ ...f, qty: Number(e.target.value.replace(/\D/g, "")) || 0 })} placeholder="100" data-stock="qty" /></label>
          <label className="cx-field"><span>Unit</span><input className="cx-input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value.slice(0, 20) })} placeholder="tablets" /></label>
          <label className="cx-field"><span>Reorder when at</span><input className="cx-input" inputMode="numeric" value={f.reorder || ""} onChange={(e) => setF({ ...f, reorder: Number(e.target.value.replace(/\D/g, "")) || 0 })} placeholder="20" data-stock="reorder" /></label>
          <label className="cx-field"><span>MRP per unit ₹</span><input className="cx-input" inputMode="decimal" value={f.mrp || ""} onChange={(e) => setF({ ...f, mrp: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} placeholder="1.20" /></label>
        </div>
        <div className="cx-sc-acts"><button className="cx-btn primary" type="submit" data-stock="add"><PackagePlus size={14} /> Add to stock</button></div>
      </form>
      <div className="cx-c23-row">
        <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find" aria-label="Find in stock" /></label>
        <div className="cx-seg" role="radiogroup" aria-label="Show">{([["all", "All"], ["alerts", `Alerts (${alerts.length})`]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={filter === v} className={filter === v ? "on" : ""} onClick={() => setFilter(v)} data-stock-filter={v}>{l}</button>)}</div>
      </div>
      {shown.length ? (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-stock="list"><thead><tr><th>Item</th><th>Batch · expiry</th><th>Stock</th><th>Alert</th><th>In / out</th><th /></tr></thead>
          <tbody>{shown.map((i) => { const fl = stockFlags(i); return (
            <tr key={i.id} data-stock-item={i.name}>
              <td><b>{i.name}</b><small>{i.form}</small></td>
              <td>{i.batch || "–"}<small>{i.expiry || "no expiry"}</small></td>
              <td data-stock-qty>{i.qty} {i.unit}</td>
              <td>{fl.map((x) => <span key={x} className={`cx-stock-f f-${x}`}>{FLAG[x]}</span>)}</td>
              <td><span className="cx-stock-adj"><input className="cx-input sm" inputMode="numeric" value={adj[i.id] ?? ""} onChange={(e) => setAdj({ ...adj, [i.id]: e.target.value.replace(/\D/g, "") })} aria-label={`Quantity for ${i.name}`} placeholder="0" /><button className="cx-ib" onClick={() => change(i, 1)} aria-label={`Add stock of ${i.name}`}><Plus size={14} /></button><button className="cx-ib" onClick={() => change(i, -1)} aria-label={`Dispense ${i.name}`}><Minus size={14} /></button></span></td>
              <td><button className="cx-ib" onClick={() => { if (window.confirm(`Remove ${i.name} from the list?`)) put({ ...s, items: s.items.filter((x) => x.id !== i.id) }); }} aria-label={`Remove ${i.name}`}><Trash2 size={13} /></button></td>
            </tr>
          ); })}</tbody></table></div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Warehouse size={20} /></span><h3>{s.items.length ? "Nothing to show" : "No stock yet"}</h3><p>Add the medicines and consumables you keep.</p></div>}
      <div className="cx-sc-acts">
        {reorder.length > 0 && <button className="cx-btn" onClick={() => onPrint("Reorder list", `# Reorder list\n\n| Item | Form | In stock | Order about |\n|---|---|---|---|\n${reorder.map((i) => `| ${i.name} | ${i.form} | ${i.qty} ${i.unit} | ${i.suggest} ${i.unit} |`).join("\n")}`)} data-stock="reorder-list"><Printer size={14} /> Reorder list ({reorder.length})</button>}
        {s.items.length > 0 && <button className="cx-btn" onClick={csv}><Download size={14} /> CSV</button>}
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Kept in this browser only: export the CSV as a backup. Remove expired stock from use and dispose of it as per biomedical waste rules.</p>
    </section>
  );
}
