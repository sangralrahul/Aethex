/**
 * Quotation requests (/account/quotations), for hospitals and medical
 * colleges: the requests sent while signed in, or with the account's email,
 * with where each one is (received, quotation sent, ordered, closed), the
 * store's note, the list and schedule, and "Send this list again", which puts
 * the items back on the bulk list of /hospitals or /medical-colleges. Orders
 * are under My orders. Data: GET /api/store/my-quotes (worker/store.ts).
 * Styles: src/shop.css (.ax-myq).
 */
import { EstimateLink } from "@/components/store/BulkExtras";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Building2, ChevronDown, ClipboardList, FileText, GraduationCap, Inbox, Loader2, Package, PackageCheck, RotateCcw } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/use-user-auth";
import { myQuotes, useStore, type MyQuote } from "@/lib/store/api";
import { bulk } from "@/lib/store/bulk";
import { isBookId, itemHref } from "@/lib/store/bookdata";
import { formatDay, scheduleText } from "@/lib/store/rules";
import type { BulkStatus } from "@/lib/store/types";
import { loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";

const STAGE: Record<BulkStatus, { label: string; text: string }> = {
  new: { label: "Received", text: "We're preparing your quotation, usually within one business day." },
  quoted: { label: "Quotation sent", text: "We've sent the quotation to your email. Reply to it to order, or to ask for changes." },
  ordered: { label: "Ordered", text: "This quotation became an order." },
  closed: { label: "Closed", text: "This request is closed." },
};

/** Where a request is, as steps (a closed request shows its words only). */
const QSTEPS = [
  { key: "new", label: "Received", icon: Inbox },
  { key: "quoted", label: "Quotation sent", icon: FileText },
  { key: "ordered", label: "Ordered", icon: PackageCheck },
] as const;

export default function MyQuotes() {
  useSeo({ title: "Quotation requests | Aethex", description: "Your hospital or college quotation requests.", path: "/account/quotations" });
  const { isLoggedIn } = useUserAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [list, setList] = useState<MyQuote[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const needsBooks = !!list?.some((r) => r.items.some((i) => isBookId(i.productId)));
  const { data: store } = useStore(!!list?.length, { books: needsBooks });

  useEffect(() => {
    if (!isLoggedIn) return;
    let live = true;
    myQuotes().then((r) => { if (!live) return; setList(r.requests); if (r.requests.length === 1) setOpen(r.requests[0].id); })
      .catch((e) => { if (live) { setErr((e as Error).message); setList([]); } });
    return () => { live = false; };
  }, [isLoggedIn]);

  const again = (r: MyQuote) => {
    const res = bulk.addMany(r.items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, qty: i.qty })));
    if (!res.added) { toast({ variant: "destructive", title: "Your bulk list is full", description: "Send it, or remove something from it, first." }); return; }
    toast({ title: "The list is on your bulk list", description: res.full ? "Some items didn't fit: the list is full." : "Check the quantities, then send it for a new quotation." });
    setLocation(`${r.segment === "college" ? "/medical-colleges" : "/hospitals"}#list`);
  };
  const brand = (slug: string) => store?.brandName(slug) ?? slug;

  return (
    <div className="ax-cart-page">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Account", href: "/account" }, { label: "Quotation requests" }]} title="Quotation requests"
        sub={list?.length ? `${list.length} request${list.length === 1 ? "" : "s"}` : undefined}
        right={<Link href="/orders" className="ax-btn"><Package size={16} /> My orders</Link>} />
      <div className="ax-wrap ax-myq">
        {!isLoggedIn ? (
          <div className="ax-empty">
            <span className="ic"><ClipboardList size={26} /></span>
            <h2>Your hospital or college quotations</h2>
            <p>Sign in with the email you sent your requests from, to see each one, where it is, and send a list again.</p>
            <div className="acts"><a className="ax-btn teal" href={loginUrl("/", { next: "/account/quotations" })}>Sign in</a><Link href="/institutions" className="ax-btn">For institutions</Link></div>
          </div>
        ) : list === null ? (
          <div className="ax-orders-loading"><Loader2 size={22} className="spin" /> Loading…</div>
        ) : !list.length ? (
          <div className="ax-empty">
            <span className="ic"><ClipboardList size={26} /></span>
            <h2>No quotation requests yet</h2>
            <p>{err || "Requests you send from the hospital or medical college pages, while signed in or with this account's email, appear here."}</p>
            <div className="acts"><Link href="/hospitals" className="ax-btn teal"><Building2 size={16} /> For hospitals</Link><Link href="/medical-colleges" className="ax-btn"><GraduationCap size={16} /> For medical colleges</Link></div>
          </div>
        ) : (
          <ul className="ax-orders-list">
            {list.map((r) => {
              const st = STAGE[r.status];
              const isOpen = open === r.id;
              return (
                <li key={r.id} className={isOpen ? "open" : ""}>
                  <button type="button" className="ax-orders-row ax-myq-row" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>
                    <span className="ic">{r.segment === "college" ? <GraduationCap size={18} /> : <Building2 size={18} />}</span>
                    <span className="tx"><b>{r.id}</b><small>{r.institution} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></span>
                    <span className={`ax-ov-status b-${r.status}`}>{st.label}</span>
                    <b className="tot">{r.units ? `${r.units.toLocaleString("en-IN")} units` : "In your notes"}</b>
                    <ChevronDown size={18} className="chev" />
                  </button>
                  {isOpen && (
                    <div className="ax-myq-body">
                      {r.status !== "closed" && (
                        <ol className="ax-ov-steps three ax-myq-steps" aria-label="Where the request is">
                          {QSTEPS.map((s, i) => {
                            const at = QSTEPS.findIndex((x) => x.key === r.status);
                            return (
                              <li key={s.key} className={`${i <= at ? "done" : ""}${i === at ? " now" : ""}`} aria-current={i === at ? "step" : undefined} style={{ ["--i" as string]: i }}>
                                <span className="ic"><s.icon size={16} /></span><b>{s.label}</b>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                      <p className="stage">{st.text}</p>
                      {r.customerNote && <p className="note"><b>From Aethex</b>{r.customerNote}</p>}
                      {r.items.length > 0 ? (
                        <ul className="items">
                          {r.items.map((i) => (
                            <li key={`${i.productId}:${i.variantId ?? ""}`}>
                              <span className="q">{i.qty.toLocaleString("en-IN")} ×</span>
                              <Link href={itemHref(i.productId, i.slug)}>{isBookId(i.productId) ? i.name : `${brand(i.brand)} ${i.name}`}</Link>{i.variantLabel ? <em> ({i.variantLabel})</em> : null}
                              <span className="muted">{i.unitPrice === null ? "price on request" : `${formatINR(i.unitPrice)} each at store prices`}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="muted">No products picked from the site: the request is in your notes.</p>}
                      <dl>
                        <div><dt>Deliver to</dt><dd>{r.address ? `${r.address}, ` : ""}{r.city}, {r.state} {r.pincode}</dd></div>
                        {(r.schedule || r.needBy) && <div><dt>Delivery</dt><dd>{r.schedule ? `${scheduleText(r.schedule)}${r.needBy ? `, the first by ${formatDay(r.needBy)}` : ""}` : `Needed by ${formatDay(r.needBy!)}`}</dd></div>}
                        {r.estTotal > 0 && <div><dt>At store prices</dt><dd>{formatINR(r.estTotal)}{r.unpriced ? ` + ${r.unpriced} on request` : ""} (your quotation has the price for these quantities)</dd></div>}
                        {r.notes && <div><dt>Your notes</dt><dd>{r.notes}</dd></div>}
                        <div><dt>Contact</dt><dd>{r.contactName}{r.designation ? `, ${r.designation}` : ""} · {r.phone} · {r.email}</dd></div>
                      </dl>
                      {r.items.length > 0 && <button type="button" className="ax-btn teal" onClick={() => again(r)}><RotateCcw size={16} /> Send this list again</button>}
                      <EstimateLink segment={r.segment} request={r.id} />
                      {(r.status === "quoted" || r.status === "ordered") && <Link href={`/purchase-order/${r.id}`} className="ax-btn" data-bulk="po-link"><FileText size={16} /> {(r as { po?: string }).po ? `Purchase order ${(r as { po?: string }).po}` : "Make a purchase order"}</Link>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
