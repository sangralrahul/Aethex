/**
 * Aethex for Hospitals (/hospitals) and Aethex for Medical Colleges
 * (/medical-colleges): the store's products chosen for each, with institutional
 * quantities. People build one list (lib/store/bulk.ts) and send it for a
 * quotation (POST /api/store/bulk-requests), or order a small list straight away
 * through the cart with cash on delivery. What each page says and shows:
 * src/config/institutions.ts. Styles: src/shop.css (.ax-bulk).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Banknote, BookOpen, Building2, Check, ChevronDown, ClipboardList, GraduationCap, Hospital, ListChecks, Minus, Package, Plus, Search,
  ShieldCheck, ShoppingCart, Trash2, Truck, X,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ProductImage } from "@/components/store/ProductImage";
import { Dialog } from "@/components/store/Dialog";
import { BulkQuoteDone, BulkQuoteForm } from "@/components/store/BulkQuoteForm";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { useStore, type StoreData } from "@/lib/store/api";
import { bulk, useBulkLines, usePricedBulk } from "@/lib/store/bulk";
import { cart } from "@/lib/store/cart";
import { BULK_MAX_QTY, directOrder, lineKey, mixBrands } from "@/lib/store/rules";
import { searchProducts } from "@/lib/store/search";
import type { BulkItem, ProductSummary, Segment } from "@/lib/store/types";
import { SEGMENT_PAGES, type BulkSection } from "@/config/institutions";
import { formatINR } from "@/lib/utils";

const SHOW = 8;
const tier = (p: ProductSummary) => Number(p.inStock) * 4 + Number(!!p.featured) * 2 + Number(!p.priceOnRequest);

/** The section's products: each category best first with the brands taking turns, then the categories taking turns. */
function sectionProducts(store: StoreData, sec: BulkSection): ProductSummary[] {
  const queues = sec.categories.map((c) => mixBrands(store.products.filter((p) => p.category === c), tier));
  const out: ProductSummary[] = [];
  for (let i = 0; queues.some((q) => i < q.length); i++) for (const q of queues) if (i < q.length) out.push(q[i]);
  return out;
}

export default function BulkPortal({ segment }: { segment: Segment }) {
  const cfg = SEGMENT_PAGES[segment];
  useSeo({ title: cfg.seoTitle, description: cfg.seoDescription, path: cfg.path });
  const { data: store, isLoading } = useStore();
  const [q, setQ] = useState("");
  const [quote, setQuote] = useState(false);
  const [done, setDone] = useState<{ id: string; email: string; emailed: boolean } | null>(null);
  const lines = useBulkLines();
  const found = useMemo(() => (store && q.trim() ? searchProducts(store.products, q, store).slice(0, 24) : []), [store, q]);

  const openQuote = () => { setDone(null); setQuote(true); };
  const Icon = segment === "hospital" ? Hospital : GraduationCap;

  return (
    <div className="ax-bulk">
      <PageHero
        tag={cfg.tag}
        title={cfg.title}
        subtitle={cfg.subtitle}
        icon={<Icon className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />}
        right={
          <div className="ax-bulk-hero-acts">
            <button type="button" className="ax-btn teal lg" onClick={openQuote}><ClipboardList size={17} /> Request a quote</button>
            <a href="#how" className="ax-btn lg ghost">How it works</a>
          </div>
        }
      />

      <ul className="ax-wrap ax-bulk-points" aria-label="Why order with Aethex">
        <li><ShieldCheck size={20} /><div><b>Genuine products</b><small>From the brands' own ranges, with the manufacturer's warranty</small></div></li>
        <li><ListChecks size={20} /><div><b>Any quantity</b><small>One list for every department, quoted together</small></div></li>
        <li><Banknote size={20} /><div><b>Bank transfer or PO</b><small>On quotations; small orders can be cash on delivery</small></div></li>
        <li><Truck size={20} /><div><b>Delivery across India</b><small>To your {segment === "hospital" ? "hospital or clinic" : "college or department"}</small></div></li>
      </ul>

      <div className="ax-wrap ax-bulk-main">
        <div className="ax-bulk-cat">
          <div className="ax-bulk-find" role="search">
            <Search size={18} aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every product: Littmann, oximeter, knee brace…" aria-label="Search every product" />
            {q && <button type="button" className="clear" onClick={() => setQ("")} aria-label="Clear the search"><X size={16} /></button>}
          </div>
          {!store ? (
            <div className="ax-bulk-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="ax-bcard sk" />)}</div>
          ) : q.trim() ? (
            <section className="ax-bulk-sec" aria-live="polite">
              <div className="ax-bulk-sec-h"><h2>{found.length ? `Products matching “${q.trim()}”` : `Nothing matches “${q.trim()}”`}</h2>
                {!found.length && <p>Try another word, or add it to the notes when you send your list and we'll tell you what we can supply.</p>}</div>
              <div className="ax-bulk-grid">{found.map((p) => <BulkCard key={p.id} p={p} store={store} defaultQty={cfg.defaultQty} />)}</div>
            </section>
          ) : (
            <>
              {cfg.sections.map((sec) => <Section key={sec.id} sec={sec} store={store} defaultQty={cfg.defaultQty} />)}
              {segment === "college" && (
                <section className="ax-bulk-sec">
                  <Link href="/books" className="ax-bulk-books">
                    <span className="ic"><BookOpen size={22} /></span>
                    <span><b>Textbooks for the library and departments</b><small>Every year and subject of MBBS, MD, MS and beyond. Ask for any title in the quantity you need.</small></span>
                    <ArrowRight size={18} />
                  </Link>
                </section>
              )}
            </>
          )}
          {isLoading && !store && <p className="ax-bulk-loading">Loading products…</p>}
        </div>

        <aside className="ax-bulk-side" id="list" aria-label="Your bulk list">
          <ListPanel onQuote={openQuote} />
        </aside>
      </div>

      <section className="ax-wrap ax-bulk-how" id="how">
        <h2>How it works</h2>
        <ol>
          <li><span>1</span><b>Add products</b><small>Pick products and quantities from the sections above, or search the whole store.</small></li>
          <li><span>2</span><b>Send your list</b><small>Add your {segment === "hospital" ? "hospital's" : "college's"} details and where to deliver. It takes a minute.</small></li>
          <li><span>3</span><b>Get a quotation</b><small>We email your prices for these quantities, with delivery, usually within one business day.</small></li>
          <li><span>4</span><b>Confirm and pay</b><small>Accept the quotation and pay by bank transfer or purchase order. We deliver across India.</small></li>
        </ol>
      </section>

      <section className="ax-wrap ax-bulk-faq">
        <h2>Questions</h2>
        <div>{cfg.faq.map((f) => <details key={f.q}><summary>{f.q}<ChevronDown size={18} /></summary><p>{f.a}</p></details>)}</div>
      </section>

      <section className="ax-wrap ax-bulk-other">
        <Link href={cfg.other.path}><span className="ic">{segment === "hospital" ? <GraduationCap size={20} /> : <Hospital size={20} />}</span><span><small>{cfg.other.text}</small><b>{cfg.other.label}</b></span><ArrowRight size={18} /></Link>
        <Link href="/institutions"><span className="ic"><Building2 size={20} /></span><span><small>Looking for an institution?</small><b>Directory of colleges and hospitals</b></span><ArrowRight size={18} /></Link>
      </section>

      {lines.length > 0 && (
        <div className="ax-bulk-bar" role="region" aria-label="Your bulk list">
          <a href="#list"><b>{lines.length} product{lines.length === 1 ? "" : "s"}</b><small>in your list · view</small></a>
          <button type="button" className="ax-btn teal" onClick={openQuote}>Request a quote</button>
        </div>
      )}

      <QuoteDialog open={quote} segment={segment} done={done} onDone={(r) => { setDone(r); bulk.clear(); }} onClose={() => setQuote(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ a section of products */

function Section({ sec, store, defaultQty }: { sec: BulkSection; store: StoreData; defaultQty: number }) {
  const [all, setAll] = useState(false);
  const list = useMemo(() => sectionProducts(store, sec), [store, sec]);
  if (!list.length) return null;
  const shown = all ? list : list.slice(0, SHOW);
  return (
    <section className="ax-bulk-sec" id={sec.id}>
      <div className="ax-bulk-sec-h">
        <h2>{sec.title}</h2>
        <p>{sec.text}</p>
        <div className="cats">{sec.categories.map((c) => store.category(c)).filter(Boolean).map((c) => <Link key={c!.slug} href={`/category/${c!.slug}`}>{c!.name}</Link>)}</div>
      </div>
      <div className="ax-bulk-grid">{shown.map((p) => <BulkCard key={p.id} p={p} store={store} defaultQty={defaultQty} />)}</div>
      {list.length > SHOW && (
        <button type="button" className="ax-btn ax-bulk-more" onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? "Show fewer" : `Show all ${list.length} products`} <ChevronDown size={16} style={{ transform: all ? "rotate(180deg)" : undefined }} />
        </button>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ a product with a quantity */

function BulkCard({ p, store, defaultQty }: { p: ProductSummary; store: StoreData; defaultQty: number }) {
  const { toast } = useToast();
  const lines = useBulkLines();
  const vs = p.variants ?? [];
  const [vid, setVid] = useState<string>(vs.length === 1 ? vs[0].id : "");
  const variantId = vs.length ? vid || null : null;
  const current = lines.find((l) => lineKey(l.productId, l.variantId) === lineKey(p.id, variantId));
  const [qty, setQty] = useState(String(current?.qty ?? defaultQty));
  useEffect(() => { if (current) setQty(String(current.qty)); }, [current?.qty]); // eslint-disable-line react-hooks/exhaustive-deps
  const v = vs.find((x) => x.id === vid);
  const price = p.priceOnRequest ? null : v?.price ?? p.price;
  const needChoice = vs.length > 1 && !vid;
  const n = Math.max(1, Math.min(BULK_MAX_QTY, Math.trunc(Number(qty)) || 0));

  const add = () => {
    if (needChoice) return;
    if (!bulk.put(p.id, variantId, n)) { toast({ title: "Your list is full", description: "Send this list for a quotation, then start another." }); return; }
    toast({ title: current ? "Quantity updated" : "Added to your list", description: `${n.toLocaleString("en-IN")} × ${p.name}${v && vs.length > 1 ? ` (${v.label})` : ""}`, duration: 2500 });
  };

  return (
    <article className={`ax-bcard${current ? " in" : ""}`}>
      <Link href={`/products/${p.slug}`} className="pic" aria-label={p.name}><ProductImage src={p.image} alt={p.name} width={360} /></Link>
      <div className="txt">
        <small>{store.brandName(p.brand)}</small>
        <Link href={`/products/${p.slug}`} className="nm">{p.name}</Link>
        <p className={`pr${price === null || price === undefined ? " por" : ""}`}>
          {price === null || price === undefined ? "Price on request" : <>{p.from && !v ? "From " : ""}{formatINR(price)} <em>each, store price</em></>}
        </p>
        {!p.inStock && <p className="oos">Out of stock on the site: we'll check availability</p>}
        {vs.length > 1 && (
          <select value={vid} onChange={(e) => setVid(e.target.value)} aria-label={`${p.optionName ?? "Option"} for ${p.name}`}>
            <option value="">Choose {(p.optionName ?? "option").toLowerCase()}…</option>
            {vs.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        )}
        <div className="add">
          <div className="qty">
            <button type="button" onClick={() => setQty(String(Math.max(1, n - (n > 10 ? 5 : 1))))} aria-label="Fewer"><Minus size={14} /></button>
            <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, "").slice(0, 5))} onBlur={() => setQty(String(n))} inputMode="numeric" aria-label={`Quantity of ${p.name}`} />
            <button type="button" onClick={() => setQty(String(Math.min(BULK_MAX_QTY, n + (n >= 10 ? 5 : 1))))} aria-label="More"><Plus size={14} /></button>
          </div>
          <button type="button" className={`ax-btn ${current && n === current.qty ? "" : "teal"}`} onClick={add} disabled={needChoice} title={needChoice ? `Choose a ${(p.optionName ?? "option").toLowerCase()} first` : undefined}>
            {current ? (n === current.qty ? <><Check size={15} /> In list</> : "Update") : <><Plus size={15} /> Add</>}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ the list */

function ListPanel({ onQuote }: { onQuote: () => void }) {
  const { priced, lines, store } = usePricedBulk();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const direct = directOrder(priced);

  const orderNow = () => {
    for (const i of priced.items) cart.add(i.productId, i.variantId, i.qty);
    bulk.clear();
    toast({ title: "Moved to your cart", description: "Check the quantities and place the order with cash on delivery." });
    setLocation("/cart");
  };

  if (!lines.length) {
    return (
      <div className="ax-blist empty">
        <h2><ClipboardList size={18} /> Your bulk list</h2>
        <p>Add products with the quantities you need. When the list is ready, send it for a quotation.</p>
        <button type="button" className="ax-btn" onClick={onQuote}>Or describe what you need</button>
      </div>
    );
  }
  return (
    <div className="ax-blist">
      <h2><ClipboardList size={18} /> Your bulk list <span>{lines.length}</span></h2>
      <ul>
        {priced.items.map((i) => (
          <li key={lineKey(i.productId, i.variantId)}>
            <Link href={`/products/${i.slug}`} className="th"><ProductImage src={i.image} width={96} /></Link>
            <div className="nm">
              <Link href={`/products/${i.slug}`}>{store?.brandName(i.brand)} {i.name}</Link>
              {i.variantLabel && <small>{i.variantLabel}</small>}
              <small>{i.unitPrice === null ? "Price on request" : `${formatINR(i.unitPrice)} each`}</small>
            </div>
            <LineQty item={i} />
            <button type="button" className="rm" onClick={() => bulk.remove(i.productId, i.variantId)} aria-label={`Remove ${i.name}`}><Trash2 size={15} /></button>
          </li>
        ))}
        {priced.issues.map((x) => (
          <li key={`x-${lineKey(x.productId, x.variantId)}`} className="gone">
            <div className="nm"><span>{store?.byId.get(x.productId)?.name ?? "A product"}</span><small>{x.reason === "choose-option" ? "Choose a size or option for it on its card" : "No longer available"}</small></div>
            <button type="button" className="rm" onClick={() => bulk.remove(x.productId, x.variantId)} aria-label="Remove"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
      <div className="tot">
        <p><span>{priced.units.toLocaleString("en-IN")} units</span>{priced.estTotal > 0 && <b>{formatINR(priced.estTotal)}</b>}</p>
        <small>{priced.estTotal > 0 ? "At store prices" : ""}{priced.unpriced ? `${priced.estTotal > 0 ? ", plus " : ""}${priced.unpriced} item${priced.unpriced === 1 ? "" : "s"} priced on request` : ""}. The quotation gives your price for these quantities.</small>
      </div>
      <button type="button" className="ax-btn teal lg" onClick={onQuote}><ClipboardList size={17} /> Request a quote</button>
      {direct.ok ? (
        <button type="button" className="ax-btn lg" onClick={orderNow}><ShoppingCart size={17} /> Order now · cash on delivery</button>
      ) : (
        <p className="why"><Package size={14} /> {direct.reason} Larger orders are by quotation.</p>
      )}
      <button type="button" className="ax-link clear" onClick={() => { if (window.confirm("Remove everything from your bulk list?")) bulk.clear(); }}>Clear the list</button>
    </div>
  );
}

/** A quantity in the list: typing can leave it empty for a moment; it settles when the field is left. */
function LineQty({ item }: { item: BulkItem }) {
  const [v, setV] = useState(String(item.qty));
  useEffect(() => setV(String(item.qty)), [item.qty]);
  return (
    <input
      value={v}
      onChange={(e) => {
        const s = e.target.value.replace(/\D/g, "").slice(0, 5);
        setV(s);
        if (Number(s) > 0) bulk.setQty(item.productId, item.variantId, Number(s));
      }}
      onBlur={() => setV(String(item.qty))}
      inputMode="numeric"
      aria-label={`Quantity of ${item.name}`}
    />
  );
}

/* ------------------------------------------------------------------ the quotation request */

function QuoteDialog({ open, segment, done, onDone, onClose }: {
  open: boolean; segment: Segment; done: { id: string; email: string; emailed: boolean } | null; onDone: (r: { id: string; email: string; emailed: boolean }) => void; onClose: () => void;
}) {
  const { priced, lines } = usePricedBulk();
  return (
    <Dialog open={open} onClose={onClose} title={done ? "Thank you" : "Request a quotation"} wide>
      {done ? <BulkQuoteDone {...done} /> : <BulkQuoteForm segment={segment} lines={lines} priced={priced} onDone={onDone} />}
    </Dialog>
  );
}
