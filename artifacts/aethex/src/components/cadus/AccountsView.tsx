/**
 * Clinic Accounts: the month's takings from Clinic Bills & Receipts against expenses entered here
 * (rent, salaries, medicines and the rest), the net, the biggest costs, and a CSV for the
 * accountant. On this device.
 */
import { useMemo, useState } from "react";
import { Download, Plus, Trash2, Wallet } from "lucide-react";
import { rupees } from "@/lib/cadus/clinic24";
import { EXPENSE_HEADS, expensesCsv, monthAccounts, newExpense, readExpenses, saveExpenses, ymd, type Expense } from "@/lib/cadus/clinic25";

export default function AccountsView() {
  const [ex, setEx] = useState<Expense[]>(readExpenses);
  const [month, setMonth] = useState(ymd(new Date()).slice(0, 7));
  const [f, setF] = useState<Expense>(() => newExpense());
  const put = (l: Expense[]) => { setEx(l); saveExpenses(l); };
  const acc = useMemo(() => monthAccounts(month, ex), [month, ex]);
  const rows = ex.filter((e) => e.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const csv = () => { const url = URL.createObjectURL(new Blob([expensesCsv(ex)], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "clinic-expenses.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); };
  const max = Math.max(1, ...acc.byHead.map((h) => h.amount));

  return (
    <section className="cx-page cx-lab cx-acc">
      <header className="cx-page-h"><div><h1>Clinic Accounts</h1><p>What came in (from your receipts) and what went out (expenses you add here) each month, the net, and where the money goes. Kept on this device.</p></div></header>
      <label className="cx-vax-dob"><span>Month</span><input className="cx-input" type="month" value={month} onChange={(e) => setMonth(e.target.value || ymd(new Date()).slice(0, 7))} aria-label="Month" data-acc="month" /></label>
      <div className="cx-sim-stats" data-acc="summary">
        <div><b data-acc="income">{rupees(acc.income)}</b><small>in · {acc.receipts} receipts{acc.perPatient ? ` · ${rupees(acc.perPatient)} each` : ""}</small></div>
        <div><b data-acc="spent">{rupees(acc.spent)}</b><small>expenses</small></div>
        <div><b data-acc="net" className={acc.net < 0 ? "cx-acc-neg" : ""}>{rupees(acc.net)}</b><small>net</small></div>
      </div>
      {acc.byHead.length > 0 && <div className="cx-acc-bars" data-acc="heads">{acc.byHead.map((h) => <div key={h.head}><span>{h.head}</span><i style={{ width: `${(h.amount / max) * 100}%` }} /><b>{rupees(h.amount)}</b></div>)}</div>}
      <form className="cx-opd-add" onSubmit={(e) => { e.preventDefault(); if (!(f.amount > 0)) return; put([...ex, f]); setF(newExpense({ head: f.head, mode: f.mode, date: f.date })); }}>
        <input className="cx-input sm" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
        <select className="cx-select" value={f.head} onChange={(e) => setF({ ...f, head: e.target.value })} aria-label="Expense head" data-acc="head">{EXPENSE_HEADS.map((h) => <option key={h}>{h}</option>)}</select>
        <input className="cx-input sm" inputMode="decimal" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} placeholder="₹" aria-label="Amount" data-acc="amount" />
        <select className="cx-select sm" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as Expense["mode"] })} aria-label="Paid by"><option value="bank">Bank</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option></select>
        <input className="cx-input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value.slice(0, 120) })} placeholder="Note" aria-label="Note" />
        <button className="cx-btn primary" type="submit" data-acc="add"><Plus size={14} /> Add expense</button>
      </form>
      {rows.length ? (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-acc="list"><thead><tr><th>Date</th><th>Head</th><th>Amount</th><th>Paid by</th><th>Note</th><th /></tr></thead>
          <tbody>{rows.map((e) => <tr key={e.id}><td>{e.date}</td><td>{e.head}</td><td>{rupees(e.amount)}</td><td>{e.mode.toUpperCase()}</td><td>{e.note}</td><td><button className="cx-ib" onClick={() => put(ex.filter((x) => x.id !== e.id))} aria-label="Delete this expense"><Trash2 size={13} /></button></td></tr>)}</tbody></table></div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Wallet size={20} /></span><h3>No expenses this month</h3><p>Add rent, salaries, medicines and other costs to see the net.</p></div>}
      {ex.length > 0 && <div className="cx-sc-acts"><button className="cx-btn" onClick={csv}><Download size={14} /> Expenses CSV</button></div>}
      <p className="cx-rs-foot"><Wallet size={13} /> Income comes from Clinic Bills &amp; Receipts on this device. For tax and filing, export both CSVs for your accountant.</p>
    </section>
  );
}
