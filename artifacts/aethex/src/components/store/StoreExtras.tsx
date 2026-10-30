/**
 * Update 76: more of the store.
 * - RecentlyViewed: the products this browser looked at (src/lib/store/recent.ts).
 * - TogetherBundle: "Frequently bought together" the way big stores show it: this item plus the ones bought with it
 *   (from real orders), ticked, with the total and one button. With no orders yet it offers items that go with it
 *   from the catalogue (same brand, another kind), and says so.
 * - ProductQA: questions customers asked, answered by the store, with a search and a form to ask.
 * Styles: src/shop.css (.ax-recent, .ax-fbt, .ax-qa).
 */
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Check, Clock3, Loader2, MessageCircleQuestion, Plus, Search, ShoppingCart, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/use-user-auth";
import { askQuestion, useQuestions, useStore, type StoreError } from "@/lib/store/api";
import { cart } from "@/lib/store/cart";
import { recent, useRecent } from "@/lib/store/recent";
import { itemHref } from "@/lib/store/bookdata";
import type { ProductSummary } from "@/lib/store/types";
import { loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";

/* ---------------------------------------------------------------- recently viewed */
export function RecentlyViewed({ exclude, title = "Recently viewed", max = 10 }: { exclude?: number; title?: string; max?: number }) {
  const ids = useRecent();
  const { data: store } = useStore(ids.length > 0, { books: true });
  const items = useMemo(() => (store ? ids.filter((id) => id !== exclude).map((id) => store.byId.get(id)).filter((x): x is ProductSummary => !!x).slice(0, max) : []), [ids, store, exclude, max]);
  if (!items.length || !store) return null;
  return (
    <section className="ax-again ax-recent" aria-label={title} data-store="recent">
      <div className="ax-h-title"><h2><Clock3 size={18} /> {title}</h2><button type="button" className="ax-link" onClick={() => recent.clear()}>Clear</button></div>
      <div className="ax-h-rail">{items.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- frequently bought together */
const buyable = (p: ProductSummary) => p.inStock && !p.priceOnRequest && (p.variants?.length ?? 0) <= 1 && Number(p.price) > 0;

export function TogetherBundle({ product, fromOrders }: { product: ProductSummary; fromOrders: ProductSummary[] }) {
  const { data: store } = useStore(true);
  const { toast } = useToast();
  const fallback = useMemo(() => {
    if (fromOrders.length || !store) return [];
    // From the catalogue: the same brand's other kinds of products first, then the same kind from other brands.
    const others = store.products.filter((p) => p.id !== product.id && buyable(p));
    const sameBrand = others.filter((p) => p.brand === product.brand && p.category !== product.category);
    const sameSub = others.filter((p) => p.category === product.category && p.subcategory !== product.subcategory && p.brand === product.brand);
    return [...sameBrand, ...sameSub].slice(0, 2);
  }, [fromOrders.length, store, product]);
  const picks = (fromOrders.length ? fromOrders.filter(buyable) : fallback).slice(0, 2);
  const all = [product, ...picks];
  const [off, setOff] = useState<number[]>([]);
  if (!picks.length || !buyable(product)) return null;
  const on = all.filter((p) => !off.includes(p.id));
  const total = on.reduce((s, p) => s + Number(p.price), 0);
  const mrp = on.reduce((s, p) => s + Number(p.mrp || p.price), 0);
  const add = () => {
    const n = cart.addMany(on.map((p) => ({ productId: p.id, variantId: p.variants?.length === 1 ? p.variants[0]!.id : null, qty: 1 })));
    toast({ title: `Added ${n} item${n === 1 ? "" : "s"} to your cart`, description: "Prices are today's: check them in your cart." });
  };
  const brand = (p: ProductSummary) => store?.brandName(p.brand) ?? "";
  return (
    <section className="ax-wrap ax-fbt" data-store="fbt" aria-label={fromOrders.length ? "Frequently bought together" : "Goes well with this"}>
      <h2>{fromOrders.length ? "Frequently bought together" : "Goes well with this"}</h2>
      {!fromOrders.length && <p className="sub">From the same brand. Customers' orders will shape this list as they come in.</p>}
      <div className="ax-fbt-row">
        <div className="pics">
          {all.map((p, i) => (
            <span key={p.id} className={`pic${off.includes(p.id) ? " off" : ""}`}>
              {i > 0 && <Plus size={18} className="plus" aria-hidden="true" />}
              <Link href={itemHref(p.id, p.slug)}><ProductImage src={p.image} width={160} /></Link>
            </span>
          ))}
        </div>
        <div className="buy">
          <p>Total for {on.length} item{on.length === 1 ? "" : "s"}: <b>{formatINR(total)}</b>{mrp > total && <s>{formatINR(mrp)}</s>}</p>
          <button type="button" className="ax-btn teal" disabled={!on.length} onClick={add} data-store="fbt-add"><ShoppingCart size={16} /> Add {on.length === all.length ? `all ${on.length}` : on.length} to cart</button>
        </div>
      </div>
      <ul className="ax-fbt-list">
        {all.map((p, i) => {
          const ticked = !off.includes(p.id);
          return (
            <li key={p.id}>
              <label>
                <input type="checkbox" checked={ticked} onChange={() => setOff((o) => (ticked ? [...o, p.id] : o.filter((x) => x !== p.id)))} data-fbt={p.id} />
                <span>{i === 0 && <b>This item: </b>}{brand(p)} {p.name}</span>
                <em>{formatINR(Number(p.price))}</em>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------------- questions and answers */
export function ProductQA({ productId, productName }: { productId: number; productName: string }) {
  const { data: qs, isLoading } = useQuestions(productId);
  const { isLoggedIn, user } = useUserAuth();
  const [q, setQ] = useState(""), [asking, setAsking] = useState(false), [text, setText] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [sent, setSent] = useState(false);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = qs ?? [];
    return t.length < 2 ? all : all.filter((x) => x.question.toLowerCase().includes(t) || (x.answer ?? "").toLowerCase().includes(t));
  }, [qs, q]);
  const send = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await askQuestion({ productId, question: text }); setSent(true); setText(""); setAsking(false); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  const back = typeof window === "undefined" ? "/" : `${window.location.pathname}#questions`;
  return (
    <section className="ax-wrap ax-qa" id="questions" data-store="qa">
      <div className="ax-h-title"><h2><MessageCircleQuestion size={19} /> Questions and answers</h2>{(qs?.length ?? 0) > 0 && <span className="cnt">{qs!.length} answered</span>}</div>
      {(qs?.length ?? 0) > 2 && (
        <label className="ax-qa-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the questions" aria-label="Search the questions" />{q && <button type="button" onClick={() => setQ("")} aria-label="Clear"><X size={14} /></button>}</label>
      )}
      {isLoading ? <p className="ax-qa-empty"><Loader2 size={16} className="spin" /> Loading…</p>
        : list.length ? (
          <ul className="ax-qa-list">{list.map((x) => (
            <li key={x.id} data-question={x.id}>
              <p className="q"><b>Q:</b> {x.question}</p>
              <p className="a"><b>A:</b> {x.answer}</p>
              <small>Asked by {x.name} · answered by Aethex{x.answeredAt ? ` · ${new Date(x.answeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</small>
            </li>
          ))}</ul>
        ) : <p className="ax-qa-empty">{q ? "No questions match your search." : "No questions yet. Ask about size, compatibility, warranty or how to use it."}</p>}
      {sent && <p className="ax-qa-ok" role="status"><Check size={16} /> Thanks: we've got your question. We'll email you{user?.email ? ` at ${user.email}` : ""} when it's answered, and the answer will show here.</p>}
      {!asking ? (
        isLoggedIn ? <button type="button" className="ax-btn" onClick={() => { setAsking(true); setSent(false); }} data-store="ask">Ask a question</button>
          : <a className="ax-btn" href={loginUrl("/", { next: back })}>Sign in to ask a question</a>
      ) : (
        <form className="ax-qa-form" onSubmit={send}>
          <label className="f"><span>Your question about {productName}</span><textarea required minLength={10} maxLength={500} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: does it come with a carry case?" /></label>
          <p className="fine">Questions are answered by the Aethex team and shown with your first name. For medical advice, ask your doctor.</p>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <div className="row"><button type="submit" className="ax-btn teal" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : null} Send question</button><button type="button" className="ax-btn" onClick={() => setAsking(false)}>Cancel</button></div>
        </form>
      )}
    </section>
  );
}
