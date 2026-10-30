/**
 * Update 76: an order's invoice (/orders/:id/invoice), to print or save as a PDF.
 * It is a GST tax invoice only when the store has its GSTIN (src/config/business.ts) and an HSN code and GST rate
 * for every item's category (set in the store admin, under Tax). Prices include GST, so the taxable value is worked
 * back from each line; a coupon is shared across the lines and delivery is taxed at the main item's rate. Same state
 * as the seller: CGST and SGST; another state: IGST. Otherwise it is an order receipt and says it isn't a tax
 * invoice. A business buyer's name and GSTIN appear on both. Styles: src/shop.css (.ax-inv).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { getOrder, myOrders, tokenFor, useStore, useTax, type CustomerOrder } from "@/lib/store/api";
import { isBookId } from "@/lib/store/bookdata";
import { STATUS_LABEL } from "@/lib/store/rules";
import { BUSINESS } from "@/config/business";
import { Logo } from "@/components/layout/Navbar";

/** GST state codes (the first two digits of a GSTIN). */
const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh",
  "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh",
};
const r2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Rupees in words, Indian style ("One lakh twenty thousand ... rupees and fifty paise only"). */
export function inWords(amount: number): string {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const two = (n: number) => (n < 20 ? ones[n]! : `${tens[Math.floor(n / 10)]}${n % 10 ? `-${ones[n % 10]}` : ""}`);
  const three = (n: number) => `${n >= 100 ? `${ones[Math.floor(n / 100)]} hundred${n % 100 ? " " : ""}` : ""}${n % 100 ? two(n % 100) : ""}`;
  const words = (n: number): string => {
    if (n === 0) return "zero";
    const parts: string[] = [];
    const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
    if (crore) parts.push(`${words(crore)} crore`);
    if (lakh) parts.push(`${two(lakh)} lakh`);
    if (thousand) parts.push(`${two(thousand)} thousand`);
    if (rest) parts.push(three(rest));
    return parts.join(" ");
  };
  const rupees = Math.floor(amount + 1e-9), paise = Math.round((amount - rupees) * 100);
  const s = `${words(rupees)} rupee${rupees === 1 ? "" : "s"}${paise ? ` and ${two(paise)} paise` : ""} only`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Invoice() {
  const { id = "" } = useParams<{ id: string }>();
  useSeo({ title: `Invoice for order ${id} | Aethex Store`, description: "Your order invoice.", path: `/orders/${id}/invoice` });
  const { isLoggedIn } = useUserAuth();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        let o: CustomerOrder | undefined;
        if (isLoggedIn) o = (await myOrders().catch(() => ({ orders: [] as CustomerOrder[] }))).orders.find((x) => x.id === id);
        if (!o) o = (await getOrder(id, tokenFor(id))).order;
        if (live) setOrder(o);
      } catch (e) { if (live) setErr((e as Error).message); }
    })();
    return () => { live = false; };
  }, [id, isLoggedIn]);
  const { data: store } = useStore(!!order, { books: true });
  const { data: tax } = useTax(!!order);

  const inv = useMemo(() => {
    if (!order || !store || !tax) return null;
    const sellerGstin = BUSINESS.gstin || tax.sellerGstin;
    const catOf = (pid: number) => (isBookId(pid) ? "books" : store.byId.get(pid)?.category ?? "");
    const rated = order.lines.map((l) => ({ l, cat: catOf(l.productId), t: tax.rates[catOf(l.productId)] }));
    const isTax = !!sellerGstin && rated.every((x) => !!x.t);
    const sellerState = sellerGstin ? STATE_CODES[sellerGstin.slice(0, 2)] ?? "" : "";
    const intra = !!sellerState && sellerState === order.address.state;
    const gross = order.lines.reduce((s, l) => s + l.lineTotal, 0) || 1;
    const discount = order.discount ?? 0;
    const rows = rated.map(({ l, t }) => {
      const value = r2(l.lineTotal - (discount * l.lineTotal) / gross);
      const rate = t?.rate ?? 0;
      const taxable = isTax ? r2(value / (1 + rate / 100)) : value;
      return { key: `${l.productId}:${l.variantId ?? ""}`, name: `${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""}`, hsn: t?.hsn ?? "", qty: l.qty, unit: l.price, rate, value, taxable, gst: r2(value - taxable) };
    });
    if (order.delivery) {
      const main = [...rows].sort((a, b) => b.value - a.value)[0];
      const rate = isTax ? main?.rate ?? 0 : 0;
      const taxable = isTax ? r2(order.delivery / (1 + rate / 100)) : order.delivery;
      rows.push({ key: "delivery", name: "Delivery charge", hsn: isTax ? "996812" : "", qty: 1, unit: order.delivery, rate, value: order.delivery, taxable, gst: r2(order.delivery - taxable) });
    }
    const taxable = r2(rows.reduce((s, r) => s + r.taxable, 0));
    const gst = r2(rows.reduce((s, r) => s + r.gst, 0));
    return { isTax, sellerGstin, sellerState, intra, rows, taxable, gst };
  }, [order, store, tax]);

  if (err) return <div className="ax-wrap ax-inv-page"><div className="ax-empty"><h2>Invoice not available</h2><p>{err} Open it from <Link href="/orders">My orders</Link> in the browser or account you ordered with.</p></div></div>;
  if (!order || !inv) return <div className="ax-wrap ax-inv-page"><p className="ax-orders-loading"><Loader2 size={20} className="spin" /> Preparing the invoice…</p></div>;
  const a = order.address;
  const title = inv.isTax ? "Tax invoice" : "Order receipt";
  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="ax-inv-page" data-store="invoice">
      <div className="ax-wrap ax-inv-bar noprint">
        <Link href="/orders" className="ax-link"><ArrowLeft size={15} /> My orders</Link>
        <button type="button" className="ax-btn teal" onClick={() => window.print()} data-store="print"><Download size={16} /> Download PDF</button>
      </div>
      <article className="ax-inv" aria-label={title}>
        <header>
          <div className="seller">
            <Logo />
            <b>{BUSINESS.legalName}</b>
            {BUSINESS.address && <span>{BUSINESS.address}</span>}
            {inv.sellerGstin && <span>GSTIN {inv.sellerGstin}{inv.sellerState ? ` · ${inv.sellerState}` : ""}</span>}
            {BUSINESS.cin && <span>CIN {BUSINESS.cin}</span>}
            <span>{BUSINESS.email}{BUSINESS.phone ? ` · ${BUSINESS.phone}` : ""}</span>
          </div>
          <div className="meta">
            <h1 data-store="inv-title">{title}</h1>
            <dl>
              <div><dt>{inv.isTax ? "Invoice no." : "Order no."}</dt><dd>{order.id}</dd></div>
              <div><dt>Order date</dt><dd>{placed}</dd></div>
              <div><dt>Status</dt><dd>{STATUS_LABEL[order.status]}</dd></div>
              <div><dt>Payment</dt><dd>{order.payment === "cod" ? "Cash on delivery" : order.payment === "bank" ? "Bank transfer" : "Online"}{order.paymentStatus === "paid" ? " (paid)" : ""}</dd></div>
            </dl>
          </div>
        </header>
        <section className="parties">
          <div><small>Bill to</small>
            {order.business ? <><b>{order.business.name}</b>{order.business.gstin && <span data-store="buyer-gstin">GSTIN {order.business.gstin}</span>}<span>Attn: {a.name}</span></> : <b>{a.name}</b>}
            {a.line1 && <span>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</span>}
            <span>{a.city}, {a.state} {a.pincode}</span>
            <span>{a.phone}</span>
          </div>
          <div><small>Ship to</small><b>{a.name}</b>{a.line1 && <span>{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.landmark ? `, near ${a.landmark}` : ""}</span>}<span>{a.city}, {a.state} {a.pincode}</span></div>
          {inv.isTax && <div><small>Place of supply</small><b>{a.state}</b><span>{inv.intra ? "Within the state: CGST + SGST" : "Another state: IGST"}</span></div>}
        </section>
        <table>
          <thead><tr><th>#</th><th>Item</th>{inv.isTax && <th>HSN</th>}<th className="n">Qty</th><th className="n">Rate</th>{inv.isTax && <><th className="n">Taxable value</th><th className="n">GST</th>{inv.intra ? <><th className="n">CGST</th><th className="n">SGST</th></> : <th className="n">IGST</th>}</>}<th className="n">Amount</th></tr></thead>
          <tbody>{inv.rows.map((r, i) => (
            <tr key={r.key}><td>{i + 1}</td><td>{r.name}</td>{inv.isTax && <td>{r.hsn}</td>}<td className="n">{r.qty}</td><td className="n">{money(r.unit)}</td>
              {inv.isTax && <><td className="n">{money(r.taxable)}</td><td className="n">{r.rate}%</td>{inv.intra ? <><td className="n">{money(r2(r.gst / 2))}</td><td className="n">{money(r2(r.gst - r2(r.gst / 2)))}</td></> : <td className="n">{money(r.gst)}</td>}</>}
              <td className="n">{money(r.value)}</td></tr>
          ))}</tbody>
        </table>
        <section className="totals">
          <dl>
            <div><dt>Items</dt><dd>₹{money(order.subtotal)}</dd></div>
            {!!order.discount && <div><dt>Coupon{order.coupon ? ` ${order.coupon}` : ""}</dt><dd>− ₹{money(order.discount)}</dd></div>}
            <div><dt>Delivery</dt><dd>{order.delivery ? `₹${money(order.delivery)}` : "Free"}</dd></div>
            {inv.isTax && <><div><dt>Taxable value</dt><dd>₹{money(inv.taxable)}</dd></div><div><dt>{inv.intra ? "CGST + SGST" : "IGST"}</dt><dd>₹{money(inv.gst)}</dd></div></>}
            <div className="grand"><dt>Total</dt><dd>₹{money(order.total)}</dd></div>
            {order.refund && <div><dt>Refunded</dt><dd>₹{money(order.refund.amount)}</dd></div>}
          </dl>
          <p className="words">{inWords(order.total)}</p>
        </section>
        <footer>
          {inv.isTax
            ? <p>Prices include GST. This is a computer-generated invoice and needs no signature.{order.status === "cancelled" ? " This order was cancelled." : ""}</p>
            : <p data-store="not-tax">This is a receipt for your order, not a GST tax invoice. Prices include GST where it applies.{order.business ? " Your business name and GSTIN are shown as you gave them." : ""}{order.status === "cancelled" ? " This order was cancelled." : ""}</p>}
          <p>Questions? Write to {BUSINESS.email} with your order number.</p>
        </footer>
      </article>
    </div>
  );
}
