/**
 * A medical book (/books/:slug), laid out like a product: the cover, title,
 * authors, edition and publisher; the price with MRP, or "ask for the price"
 * when the publisher's price isn't listed; add to cart and buy now with cash on
 * delivery; the details (ISBN, pages, binding), the courses and exams it's
 * for, and more books for the same subject. Also: stars and reviews from
 * buyers, a sale running on it, the delivery check by PIN code, back-in-stock
 * and price-drop emails, and what buyers ordered with it (from real orders) or,
 * until there are such orders, the rest of its year's set. Addresses from the
 * first books page (/books/williams-obstetrics-26th-ed) move to the book's own;
 * others show the books that may match.
 * Data: useBooks(). Styles: src/shop.css (.ax-pdp, .ax-bkd).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowLeft, BadgeCheck, BadgePercent, Banknote, BellRing, BookOpen, Building2, Check, Heart, Library, MessageSquareText, Minus, Plus, RotateCcw,
  Search as SearchIcon, Share2, ShieldCheck, ShoppingCart, Truck, Zap,
} from "lucide-react";
import { BookCard, BookCover } from "@/components/store/BookCard";
import { EnquiryDialog } from "@/components/store/EnquiryForm";
import { AlertDialog } from "@/components/store/AlertDialog";
import { DeliveryCheck } from "@/components/store/DeliveryCheck";
import { CustomerReviews, RatingLine } from "@/components/store/Reviews";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { useBooks, useStoreConfig, useTogether, type BookStore } from "@/lib/store/api";
import { bookSet } from "@/lib/store/booksets";
import type { Book } from "@/lib/store/types";
import { bookName } from "@/lib/store/bookdata";
import { findBook, indexBooks, recommendRank, searchBooks, slugQuery } from "@/lib/store/books";
import { bulk, useBulkLines } from "@/lib/store/bulk";
import { cart } from "@/lib/store/cart";
import { DELIVERY_FEE, discountPct, FREE_DELIVERY_FROM, MAX_QTY } from "@/lib/store/rules";
import { groupInfo } from "@/config/bookCourses";
import { BUSINESS, SITE_URL } from "@/config/business";
import { formatINR } from "@/lib/utils";

/** Copies a library or a batch usually starts with. */
const LIBRARY_COPIES = 10;

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function structured(b: Book, publisher: string, place: { course?: string; courseHref?: string }) {
  const url = `${SITE_URL}/books/${b.slug}`;
  const authors = (b.authors ?? "").split(/\s*,\s*/).filter(Boolean).map((name) => ({ "@type": "Person", name }));
  const book: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Book", name: b.title, url, description: b.summary,
    publisher: { "@type": "Organization", name: publisher },
  };
  if (b.subtitle) book.alternativeHeadline = b.subtitle;
  if (authors.length) book.author = authors;
  if (b.isbn) book.isbn = b.isbn;
  if (b.edition) book.bookEdition = b.edition;
  if (b.pages) book.numberOfPages = b.pages;
  if (b.year) book.datePublished = String(b.year);
  if (b.binding) book.bookFormat = /hard/i.test(b.binding) ? "https://schema.org/Hardcover" : "https://schema.org/Paperback";
  if (b.cover) book.image = b.cover;
  if (b.rating?.count) book.aggregateRating = { "@type": "AggregateRating", ratingValue: b.rating.avg, reviewCount: b.rating.count, bestRating: 5, worstRating: 1 };
  if (b.price !== null && !b.priceOnRequest) {
    book.offers = {
      "@type": "Offer", priceCurrency: "INR", price: b.price, url, itemCondition: "https://schema.org/NewCondition",
      availability: b.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: BUSINESS.legalName },
    };
  }
  const items = [{ name: "Medical books", item: `${SITE_URL}/books` }];
  if (place.course && place.courseHref) items.push({ name: place.course, item: `${SITE_URL}${place.courseHref}` });
  items.push({ name: b.title, item: url });
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })) };
  return [book, crumbs];
}

/** The book's courses, years and subjects, each opening that list on /books. */
function placesOf(b: Book) {
  const seen = new Set<string>();
  const out: { key: string; label: string; href: string }[] = [];
  for (const p of b.placements) {
    const g = groupInfo(p.group);
    if (!g) continue;
    const key = `${p.group}|${p.subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const several = g.course.groups.length > 1;
    const href = `/books?course=${g.course.id}${several ? `&group=${g.group.id}` : ""}&subject=${encodeURIComponent(p.subject)}`;
    out.push({ key, label: `${several ? g.group.label : g.course.label} · ${p.subject}`, href });
  }
  return out;
}

function Missing({ bs, slug }: { bs: BookStore; slug: string }) {
  const q = slugQuery(slug);
  const index = useMemo(() => indexBooks(bs.books, bs.publisherName), [bs]);
  const matches = useMemo(() => {
    if (!q) return [];
    const words = q.split(" ");
    const tries = [q, words.filter((w) => w.length > 2).join(" "), [...words].sort((a, b) => b.length - a.length).slice(0, 2).join(" ")];
    for (const t of tries) {
      const r = t ? searchBooks(bs.books, index, t) : [];
      if (r.length) return r.slice(0, 10);
    }
    return [];
  }, [bs, index, q]);
  return (
    <div className="ax-pdp-page">
      <div className="ax-wrap ax-bkd-miss">
        <div className="ax-empty" style={{ marginTop: 40 }}>
          <span className="ic"><BookOpen size={26} /></span>
          <h2>We couldn't find that book</h2>
          <p>It may be listed under a newer edition. Search the books, or ask us for it and we'll find it.</p>
          <div className="acts">
            {q && <Link href={`/books?q=${encodeURIComponent(q)}`} className="ax-btn teal"><SearchIcon size={16} /> Search for “{q}”</Link>}
            <Link href="/books" className="ax-btn"><ArrowLeft size={16} /> All medical books</Link>
          </div>
        </div>
        {matches.length > 0 && (
          <>
            <h2>Books that may match</h2>
            <div className="ax-grid grid ax-bk-grid">
              {matches.map((b) => <BookCard key={b.id} book={b} publisher={bs.publisherName(b.publisher)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookDetail() {
  const [, params] = useRoute("/books/:slug");
  const slug = params?.slug ?? "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { has, toggle } = useWishlist();
  const { data: bs, isLoading, error, refetch } = useBooks();
  const found = useMemo(() => (bs ? findBook(bs.books, bs.bySlug, slug) : null), [bs, slug]);
  const book = found?.book;
  const bulkLines = useBulkLines();
  const [qty, setQty] = useState(1);
  const [ask, setAsk] = useState<null | "price" | "bulk">(null);
  const [alertKind, setAlertKind] = useState<null | "stock" | "price">(null);
  const { data: config } = useStoreConfig();
  const { data: togetherIds } = useTogether(book?.id);

  // Old addresses move to the book's own.
  useEffect(() => { if (found?.moved) setLocation(`/books/${found.book.slug}`, { replace: true }); }, [found, setLocation]);
  useEffect(() => {
    if (!book) return;
    setQty(1);
    window.scrollTo({ top: 0 });
    if (window.location.hash === "#ask" && (book.price === null || book.priceOnRequest)) setAsk("price");
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const publisher = book && bs ? bs.publisherName(book.publisher) : "";
  const first = book?.placements[0];
  const firstGroup = first ? groupInfo(first.group) : undefined;
  const courseHref = firstGroup ? `/books?course=${firstGroup.course.id}` : undefined;
  const priced = !!book && book.price !== null && !book.priceOnRequest;
  const price = priced ? Number(book!.price) : null;
  const mrp = priced ? Math.max(Number(book!.mrp ?? book!.price), Number(book!.price)) : null;
  const off = price !== null && mrp !== null ? discountPct(price, mrp) : 0;

  useSeo({
    title: book
      ? `${bookName(book)}${book.authors ? ` by ${book.authors.split(/\s*,\s*/)[0]}` : ""}${price !== null ? ` at ${formatINR(price)}` : ""} | Aethex`
      : "Medical book | Aethex",
    description: book ? `${book.title}${book.edition ? `, ${book.edition}` : ""} (${publisher}). ${book.summary}`.slice(0, 160) : "Medical textbooks, reviews and exam books with cash on delivery across India.",
    path: book ? `/books/${book.slug}` : `/books/${slug}`,
    image: book?.cover,
    type: "product",
  });

  const related = useMemo(() => {
    if (!book || !bs) return [];
    const mine = book.placements;
    const score = (b: Book) => {
      let s = 0;
      for (const p of b.placements) for (const q of mine) {
        if (p.group === q.group && p.subject === q.subject) s = Math.max(s, 4);
        else if (p.subject === q.subject) s = Math.max(s, 2);
        else if (p.group === q.group) s = Math.max(s, 1);
      }
      return s;
    };
    return bs.books
      .filter((b) => b.id !== book.id)
      .map((b) => ({ b, s: score(b) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s || recommendRank(y.b) - recommendRank(x.b) || x.b.title.localeCompare(y.b.title))
      .slice(0, 10)
      .map((x) => x.b);
  }, [book, bs]);

  // What buyers ordered with it (from real orders); until there are such orders, the rest of its year's set.
  const together = useMemo(() => (bs && togetherIds ? togetherIds.map((id) => bs.byId.get(id)).filter((x): x is Book => !!x).slice(0, 5) : []), [bs, togetherIds]);
  const setRest = useMemo(() => {
    if (!book || !bs) return null;
    for (const p of book.placements) {
      const plan = bookSet(bs.books, p.group);
      if (!plan || !plan.subjects.some((s) => s.options.some((o) => o.id === book.id))) continue;
      const g = groupInfo(p.group);
      const rest = plan.subjects.filter((s) => !s.options.some((o) => o.id === book.id)).map((s) => s.options[0]);
      if (rest.length && g) return { label: plan.label, href: `/books?course=${g.course.id}${g.course.groups.length > 1 ? `&group=${g.group.id}` : ""}#set`, books: rest.slice(0, 5) };
    }
    return null;
  }, [book, bs]);

  if (error && !bs) {
    return (
      <div className="ax-pdp-page">
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "48px 0" }}>
          <span className="ic"><BookOpen size={26} /></span>
          <h2>The book didn't load</h2>
          <p>{error.message}</p>
          <div className="acts"><button type="button" className="ax-btn teal" onClick={() => refetch()}>Try again</button></div>
        </div></div>
      </div>
    );
  }

  if (isLoading || !bs || found?.moved) {
    return (
      <div className="ax-pdp-page">
        <div className="ax-wrap ax-pdp ax-pdp-loading" aria-busy="true">
          <div className="sk ax-pdp-sk-img" /><div><div className="sk l1" /><div className="sk l2" /><div className="sk l3" /></div>
        </div>
      </div>
    );
  }

  if (!book) return <Missing bs={bs} slug={slug} />;

  const places = placesOf(book);
  const inList = bulkLines.find((l) => l.productId === book.id && !l.variantId);
  const subject = first?.subject ?? "";
  const moreHref = places[0]?.href ?? "/books";

  const add = (then?: () => void) => {
    cart.add(book.id, null, qty);
    if (then) then();
    else toast({ title: "Added to cart", description: `${bookName(book)}${qty > 1 ? ` × ${qty}` : ""}` });
  };
  const addToList = () => {
    if (!bulk.put(book.id, null, inList ? inList.qty : LIBRARY_COPIES)) {
      toast({ variant: "destructive", title: "Your college list is full", description: "Send it for a quotation first, or remove something from it." });
      return;
    }
    toast({ title: "Added to your college list", description: `${LIBRARY_COPIES} copies. Change the number on the list before you send it.` });
  };
  const share = async () => {
    const url = `${SITE_URL}/books/${book.slug}`;
    try {
      if (navigator.share) { await navigator.share({ title: bookName(book), url }); return; }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch { /* cancelled */ }
  };

  const facts: [string, string][] = [];
  facts.push(["Edition", book.edition ? book.edition.replace(/ edition\b/i, "") : "Latest"]);
  if (book.year) facts.push(["Published", String(book.year)]);
  if (book.pages) facts.push(["Pages", book.pages.toLocaleString("en-IN")]);
  if (book.binding) facts.push(["Binding", book.binding]);
  if (book.isbn) facts.push(["ISBN-13", book.isbn]);
  if (facts.length < 3) {
    facts.unshift(["Publisher", publisher]);
    if (places[0]) facts.push(["For", places[0].label]);
  }

  const details: [string, React.ReactNode][] = [["Title", book.subtitle ? `${book.title}: ${book.subtitle}` : book.title]];
  if (book.authors) details.push(["Authors", book.authors]);
  details.push(["Edition", book.edition ?? "The latest edition, confirmed with your order"]);
  if (book.year) details.push(["Published", String(book.year)]);
  details.push(["Publisher", <Link key="p" href={`/books?pub=${book.publisher}`}>{publisher}</Link>]);
  if (book.isbn) details.push(["ISBN-13", book.isbn]);
  if (book.pages) details.push(["Pages", book.pages.toLocaleString("en-IN")]);
  if (book.binding) details.push(["Binding", book.binding]);
  if (places.length) details.push(["For", <span key="f">{places.map((p, i) => <span key={p.key}>{i > 0 && ", "}<Link href={p.href}>{p.label}</Link></span>)}</span>]);
  if (book.exams?.length) details.push(["Exams", book.exams.join(", ")]);
  details.push(["Sold by", BUSINESS.legalName]);

  const ld = structured(book, publisher, { course: firstGroup?.course.label, courseHref });
  const enquiry = ask === "bulk"
    ? { title: "Bulk order", kind: "bulk" as const, qty: LIBRARY_COPIES }
    : { title: "Ask for the price", kind: "book" as const, qty };

  return (
    <div className="ax-pdp-page">
      {ld.map((d, i) => <JsonLd key={i} data={d} />)}
      <div className="ax-wrap">
        <nav className="ax-crumbs ax-pdp-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/books">Medical books</Link><span aria-hidden="true">/</span>
          {firstGroup && courseHref && <><Link href={courseHref}>{firstGroup.course.label}</Link><span aria-hidden="true">/</span></>}
          <span aria-current="page">{book.title}</span>
        </nav>
      </div>

      <div className="ax-wrap ax-pdp ax-bkd">
        {/* cover */}
        <div className="ax-pdp-gallery">
          <div className="ax-bkd-cover">
            <BookCover book={book} publisher={publisher} size="large" eager />
            {off >= 5 && <span className="badge off">{off}% off</span>}
            {book.standard && <span className="badge pick">Standard textbook</span>}
          </div>
          <div className="ax-pdp-tools">
            <button type="button" className={has(book.id) ? "on" : ""} onClick={() => { const a = toggle(book.id); toast({ title: a ? "Saved to your wishlist" : "Removed from your wishlist" }); }} aria-pressed={has(book.id)}>
              <Heart size={16} fill={has(book.id) ? "currentColor" : "none"} /> {has(book.id) ? "Saved" : "Save to wishlist"}
            </button>
            <button type="button" onClick={share}><Share2 size={16} /> Share</button>
          </div>
        </div>

        {/* buy box */}
        <div className="ax-pdp-info">
          <div className="ax-pdp-top">
            <Link href={`/books?pub=${book.publisher}`} className="brand"><BadgeCheck size={15} /> {publisher}</Link>
            {!priced
              ? <span className="stock ask">Price on request</span>
              : <span className={`stock${book.inStock === false ? " out" : ""}`}>{book.inStock === false ? "Out of stock" : <><Check size={14} /> In stock</>}</span>}
          </div>
          <h1>{book.title}</h1>
          {book.subtitle && <p className="ax-bkd-sub">{book.subtitle}</p>}
          {book.authors && <p className="ax-bkd-by">by <b>{book.authors}</b></p>}
          <RatingLine rating={book.rating} />
          <ul className="ax-bkd-facts" aria-label="About this edition">
            {facts.map(([k, v]) => <li key={k}><small>{k}</small><b>{v}</b></li>)}
          </ul>

          <div className="ax-pdp-price">
            {price === null ? (
              <>
                <div className="now"><b className="por">Price on request</b></div>
                <p className="tax">We'll confirm the latest edition, its price and availability, usually within one business day, before you pay anything.</p>
              </>
            ) : (
              <>
                <div className="now">
                  <b>{formatINR(price)}</b>
                  {off > 0 && mrp !== null && <><s>MRP {formatINR(mrp)}</s><em>{off}% off</em></>}
                </div>
                {off > 0 && mrp !== null && <p className="save">You save {formatINR(mrp - price)}</p>}
                {book.offer && <p className="ax-offer"><BadgePercent size={15} /><span><b>{book.offer.title}</b>: {book.offer.percent}% off{book.offer.endsAt ? `, till ${new Date(book.offer.endsAt - 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</span></p>}
                <p className="tax">{!off && mrp ? `MRP ${formatINR(mrp)} · ` : ""}Inclusive of all taxes</p>
                {book.inStock !== false && <button type="button" className="ax-link ax-watch" onClick={() => setAlertKind("price")}><BellRing size={14} /> Email me if the price drops</button>}
              </>
            )}
          </div>

          {!priced ? (
            <div className="ax-pdp-buy ask">
              <button type="button" className="ax-btn teal lg" onClick={() => setAsk("price")}><MessageSquareText size={18} /> Ask for the price</button>
              <button type="button" className="ax-btn lg" onClick={() => setAsk("bulk")}><Building2 size={18} /> Bulk order</button>
            </div>
          ) : book.inStock !== false ? (
            <div className="ax-pdp-buy">
              <div className="ax-qty" role="group" aria-label="Copies">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One copy less"><Minus size={16} /></button>
                <output aria-live="polite">{qty}</output>
                <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="One copy more"><Plus size={16} /></button>
              </div>
              <button type="button" className="ax-btn teal lg add" onClick={() => add()}><ShoppingCart size={18} /> Add to cart</button>
              <button type="button" className="ax-btn dark lg" onClick={() => add(() => setLocation("/checkout"))}><Zap size={18} /> Buy now</button>
            </div>
          ) : (
            <div className="ax-pdp-oos">This book is out of stock right now. <button type="button" className="ax-link" onClick={() => setAlertKind("stock")}><BellRing size={14} /> Email me when it's back</button> or <Link href={moreHref}>see more {subject ? `${subject.toLowerCase()} ` : ""}books</Link>.</div>
          )}
          <DeliveryCheck price={price} />
          <p className="ax-pdp-bulk">
            Buying for a library or a batch?{" "}
            {inList
              ? <Link href="/medical-colleges#list" className="ax-link"><Library size={14} /> In your college list: open it</Link>
              : <button type="button" className="ax-link" onClick={addToList}><Library size={14} /> Add to your college list</button>}
          </p>

          <ul className="ax-pdp-perks">
            <li><Banknote size={20} /><span><b>{config?.onlinePayments ? "Pay online or cash on delivery" : "Cash on delivery"}</b><small>{config?.onlinePayments ? "UPI, cards and netbanking, or cash at your door" : "Pay in cash when your books arrive"}</small></span></li>
            <li><Truck size={20} /><span><b>{`Free delivery from ${formatINR(FREE_DELIVERY_FROM)}`}</b><small>{formatINR(DELIVERY_FEE)} below that · ships {BUSINESS.dispatch}</small></span></li>
            <li><RotateCcw size={20} /><span><b>{BUSINESS.replacementDays}-day replacement</b><small>If it arrives damaged, misprinted or wrong</small></span></li>
            <li><ShieldCheck size={20} /><span><b>Original edition</b><small>New copies of the {publisher} edition</small></span></li>
          </ul>
        </div>
      </div>

      {/* about, details, delivery */}
      <nav className="ax-wrap ax-pdp-tabs" aria-label="On this page">
        <a href="#about">About this book</a><a href="#specs">Book details</a><a href="#delivery">Delivery & returns</a>
      </nav>
      <section className="ax-wrap ax-pdp-more">
        <div className="ax-pdp-about">
          <h2 id="about">About this book</h2>
          <p className="lead">{book.summary}</p>
          {book.highlights && book.highlights.length > 0 && (
            <ul className="ax-pdp-feats">{book.highlights.map((f) => <li key={f}><Check size={16} /> <span>{f}</span></li>)}</ul>
          )}
          {(places.length > 0 || (book.exams?.length ?? 0) > 0) && (
            <>
              <h3>Useful for</h3>
              <div className="ax-bkd-for">
                {places.map((p) => <Link key={p.key} href={p.href}>{p.label}</Link>)}
                {book.exams?.map((e) => <span key={e}>{e}</span>)}
              </div>
            </>
          )}

          <h2 id="specs">Book details</h2>
          <dl className="ax-pdp-specs">
            {details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </div>
        <aside className="ax-pdp-side" id="delivery">
          <h2>Delivery & returns</h2>
          <dl>
            <div><dt>Payment</dt><dd>{config?.onlinePayments ? "Pay online (UPI, debit and credit cards, netbanking, wallets) or cash on delivery." : "Cash on delivery. Keep the exact amount ready if you can."}</dd></div>
            <div><dt>Delivery</dt><dd>Free on orders from {formatINR(FREE_DELIVERY_FROM)}; {formatINR(DELIVERY_FEE)} below that. Ships {BUSINESS.dispatch}; delivery is {BUSINESS.delivery}.</dd></div>
            <div><dt>Replacement</dt><dd>Tell us within {BUSINESS.replacementDays} days of delivery if a book arrives damaged, misprinted, with missing pages or wrong, and we'll replace it.</dd></div>
            <div><dt>Cancel</dt><dd>Free, any time before it ships.</dd></div>
          </dl>
          <p className="links"><Link href="/shipping-policy">Shipping policy</Link> · <Link href="/returns-policy">Returns & replacement</Link></p>
          <p className="fine">Book details are from {publisher}'s catalogue.</p>
        </aside>
      </section>

      <CustomerReviews productId={book.id} what="book" />

      {together.length > 0 ? (
        <section className="ax-wrap ax-pdp-related ax-bkd-related ax-together">
          <div className="ax-h-title"><h2>Bought together with this</h2></div>
          <div className="ax-grid grid ax-bk-grid">
            {together.map((b) => <BookCard key={b.id} book={b} publisher={bs.publisherName(b.publisher)} />)}
          </div>
        </section>
      ) : setRest && (
        <section className="ax-wrap ax-pdp-related ax-bkd-related ax-together">
          <div className="ax-h-title"><h2>Complete the {setRest.label} set</h2><Link href={setRest.href} className="ax-link">The whole set →</Link></div>
          <div className="ax-grid grid ax-bk-grid">
            {setRest.books.map((b) => <BookCard key={b.id} book={b} publisher={bs.publisherName(b.publisher)} />)}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="ax-wrap ax-pdp-related ax-bkd-related">
          <div className="ax-h-title"><h2>More {subject ? `${subject.toLowerCase()} ` : ""}books</h2><Link href={moreHref} className="ax-link">See all →</Link></div>
          <div className="ax-grid grid ax-bk-grid">
            {related.map((b) => <BookCard key={b.id} book={b} publisher={bs.publisherName(b.publisher)} />)}
          </div>
        </section>
      )}

      {/* phones: price and buttons stay in reach */}
      <div className="ax-pdp-bar">
        {!priced ? (
          <>
            <div><b>Price on request</b><small>{publisher}</small></div>
            <button type="button" className="ax-btn teal" onClick={() => setAsk("price")}><MessageSquareText size={17} /> Ask price</button>
          </>
        ) : book.inStock !== false ? (
          <>
            <div><b>{formatINR(Number(price) * qty)}</b>{qty > 1 ? <small>{qty} × {formatINR(Number(price))}</small> : <small>{config?.onlinePayments ? "Pay online or cash" : "Cash on delivery"}</small>}</div>
            <button type="button" className="ax-btn teal" onClick={() => add()}><ShoppingCart size={17} /> Add</button>
            <button type="button" className="ax-btn dark" onClick={() => add(() => setLocation("/checkout"))}>Buy now</button>
          </>
        ) : (
          <>
            <div><b>Out of stock</b><small>{publisher}</small></div>
            <button type="button" className="ax-btn" onClick={() => setAlertKind("stock")}><BellRing size={16} /> Notify me</button>
          </>
        )}
      </div>

      <EnquiryDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        title={enquiry.title}
        kind={enquiry.kind}
        productId={book.id}
        itemLabel={`${bookName(book)} · ${publisher}`}
        defaultQty={enquiry.qty}
      />
      <AlertDialog
        open={!!alertKind}
        onClose={() => setAlertKind(null)}
        kind={alertKind ?? "stock"}
        productId={book.id}
        itemLabel={`${bookName(book)} · ${publisher}`}
        price={price}
      />
    </div>
  );
}
