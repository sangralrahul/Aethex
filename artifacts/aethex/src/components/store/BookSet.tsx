/**
 * A year's (or a degree's) set of books: one standard textbook per subject
 * (lib/store/booksets.ts). Any subject can switch to another standard book or
 * be left out; the priced books go in the cart in one go, the rest can be
 * asked for together, and a college can put the whole set on its list.
 * Styles: src/shop.css (.ax-bset).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Layers, Library, MessageSquareText, ShoppingCart } from "lucide-react";
import { BookCover, shortAuthors } from "./BookCard";
import { EnquiryDialog } from "./EnquiryForm";
import { useToast } from "@/hooks/use-toast";
import type { BookStore } from "@/lib/store/api";
import { buyable, type BookSetPlan } from "@/lib/store/booksets";
import { bookName } from "@/lib/store/bookdata";
import { bulk } from "@/lib/store/bulk";
import { cart } from "@/lib/store/cart";
import { formatINR } from "@/lib/utils";

const defaults = (plan: BookSetPlan) => Object.fromEntries(plan.subjects.map((s) => [s.subject, s.options[0].id]));

export function BookSetPanel({ plan, bs }: { plan: BookSetPlan; bs: BookStore }) {
  const { toast } = useToast();
  const [picks, setPicks] = useState<Record<string, number>>(() => defaults(plan));
  const [left, setLeft] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  useEffect(() => { setPicks(defaults(plan)); setLeft([]); }, [plan]);
  // Opened from a link to the set (/books?…#set): bring it into view once it's there.
  useEffect(() => { if (window.location.hash === "#set") document.getElementById("set")?.scrollIntoView({ block: "start" }); }, [plan.group]);

  const chosen = useMemo(() => plan.subjects.map((s) => ({ s, b: s.options.find((o) => o.id === picks[s.subject]) ?? s.options[0] })), [plan, picks]);
  const included = chosen.filter((x) => !left.includes(x.s.subject));
  const toBuy = included.filter((x) => buyable(x.b));
  const toAsk = included.filter((x) => !buyable(x.b));
  const total = toBuy.reduce((n, x) => n + Number(x.b.price), 0);

  const addAll = () => {
    for (const x of toBuy) cart.add(x.b.id, null, 1);
    toast({ title: `Added ${toBuy.length} book${toBuy.length === 1 ? "" : "s"} to your cart`, description: toAsk.length ? `${toAsk.length} more ${toAsk.length === 1 ? "is" : "are"} priced on request: ask for ${toAsk.length === 1 ? "it" : "them"} below.` : plan.label });
  };
  const toList = () => {
    const r = bulk.addMany(included.map((x) => ({ productId: x.b.id, variantId: null, qty: 10 })));
    toast(r.full
      ? { variant: "destructive", title: "Your college list is full", description: "Send it for a quotation first, or remove something from it." }
      : { title: "The set is on your college list", description: "10 copies of each: change the numbers on the list before you send it." });
  };
  const askText = toAsk.map((x) => `${x.s.subject}: ${bookName(x.b)}, ${bs.publisherName(x.b.publisher)}`).join("\n");

  return (
    <section className="ax-bset" id="set" aria-labelledby="ax-bset-h">
      <div className="ax-bset-head">
        <span className="ic"><Layers size={20} /></span>
        <div>
          <h2 id="ax-bset-h">The {plan.label} set</h2>
          <p>One standard textbook for each subject. Switch any of them, or untick a subject you have.</p>
        </div>
      </div>
      <ul className="ax-bset-list">
        {chosen.map(({ s, b }) => {
          const off = left.includes(s.subject);
          const pub = bs.publisherName(b.publisher);
          return (
            <li key={s.subject} className={off ? "off" : ""}>
              <label className="ax-check" title={off ? `Add ${s.subject}` : `Leave out ${s.subject}`}>
                <input type="checkbox" checked={!off} onChange={() => setLeft((l) => (off ? l.filter((x) => x !== s.subject) : [...l, s.subject]))} aria-label={`Include ${s.subject}`} />
                <span className="box" />
              </label>
              <Link href={`/books/${b.slug}`} className="cv" tabIndex={-1} aria-hidden="true"><BookCover book={b} publisher={pub} size="mini" /></Link>
              <div className="tx">
                <small>{s.subject}</small>
                {s.options.length > 1 ? (
                  <select value={b.id} onChange={(e) => setPicks((p) => ({ ...p, [s.subject]: Number(e.target.value) }))} aria-label={`Book for ${s.subject}`}>
                    {s.options.map((o) => <option key={o.id} value={o.id}>{bookName(o)}{buyable(o) ? ` · ${formatINR(Number(o.price))}` : " · on request"}</option>)}
                  </select>
                ) : <Link href={`/books/${b.slug}`} className="nm">{bookName(b)}</Link>}
                <em>{[shortAuthors(b.authors), pub].filter(Boolean).join(" · ")}</em>
              </div>
              <b className={`pr${buyable(b) ? "" : " ask"}`}>{buyable(b) ? formatINR(Number(b.price)) : b.price !== null && !b.priceOnRequest ? "Out of stock" : "On request"}</b>
            </li>
          );
        })}
      </ul>
      <div className="ax-bset-foot">
        <button type="button" className="ax-btn teal" disabled={!toBuy.length} onClick={addAll}>
          <ShoppingCart size={17} /> {toBuy.length ? `Add ${toBuy.length} book${toBuy.length === 1 ? "" : "s"} to cart · ${formatINR(total)}` : "Nothing to add yet"}
        </button>
        {toAsk.length > 0 && <button type="button" className="ax-btn" onClick={() => setAsking(true)}><MessageSquareText size={17} /> Ask for {toAsk.length === 1 ? "1 price" : `${toAsk.length} prices`}</button>}
        <button type="button" className="ax-link" onClick={toList} disabled={!included.length}><Library size={15} /> For a library or a batch: put the set on your college list</button>
      </div>
      <EnquiryDialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Ask for the prices"
        kind="book"
        item={`${plan.label} set: ${toAsk.length} book${toAsk.length === 1 ? "" : "s"}`}
        itemLabel={`${plan.label}: ${toAsk.length} book${toAsk.length === 1 ? "" : "s"} priced on request`}
        defaultMessage={askText}
      />
    </section>
  );
}
