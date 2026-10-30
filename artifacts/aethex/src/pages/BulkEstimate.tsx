/**
 * Update 78: a printable estimate for a purchase committee (/bulk-estimate), saved as a PDF from the browser's print.
 * ?segment=hospital|college: the bulk list now in this browser, with an institution name typed on the page.
 * ?request=ID: a quotation request already sent (the signed-in account's), with its details.
 * It is an estimate at the store's prices, not Aethex's quotation (that is emailed), and says so.
 * Styles: src/shop.css (.ax-inv, shared with the store invoice).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { Logo } from "@/components/layout/Navbar";
import { inWords } from "@/pages/Invoice";
import { myQuotes, type MyQuote } from "@/lib/store/api";
import { usePricedBulk } from "@/lib/store/bulk";
import { useBudget } from "@/lib/store/bulkExtras";
import { isBookId } from "@/lib/store/bookdata";
import type { BulkItem, Segment } from "@/lib/store/types";
import { SEGMENT_PAGES } from "@/config/institutions";
import { BUSINESS } from "@/config/business";

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BulkEstimate() {
  const qs = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const requestId = qs.get("request") ?? "";
  const segment: Segment = qs.get("segment") === "college" ? "college" : "hospital";
  useSeo({ title: "Purchase estimate | Aethex", description: "An estimate of your list at Aethex's prices.", path: "/bulk-estimate" });
  const { priced, store } = usePricedBulk();
  const budget = useBudget(segment);
  const [req, setReq] = useState<MyQuote | null>(null), [err, setErr] = useState("");
  const [inst, setInst] = useState(() => { try { return localStorage.getItem("aethex:bulk:inst") ?? ""; } catch { return ""; } });
  useEffect(() => { try { localStorage.setItem("aethex:bulk:inst", inst); } catch { /* blocked */ } }, [inst]);
  useEffect(() => {
    if (!requestId) return;
    myQuotes().then((r) => { const x = r.requests.find((y) => y.id === requestId); if (x) setReq(x); else setErr("We couldn't find that request in your account."); }).catch((e) => setErr((e as Error).message));
  }, [requestId]);
  const seg = req?.segment ?? segment;
  const items: BulkItem[] = req ? req.items : priced.items;
  const secs = SEGMENT_PAGES[seg].sections;
  const rows = useMemo(() => items.map((i) => {
    const cat = store?.byId.get(i.productId)?.category ?? "";
    const dept = secs.find((s) => s.categories.includes(cat))?.short ?? (isBookId(i.productId) ? "Textbooks" : "Other");
    const brand = isBookId(i.productId) ? "" : store?.brandName(i.brand) ?? "";
    return { ...i, dept, label: `${brand ? `${brand} ` : ""}${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""}`, total: i.unitPrice === null ? null : i.unitPrice * i.qty };
  }).sort((a, b) => a.dept.localeCompare(b.dept)), [items, store, secs]);
  const total = rows.reduce((s, r) => s + (r.total ?? 0), 0);
  const unpriced = rows.filter((r) => r.total === null).length;
  const units = rows.reduce((s, r) => s + r.qty, 0);
  const back = req ? "/account/quotations" : `${SEGMENT_PAGES[seg].path}#list`;

  if (requestId && !req && !err) return <div className="ax-inv-page"><div className="ax-wrap"><p className="ax-orders-loading"><Loader2 size={20} className="spin" /> Preparing…</p></div></div>;
  if (err) return <div className="ax-inv-page"><div className="ax-wrap ax-empty"><h2>Estimate not available</h2><p>{err} Open it from <Link href="/account/quotations">My quotations</Link> while signed in.</p></div></div>;
  if (!rows.length) return <div className="ax-inv-page"><div className="ax-wrap ax-empty"><h2>Your list is empty</h2><p>Add products to your bulk list first.</p><Link href={SEGMENT_PAGES[segment].path} className="ax-btn teal">Back to the catalogue</Link></div></div>;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="ax-inv-page" data-bulk="estimate-page">
      <div className="ax-wrap ax-inv-bar noprint">
        <Link href={back} className="ax-link"><ArrowLeft size={15} /> Back</Link>
        {!req && <label className="ax-est-inst">For <input value={inst} onChange={(e) => setInst(e.target.value)} placeholder={seg === "hospital" ? "Hospital name" : "College name"} maxLength={120} aria-label="Institution name" /></label>}
        <button type="button" className="ax-btn teal" onClick={() => window.print()}><Download size={16} /> Download PDF</button>
      </div>
      <article className="ax-inv" aria-label="Purchase estimate">
        <header>
          <div className="seller"><Logo /><b>{BUSINESS.legalName}</b>{BUSINESS.address && <span>{BUSINESS.address}</span>}<span>{BUSINESS.email}{BUSINESS.phone ? ` · ${BUSINESS.phone}` : ""}</span></div>
          <div className="meta">
            <h1 data-bulk="est-title">{req ? "Quotation request" : "Purchase estimate"}</h1>
            <dl>
              {req && <div><dt>Reference</dt><dd>{req.id}</dd></div>}
              <div><dt>Date</dt><dd>{req ? new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : today}</dd></div>
              <div><dt>Items</dt><dd>{rows.length} · {units.toLocaleString("en-IN")} units</dd></div>
              {req?.needBy && <div><dt>Needed by</dt><dd>{req.needBy}</dd></div>}
            </dl>
          </div>
        </header>
        <section className="parties">
          <div><small>Prepared for</small>
            <b data-bulk="est-inst">{req?.institution || inst || (seg === "hospital" ? "Your hospital" : "Your college")}</b>
            {req && <><span>{req.contactName}{req.designation ? `, ${req.designation}` : ""}</span>{req.gstin && <span>GSTIN {req.gstin}</span>}<span>{req.city}, {req.state} {req.pincode}</span><span>{req.email} · {req.phone}</span></>}
          </div>
          {!req && budget > 0 && <div><small>Budget</small><b>₹{money(budget)}</b><span>{total > budget ? `₹${money(total - budget)} over` : `₹${money(budget - total)} within budget`}</span></div>}
        </section>
        <table>
          <thead><tr><th>#</th><th>Department</th><th>Item</th><th className="n">Qty</th><th className="n">Unit price</th><th className="n">Amount</th></tr></thead>
          <tbody>{rows.map((r, k) => <tr key={`${r.productId}:${r.variantId ?? ""}`}><td>{k + 1}</td><td>{r.dept}</td><td>{r.label}</td><td className="n">{r.qty.toLocaleString("en-IN")}</td><td className="n">{r.unitPrice === null ? "On request" : money(r.unitPrice)}</td><td className="n">{r.total === null ? "On request" : money(r.total)}</td></tr>)}</tbody>
        </table>
        <section className="totals">
          <dl>
            <div className="grand"><dt>Estimated total</dt><dd data-bulk="est-total">₹{money(total)}</dd></div>
            {unpriced > 0 && <div><dt>Priced on request</dt><dd>{unpriced} item{unpriced === 1 ? "" : "s"}</dd></div>}
          </dl>
          <p className="words">{inWords(total)}</p>
        </section>
        <footer>
          <p data-bulk="est-note"><b>This is an estimate at Aethex's listed prices (including GST), not a quotation.</b> Prices for these quantities, delivery and taxes are confirmed in Aethex's quotation, sent by email{req ? " for this request" : " when you request one"}.</p>
          <p>Questions? Write to {BUSINESS.email}{req ? ` quoting ${req.id}` : ""}.</p>
        </footer>
      </article>
    </div>
  );
}
