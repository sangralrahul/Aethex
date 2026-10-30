/**
 * Aethex for Hospitals (/hospitals) and Aethex for Medical Colleges
 * (/medical-colleges): the store's products chosen for each, with institutional
 * quantities. People build one list (lib/store/bulk.ts), starting from a
 * ready-made list if they like (src/config/kits.ts), and send it for a quotation
 * (POST /api/store/bulk-requests) for one delivery or repeated ones, or order a
 * small list straight away through the cart with cash on delivery. What each page
 * says and shows: src/config/institutions.ts. Styles: src/shop.css (.ax-bulk).
 */
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { sitePortal } from "@/lib/portals";
import { MarketTop } from "@/components/layout/MarketTop";
import { CardArt } from "@/components/visual/CardArt";
import {
  Accessibility, Droplet, HeartHandshake, Mail, Scale, Wind,
  Activity, ArrowRight, Banknote, BedDouble, BookOpen, Bone, Building2, CalendarClock, Check, ChevronDown, ClipboardCheck, ClipboardList, GraduationCap,
  HeartPulse, Hospital, ListChecks, ListPlus, Microscope, Minus, Package, Plus, Search, ShieldCheck, ShoppingCart, Siren, Stethoscope, Syringe, Trash2, X,
  type LucideProps,
} from "lucide-react";
import { BUSINESS } from "@/config/business";
import { ProductImage } from "@/components/store/ProductImage";
import { isBookId, itemHref } from "@/lib/store/bookdata";
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
import { KITS, type Kit, type KitIcon } from "@/config/kits";
import { kitLines } from "@/lib/store/kits";
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

const DEPT_ICONS: Record<string, ComponentType<LucideProps>> = {
  beds: BedDouble, icu: HeartPulse, emergency: Siren, iv: Syringe, wards: Activity, diagnostics: Stethoscope, respiratory: Wind,
  diabetes: Droplet, scales: Scale, rehab: Accessibility, stethoscopes: Stethoscope, anatomy: Bone, simulation: HeartHandshake,
  labs: Microscope, skills: ClipboardCheck, departments: Hospital,
};

/** Brands across the page's sections, most products first. */
function sectionBrands(store: StoreData, sections: BulkSection[]): { slug: string; name: string; n: number }[] {
  const cats = new Set(sections.flatMap((x) => x.categories));
  const n = new Map<string, number>();
  for (const p of store.products) if (cats.has(p.category)) n.set(p.brand, (n.get(p.brand) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([slug, k]) => ({ slug, name: store.brandName(slug), n: k }));
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
  const depts = useMemo(() => (store ? cfg.sections.map((sec) => ({ sec, list: sectionProducts(store, sec) })).filter((d) => d.list.length) : []), [store, cfg]);
  const brands = useMemo(() => (store ? sectionBrands(store, cfg.sections) : []), [store, cfg]);
  const fromHash = () => { const h = typeof window === "undefined" ? "" : window.location.hash.slice(1); return cfg.sections.some((x) => x.id === h) ? h : ""; };
  const [dept, setDept] = useState<string>(fromHash);
  const active = depts.find((d) => d.sec.id === dept) ?? depts[0];

  const openQuote = () => { setDone(null); setQuote(true); };
  const pick = (id: string) => {
    setQ(""); setDept(id);
    window.setTimeout(() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };
  // "#list" (from a product or a book's page) opens on the list; "#icu" and the like on that department.
  useEffect(() => {
    const h = window.location.hash;
    const to = h === "#list" ? "list" : fromHash() ? "catalogue" : "";
    if (!to) return;
    const t = window.setTimeout(() => document.getElementById(to)?.scrollIntoView({ block: "start" }), 250);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const total = depts.reduce((n, d) => n + d.list.length, 0);
  const who = segment === "hospital" ? "hospital" : "college";

  return (
    <div className={`ax-bulk seg-${segment}`}>
      {/* update 71: the marketplace top, like the Store's */}
      <MarketTop
        portal={segment === "hospital" ? "hospitals" : "medicalcolleges"}
        title={cfg.title}
        sub={cfg.subtitle}
        right={
          <div className="ax-bulk-hero-acts">
            <button type="button" className="ax-btn teal lg" onClick={openQuote}><ClipboardList size={17} /> Request a quotation</button>
            <a href="#how" className="ax-btn lg">How it works</a>
          </div>
        }
        deptTitle="Departments"
        depts={cfg.sections.map((sec) => ({ key: sec.id, label: sec.short, icon: DEPT_ICONS[sec.id] ?? Package, onClick: () => pick(sec.id) }))}
        all={{ label: "Whole catalogue", href: "#catalogue" }}
        scene={segment === "hospital" ? ["cross", "pulse"] : ["dna", "molecules"]} rgb={segment === "hospital" ? "34,211,238" : "251,191,36"}
        slides={segment === "hospital" ? [
          { kicker: "One quotation", title: "Equip every ward from one list", text: "Add beds, monitors, emergency kit and consumables with the quantities you need, and we'll send your prices with delivery.", cta: { label: "Request a quotation", onClick: openQuote }, second: { label: "Browse the catalogue", href: "#catalogue" }, tone: "cyan", photo: "ecg", icon: ClipboardList },
          { kicker: "Ready-made lists", title: "Start from a crash cart or an ICU bed", text: "Lists for a crash cart, an ICU bed, a new ward, a month of IV supplies and more. Change the quantities, then send.", cta: { label: "See the lists", href: "#kits" }, tone: "ink", photo: "laryngoscope", icon: ListChecks },
          { kicker: "Diagnostics", title: "Vital signs at every bedside", text: "BP monitors, pulse oximeters, thermometers and diagnostic sets from the makers we stock.", cta: { label: "Vital signs", onClick: () => pick("wards") }, tone: "navy", photo: "bp-monitor", icon: HeartPulse },
          { kicker: "Order ahead", title: "Repeat every month or quarter", text: "Pick the date you need it by, or schedule repeat deliveries. Pay by bank transfer or against your purchase order.", cta: { label: "How it works", href: "#how" }, tone: "slate", photo: "xray-viewer", icon: CalendarClock },
        ] : [
          { kicker: "One quotation", title: "Equip the skills lab and every batch", text: "Stethoscopes for students, manikins and trainers, anatomy models and lab equipment, with the quantities you need.", cta: { label: "Request a quotation", onClick: openQuote }, second: { label: "Browse the catalogue", href: "#catalogue" }, tone: "amber", photo: "stethoscope", icon: ClipboardList },
          { kicker: "Ready-made lists", title: "A kit for every student", text: "Start from a student clinical kit, a skills station or a simulation lab, then change the quantities.", cta: { label: "See the lists", href: "#kits" }, tone: "ink", photo: "neuro-kit", icon: ListChecks },
          { kicker: "Anatomy and labs", title: "Models, microscopes and glassware", text: "Skeletons, torsos and organ models, microscopes, centrifuges and lab essentials for every department.", cta: { label: "Anatomy models", onClick: () => pick("anatomy") }, tone: "navy", photo: "surgical-set", icon: Microscope },
          { kicker: "Library", title: "Textbooks for every course", text: "Standard titles from MBBS to PG, quoted together with the rest of your list.", cta: { label: "Textbooks", href: "/books" }, tone: "slate", photo: "medical-book", icon: BookOpen },
        ]}
        promos={[
          { kicker: "Your quotations", title: "Where every request stands", text: "Sign in to see them", href: "/account/quotations", icon: ClipboardCheck },
          segment === "hospital"
            ? { kicker: "Directory", title: "Hospitals and colleges in India", text: "Search the directory", href: "/institutions", icon: Building2, dark: true }
            : { kicker: "Textbooks", title: "For the library and departments", text: "Every course", href: "/books", icon: BookOpen, dark: true },
        ]}
        trust={[
          { icon: ShieldCheck, t: "Genuine products", d: "With the maker's warranty" },
          { icon: ListChecks, t: "Any quantity", d: "One list, quoted together" },
          { icon: CalendarClock, t: "Order ahead", d: "Or repeat monthly" },
          { icon: Banknote, t: "Bank transfer or PO", d: "On quotations" },
          { icon: Package, t: store ? `${total.toLocaleString("en-IN")} products` : "The full catalogue", d: store ? `${brands.length} brands` : "From verified brands" },
        ]}
      />

      <section className="ax-wrap ax-depts" aria-labelledby="depts-h">
        <div className="ax-ihead"><span>Departments</span><h2 id="depts-h">{segment === "hospital" ? "Everything a hospital runs on" : "Everything a medical college teaches with"}</h2>
          <p>Choose a department to see its products, then add them to one list with the quantities you need.</p></div>
        <div className="grid">
          {(depts.length ? depts : cfg.sections.map((sec) => ({ sec, list: [] as ProductSummary[] }))).map(({ sec, list }) => {
            const I = DEPT_ICONS[sec.id] ?? Package;
            const bs = store ? [...new Set(list.map((p) => store.brandName(p.brand)))].slice(0, 3) : [];
            return (
              <button key={sec.id} type="button" className="ax-dept has-art" onClick={() => pick(sec.id)} data-dept-card={sec.id}>
                <CardArt icon={I} color={segment === "hospital" ? "#0e7490" : "#b45309"} seed={list.length} />
                <span className="ic"><I size={22} /></span>
                <b>{sec.short}</b>
                <small>{store ? `${list.length} product${list.length === 1 ? "" : "s"}` : " "}{bs.length ? ` · ${bs.join(", ")}` : ""}</small>
                <ArrowRight size={16} className="go" />
              </button>
            );
          })}
          {segment === "college" && (
            <Link href="/books" className="ax-dept has-art">
              <CardArt icon={BookOpen} color="#b45309" seed={3} />
              <span className="ic"><BookOpen size={22} /></span><b>Textbooks</b><small>Every course, with the publishers' prices</small><ArrowRight size={16} className="go" />
            </Link>
          )}
        </div>
      </section>

      <div className="ax-wrap ax-bulk-main" id="catalogue">
        <div className="ax-bulk-cat">
          {store && <Kits segment={segment} store={store} />}
          <div className="ax-ihead sm"><span>Catalogue</span><h2>Build your list</h2></div>
          <div className="ax-bulk-find" role="search">
            <Search size={18} aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={segment === "hospital" ? "Search every product: ICU bed, syringe, monitor, Littmann…" : "Search every product: skeleton, microscope, CPR manikin, Littmann…"} aria-label="Search every product" />
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
              <div className="ax-dtabs" role="tablist" aria-label="Departments">
                {depts.map(({ sec, list }) => {
                  const I = DEPT_ICONS[sec.id] ?? Package;
                  const on = active?.sec.id === sec.id;
                  return <button key={sec.id} type="button" role="tab" aria-selected={on} className={on ? "on" : ""} onClick={() => setDept(sec.id)} data-dept={sec.id}><I size={15} /> {sec.short} <em>{list.length}</em></button>;
                })}
              </div>
              {active && <Section key={active.sec.id} sec={active.sec} list={active.list} store={store} defaultQty={cfg.defaultQty} />}
            </>
          )}
          {isLoading && !store && <p className="ax-bulk-loading">Loading products…</p>}
        </div>

        <aside className="ax-bulk-side" id="list" aria-label="Your bulk list">
          <ListPanel onQuote={openQuote} />
        </aside>
      </div>

      <section className="ax-bulk-how" id="how">
        <div className="ax-wrap">
          <div className="ax-ihead"><span>How it works</span><h2>From list to delivery in four steps</h2></div>
          <ol>
            <li><span>1</span><b>Add products</b><small>Pick products and quantities from the departments above, start from a ready-made list, or search the whole store.</small></li>
            <li><span>2</span><b>Send your list</b><small>Add your {segment === "hospital" ? "hospital's" : "college's"} details, where to deliver and when: once, or every month or quarter.</small></li>
            <li><span>3</span><b>Get a quotation</b><small>We email your prices for these quantities, with delivery, usually within one business day.</small></li>
            <li><span>4</span><b>Confirm and pay</b><small>Accept the quotation and pay by bank transfer or purchase order. We deliver across India.</small></li>
          </ol>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="ax-wrap ax-ibrands" aria-labelledby="brands-h">
          <div className="ax-ihead"><span>Brands</span><h2 id="brands-h">Makers in this catalogue</h2></div>
          <ul>{brands.slice(0, 18).map((b) => <li key={b.slug}><Link href={`/brand/${b.slug}`}>{b.name}<small>{b.n}</small></Link></li>)}</ul>
        </section>
      )}

      <section className="ax-wrap ax-bulk-faq">
        <div className="ax-ihead"><span>Questions</span><h2>Before you send a list</h2></div>
        <div className="qs">{cfg.faq.map((f) => <details key={f.q}><summary>{f.q}<ChevronDown size={18} /></summary><p>{f.a}</p></details>)}</div>
      </section>

      <div className="ax-wrap"><section className="ax-icta">
        <div>
          <h2>{segment === "hospital" ? "Have a requirement for your hospital?" : "Planning for a new batch or a new lab?"}</h2>
          <p>Send your list, or simply describe what you need. We'll reply with a quotation by email.</p>
        </div>
        <div className="acts">
          <button type="button" className="ax-btn teal lg" onClick={openQuote}><ClipboardList size={17} /> Request a quotation</button>
          <a className="ax-btn lg ghost" href={`mailto:${BUSINESS.email}`}><Mail size={16} /> {BUSINESS.email}</a>
        </div>
      </section></div>

      {/* Update 65: on its own subdomain each platform links only to its own pages. */}
      {sitePortal() !== "medicalcolleges" && <section className="ax-wrap ax-bulk-other">
        {!sitePortal() && <Link href={cfg.other.path}><span className="ic">{segment === "hospital" ? <GraduationCap size={20} /> : <Hospital size={20} />}</span><span><small>{cfg.other.text}</small><b>{cfg.other.label}</b></span><ArrowRight size={18} /></Link>}
        <Link href="/institutions"><span className="ic"><Building2 size={20} /></span><span><small>Looking for an institution?</small><b>Directory of colleges and hospitals</b></span><ArrowRight size={18} /></Link>
      </section>}

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

/* ------------------------------------------------------------------ ready-made lists */

const KIT_ICONS: Record<KitIcon, ComponentType<LucideProps>> = {
  ward: BedDouble, opd: Stethoscope, student: GraduationCap, station: ClipboardCheck, emergency: Siren, consumables: Syringe,
  bed: BedDouble, icu: HeartPulse, anatomy: Bone, lab: Microscope, cpr: Activity,
};

function Kits({ segment, store }: { segment: Segment; store: StoreData }) {
  const kits = KITS.filter((k) => k.segment === segment);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Kit | null>(null);
  const close = useCallback(() => setOpen(null), []);
  if (!kits.length) return null;
  const countOf = (k: Kit) => counts[k.id] ?? k.per.count;
  const setCount = (k: Kit, n: number) => setCounts((c) => ({ ...c, [k.id]: Math.max(1, Math.min(k.per.max, n)) }));
  return (
    <section className="ax-bulk-sec ax-kits" id="kits">
      <div className="ax-bulk-sec-h">
        <h2>Ready-made lists</h2>
        <p>Start from a list for a whole {segment === "hospital" ? "ward or room" : "batch or lab"}, then change the quantities in your list before you ask for a quote.</p>
      </div>
      <div className="ax-kit-grid">
        {kits.map((k) => <KitCard key={k.id} kit={k} store={store} count={countOf(k)} setCount={(n) => setCount(k, n)} onOpen={() => setOpen(k)} />)}
      </div>
      {open && <KitDialog kit={open} store={store} count={countOf(open)} setCount={(n) => setCount(open, n)} onClose={close} />}
    </section>
  );
}

function useAddKit() {
  const { toast } = useToast();
  return (kit: Kit, store: StoreData, count: number) => {
    const { lines } = kitLines(kit, store, count);
    const r = bulk.addMany(lines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })));
    const per = count === 1 ? kit.per.one : kit.per.many;
    toast({
      title: r.added ? `Added: ${kit.title}` : "Your list is full",
      description: r.added
        ? `${r.added} products for ${count.toLocaleString("en-IN")} ${per}. Change the quantities in your list.${r.full ? " Some didn't fit: the list is full." : ""}`
        : "Send this list for a quotation, then start another.",
      duration: 4500,
    });
    return r.added > 0;
  };
}

function KitCount({ kit, count, setCount }: { kit: Kit; count: number; setCount: (n: number) => void }) {
  const [v, setV] = useState(String(count));
  useEffect(() => setV(String(count)), [count]);
  const step = count >= 20 ? 10 : 1;
  return (
    <div className="ax-kit-count">
      <span>For</span>
      <div className="qty">
        <button type="button" onClick={() => setCount(count - step)} disabled={count <= 1} aria-label={`Fewer ${kit.per.many}`}><Minus size={14} /></button>
        <input
          value={v}
          onChange={(e) => { const s = e.target.value.replace(/\D/g, "").slice(0, 4); setV(s); if (Number(s) > 0) setCount(Number(s)); }}
          onBlur={() => setV(String(count))}
          inputMode="numeric"
          aria-label={`Number of ${kit.per.many}`}
        />
        <button type="button" onClick={() => setCount(count + step)} disabled={count >= kit.per.max} aria-label={`More ${kit.per.many}`}><Plus size={14} /></button>
      </div>
      <span>{count === 1 ? kit.per.one : kit.per.many}</span>
    </div>
  );
}

function KitCard({ kit, store, count, setCount, onOpen }: { kit: Kit; store: StoreData; count: number; setCount: (n: number) => void; onOpen: () => void }) {
  const addKit = useAddKit();
  const Icon = KIT_ICONS[kit.icon];
  const { lines } = useMemo(() => kitLines(kit, store, count), [kit, store, count]);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  if (!lines.length) return null;
  return (
    <article className="ax-kit has-art">
      <CardArt icon={Icon} color={kit.segment === "hospital" ? "#0e7490" : "#b45309"} seed={kit.title.length} />
      <div className="top">
        <span className="ic"><Icon size={22} /></span>
        <div><b>{kit.title}</b><small>{kit.text}</small></div>
      </div>
      <KitCount kit={kit} count={count} setCount={setCount} />
      <p className="meta">{lines.length} products · {units.toLocaleString("en-IN")} units</p>
      <div className="acts">
        <button type="button" className="ax-btn teal" onClick={() => addKit(kit, store, count)}><ListPlus size={16} /> Add to my list</button>
        <button type="button" className="ax-btn" onClick={onOpen}>What's in it</button>
      </div>
    </article>
  );
}

function KitDialog({ kit, store, count, setCount, onClose }: { kit: Kit; store: StoreData; count: number; setCount: (n: number) => void; onClose: () => void }) {
  const addKit = useAddKit();
  const { lines } = useMemo(() => kitLines(kit, store, count), [kit, store, count]);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <Dialog open onClose={onClose} title={kit.title} wide>
      <div className="ax-kit-dlg">
        <p className="lead">{kit.text}</p>
        <KitCount kit={kit} count={count} setCount={setCount} />
        <ul>
          {lines.map((l) => (
            <li key={`${l.productId}:${l.variantId ?? ""}`}>
              <Link href={`/products/${l.product.slug}`} className="th" onClick={onClose}><ProductImage src={l.product.image} width={96} /></Link>
              <div className="nm">
                <Link href={`/products/${l.product.slug}`} onClick={onClose}>{store.brandName(l.product.brand)} {l.product.name}</Link>
                {l.optionLabel && <small>{l.product.optionName ?? "Option"}: {l.optionLabel}</small>}
                <small>{l.product.priceOnRequest || l.product.price === null ? "Price on request" : `${formatINR(l.product.price)} each, store price`}</small>
              </div>
              <b className="q">{l.qty.toLocaleString("en-IN")}</b>
            </li>
          ))}
        </ul>
        <p className="note">{lines.length} products, {units.toLocaleString("en-IN")} units. A starting point, not a standard: check it against your own protocols and change the quantities in your list.</p>
        <button type="button" className="ax-btn teal lg" onClick={() => { if (addKit(kit, store, count)) onClose(); }}><ListPlus size={17} /> Add all to my list</button>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ a section of products */

function Section({ sec, list, store, defaultQty }: { sec: BulkSection; list: ProductSummary[]; store: StoreData; defaultQty: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, SHOW);
  return (
    <section className="ax-bulk-sec" id={sec.id} role="tabpanel">
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
            <Link href={itemHref(i.productId, i.slug)} className="th"><ProductImage src={i.image} width={96} book={isBookId(i.productId)} /></Link>
            <div className="nm">
              <Link href={itemHref(i.productId, i.slug)}>{isBookId(i.productId) ? i.name : `${store?.brandName(i.brand) ?? ""} ${i.name}`}</Link>
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
