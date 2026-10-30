/**
 * A product (/products/:slug; old /products/:id and /shop/:id links still work):
 * the brand's photos, size or colour, price with MRP or "ask for the price",
 * add to cart and buy now, delivery, cash on delivery and replacement terms,
 * the full description, specifications, size guide and related products.
 * Products for hospitals and medical colleges (categories with the
 * "institution" audience) are quoted: they say so, and can go on the bulk list.
 * Also: stars and reviews from buyers, a sale running on it, the delivery check
 * by PIN code, back-in-stock and price-drop emails, compare, and what buyers
 * bought with it (from real orders).
 * Styles: src/shop.css (.ax-pdp).
 */
import { ReorderRemind } from "@/components/store/StoreExtras2";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { bulkListAt } from "@/lib/portals";
import {
  ArrowLeft, BadgeCheck, BadgePercent, Banknote, BellRing, Building2, Check, ChevronLeft, ChevronRight, ClipboardList, Heart, MessageSquareText, Minus, Package, Plus, Ruler,
  PhoneCall, RotateCcw, Share2, ShieldCheck, ShoppingCart, Truck, Zap,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { AlertDialog } from "@/components/store/AlertDialog";
import { CompareTick, CompareTray } from "@/components/store/CompareTray";
import { DeliveryCheck } from "@/components/store/DeliveryCheck";
import { CustomerReviews, RatingLine } from "@/components/store/Reviews";
import { ProductImage, imageInfo, cropOf } from "@/components/store/ProductImage";
import { Dialog } from "@/components/store/Dialog";
import { EnquiryDialog } from "@/components/store/EnquiryForm";
import { CallbackDialog, WhatsAppButton } from "@/components/shop/MoreWays";
import { AddAllButton } from "@/components/shop/BuyAgain";
import { ProductQA, RecentlyViewed, TogetherBundle } from "@/components/store/StoreExtras";
import { recent } from "@/lib/store/recent";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { useRememberVisit } from "@/lib/lastSeen";
import { useProduct, useStore, useStoreConfig, useTogether } from "@/lib/store/api";
import { cart } from "@/lib/store/cart";
import { isBookId } from "@/lib/store/bookdata";
import { bulk, useBulkLines } from "@/lib/store/bulk";
import { DELIVERY_FEE, discountPct, FREE_DELIVERY_FROM, MAX_QTY, unitFor } from "@/lib/store/rules";
import type { Product } from "@/lib/store/types";
import { BUSINESS, SITE_URL } from "@/config/business";
import { formatINR } from "@/lib/utils";

/** Options picked for you (the first in stock): only a colour or a style. A size, gauge, volume or model is always the buyer's choice. */
const PRESELECT = new Set(["Colour", "Style"]);
/** "size", "model"; "option" for names like "Gauge x length". */
const optionWord = (optionName: string) => (/^[a-z]+$/.test(optionName.toLowerCase()) ? optionName.toLowerCase() : "option");
const chooseText = (optionName: string) => { const w = optionWord(optionName); return `choose ${/^[aeiou]/.test(w) ? "an" : "a"} ${w}`; };

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function structured(p: Product, brandName: string, categoryName: string) {
  const url = `${SITE_URL}/products/${p.slug}`;
  // Photos that need cropping on the page would show the brand's own offer badge in search results.
  const images = p.images.filter((u) => !cropOf(u)).slice(0, 4).map((u) => imageInfo(u, 1000).src);
  const priced = (p.variants ?? []).map((v) => v.price ?? p.price).filter((x): x is number => typeof x === "number");
  const availability = p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const seller = { "@type": "Organization", name: BUSINESS.legalName };
  const product: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Product", name: `${brandName} ${p.name}`, ...(images.length ? { image: images } : {}), description: p.summary,
    brand: { "@type": "Brand", name: brandName }, category: categoryName, url,
  };
  if (p.sku) product.sku = p.sku;
  if (p.model) product.mpn = p.model;
  if (p.countryOfOrigin) product.countryOfOrigin = p.countryOfOrigin;
  if (p.rating?.count) product.aggregateRating = { "@type": "AggregateRating", ratingValue: p.rating.avg, reviewCount: p.rating.count, bestRating: 5, worstRating: 1 };
  if (!p.priceOnRequest && p.price !== null) {
    product.offers = priced.length > 1 && new Set(priced).size > 1
      ? { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...priced), highPrice: Math.max(...priced), offerCount: priced.length, availability, url, seller }
      : { "@type": "Offer", priceCurrency: "INR", price: priced[0] ?? p.price, availability, url, itemCondition: "https://schema.org/NewCondition", seller };
  }
  const crumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 2, name: categoryName, item: `${SITE_URL}/category/${p.category}` },
      { "@type": "ListItem", position: 3, name: p.name, item: url },
    ],
  };
  return [product, crumbs];
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, shopParams] = useRoute("/shop/:id");
  const key = params?.id || shopParams?.id || "";
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { has, toggle } = useWishlist();
  const { data: product, isLoading, error } = useProduct(key);
  const { data: store } = useStore();

  const [vid, setVid] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [needChoice, setNeedChoice] = useState(false);
  const [ask, setAsk] = useState<null | "price" | "bulk">(null);
  const [alertKind, setAlertKind] = useState<null | "stock" | "price">(null);
  const { data: config } = useStoreConfig();
  const { data: togetherIds } = useTogether(product?.id);
  const [sizes, setSizes] = useState(false);
  const [callMe, setCallMe] = useState(false);
  const thumbs = useRef<HTMLDivElement>(null);
  const bulkLines = useBulkLines();

  // Old links by number move to the product's own address; a book's number opens the book's page.
  useEffect(() => {
    if (!product) return;
    if (isBookId(product.id)) setLocation(`/books/${product.slug}`, { replace: true });
    else if (key !== product.slug) setLocation(`/products/${product.slug}`, { replace: true });
  }, [product, key, setLocation]);
  useEffect(() => {
    if (!product) return;
    const vs = product.variants ?? [];
    const firstInStock = vs.find((v) => v.inStock) ?? vs[0];
    setVid(vs.length === 1 ? vs[0].id : vs.length && PRESELECT.has(product.optionName ?? "Option") ? firstInStock?.id ?? null : null);
    setQty(1); setImg(0); setNeedChoice(false);
    if (!isBookId(product.id)) recent.seen(product.id);
    window.scrollTo({ top: 0 });
    if (window.location.hash === "#ask" && product.priceOnRequest) setAsk("price");
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const brandName = product ? store?.brandName(product.brand) ?? "" : "";
  const category = product ? store?.category(product.category) : undefined;
  const categoryName = category?.name ?? "";

  const shareImage = product?.images.find((u) => !cropOf(u));
  useRememberVisit("product", product?.name, `/products/${key}`, brandName || undefined);
  useSeo({
    title: product ? `${brandName} ${product.name}${product.priceOnRequest ? "" : product.price ? ` at ${formatINR(product.price)}` : ""} | Aethex Store` : "Product | Aethex Store",
    description: product ? `${brandName} ${product.name}. ${product.summary}`.slice(0, 160) : "Genuine medical devices from verified brands on Aethex.",
    path: product ? `/products/${product.slug}` : location,
    image: shareImage ? imageInfo(shareImage, 1200).src : undefined,
    type: "product",
  });

  const variants = product?.variants ?? [];
  const variant = variants.find((v) => v.id === vid) ?? null;
  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [...(variant?.image ? [variant.image] : []), ...product.images];
    return Array.from(new Set(list)).slice(0, 8);
  }, [product, variant?.image]);
  useEffect(() => { setImg(0); }, [variant?.image]);

  const related = useMemo(() => {
    if (!product || !store) return [];
    const same = store.products.filter((p) => p.id !== product.id && p.category === product.category);
    const rank = (p: (typeof same)[number]) => (p.subcategory === product.subcategory ? 2 : 0) + (p.brand === product.brand ? 1 : 0) + (p.inStock ? 0.5 : 0);
    return same.sort((a, b) => rank(b) - rank(a)).slice(0, 10); // 2 rows of 5 on wide screens, 2 rows of 4 otherwise (shop.css)
  }, [product, store]);
  // What buyers ordered with it, from real orders (empty until there are some).
  const together = useMemo(() => (store && togetherIds ? togetherIds.map((id) => store.byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x && !x.priceOnRequest).slice(0, 5) : []), [store, togetherIds]);

  if (isLoading || (!product && !error)) {
    return (
      <div className="ax-pdp-page">
        <div className="ax-wrap ax-pdp ax-pdp-loading" aria-busy="true">
          <div className="sk ax-pdp-sk-img" /><div><div className="sk l1" /><div className="sk l2" /><div className="sk l3" /></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="ax-pdp-page">
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "48px 0" }}>
          <span className="ic"><Package size={26} /></span>
          <h2>This product isn't available</h2>
          <p>It may have been removed, or the link is incomplete.</p>
          <div className="acts"><Link href="/shop" className="ax-btn teal"><ArrowLeft size={16} /> Back to the store</Link></div>
        </div></div>
      </div>
    );
  }

  const unit = unitFor(product, variant?.id ?? (variants.length ? null : null));
  const priceShown = typeof unit === "object" ? unit.price : null;
  const mrpShown = typeof unit === "object" ? unit.mrp : null;
  const fromPrices = variants.map((v) => v.price ?? product.price).filter((x): x is number => typeof x === "number");
  const lowest = fromPrices.length ? Math.min(...fromPrices) : product.price;
  const off = priceShown !== null ? discountPct(priceShown, mrpShown) : 0;
  const saved = has(product.id);
  const optionName = product.optionName ?? "Option";
  const canBuy = !product.priceOnRequest && product.inStock && (!variant || variant.inStock);
  const hygiene = product.returns === "replacement";
  // Hospital and college ranges: quoted, and kept on the bulk list of /hospitals or /medical-colleges.
  const inst = category?.audience === "institution";
  const listPage = ["anatomy-models", "skills-simulators", "lab-equipment"].includes(product.category) ? "/medical-colleges" : "/hospitals";
  const listAt = bulkListAt(listPage, `/products/${product.slug}`);
  const listed = bulkLines.find((l) => l.productId === product.id && (l.variantId ?? null) === (variant?.id ?? null));
  const addToList = () => {
    if (variants.length > 1 && !variant) { setNeedChoice(true); document.getElementById("ax-pick")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!bulk.put(product.id, variant?.id ?? null, listed ? listed.qty : Math.max(qty, 5))) {
      toast({ variant: "destructive", title: "Your bulk list is full", description: "Send it for a quotation first, or remove something from it." });
      return;
    }
    toast({ title: "Added to your bulk list", description: "Change the quantities on the list before you send it for a quotation." });
  };

  const add = (then?: () => void) => {
    if (variants.length > 1 && !variant) { setNeedChoice(true); document.getElementById("ax-pick")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const u = unitFor(product, variant?.id ?? null);
    if (typeof u !== "object") { toast({ variant: "destructive", title: u === "out-of-stock" ? "This is out of stock" : "This can't be added right now" }); return; }
    cart.add(product.id, variant?.id ?? null, qty);
    if (then) then();
    else toast({ title: "Added to cart", description: `${product.name}${variant ? ` (${variant.label})` : ""}${qty > 1 ? ` × ${qty}` : ""}` });
  };

  const share = async () => {
    const url = `${SITE_URL}/products/${product.slug}`;
    try {
      if (navigator.share) { await navigator.share({ title: `${brandName} ${product.name}`, url }); return; }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch { /* cancelled */ }
  };

  const specs: [string, React.ReactNode][] = [
    ["Brand", <Link key="b" href={`/brand/${product.brand}`}>{brandName}</Link>],
  ];
  if (product.model) specs.push(["Model", product.model]);
  if (variant?.sku || product.sku) specs.push(["Item code", variant?.sku || product.sku]);
  specs.push(["Category", <Link key="c" href={`/category/${product.category}`}>{categoryName}</Link>]);
  if (product.subcategory) specs.push(["Type", product.subcategory]);
  for (const [k, v] of product.specs ?? []) specs.push([k, v]);
  if (product.inTheBox) specs.push(["In the box", product.inTheBox]);
  specs.push(["Warranty", product.warranty || "Manufacturer's warranty, as stated on the pack"]);
  if (product.manufacturer) specs.push(["Manufacturer", product.manufacturer]);
  specs.push(["Country of origin", product.countryOfOrigin || "As printed on the pack"]);
  specs.push(["Sold by", BUSINESS.legalName]);

  const cur = gallery[Math.min(img, gallery.length - 1)] ?? product.images[0];
  const curInfo = cur ? imageInfo(cur, 1000) : null;
  const ld = structured(product, brandName, categoryName);

  return (
    <div className="ax-pdp-page">
      {ld.map((d, i) => <JsonLd key={i} data={d} />)}
      <div className="ax-wrap">
        <nav className="ax-crumbs ax-pdp-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
          <Link href={`/category/${product.category}`}>{categoryName || "Category"}</Link>
          <span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
        </nav>
      </div>

      <div className="ax-wrap ax-pdp">
        {/* photos */}
        <div className="ax-pdp-gallery">
          <div
            className={`ax-pdp-img${zoom ? " zoom" : ""}`}
            onMouseMove={(e) => { if (window.matchMedia("(hover: hover)").matches) { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); } }}
            onMouseLeave={() => setZoom(null)}
          >
            <ProductImage src={cur} alt={`${brandName} ${product.name}`} width={1000} eager
              style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: `${curInfo?.crop ? `translateY(${curInfo.crop.shift}%) ` : ""}scale(2)` } : undefined} />
            {off >= 5 && <span className="badge off">{off}% off</span>}
            {product.featured && <span className="badge pick">Popular</span>}
            {gallery.length > 1 && (
              <>
                <button type="button" className="ax-pdp-nav prev" onClick={() => setImg((i) => (i - 1 + gallery.length) % gallery.length)} aria-label="Previous photo"><ChevronLeft size={18} /></button>
                <button type="button" className="ax-pdp-nav next" onClick={() => setImg((i) => (i + 1) % gallery.length)} aria-label="Next photo"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="ax-pdp-thumbs" ref={thumbs} role="list" aria-label="Photos">
              {gallery.map((g, i) => (
                <button key={g} type="button" role="listitem" className={i === img ? "on" : ""} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} aria-current={i === img}>
                  <ProductImage src={g} width={160} />
                </button>
              ))}
            </div>
          )}
          <div className="ax-pdp-tools">
            <button type="button" className={saved ? "on" : ""} onClick={() => { const a = toggle(product.id); toast({ title: a ? "Saved to your wishlist" : "Removed from your wishlist" }); }} aria-pressed={saved}>
              <Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save to wishlist"}
            </button>
            <button type="button" onClick={share}><Share2 size={16} /> Share</button>
            {!inst && <CompareTick id={product.id} name={product.name} />}
          </div>
        </div>

        {/* buy box */}
        <div className="ax-pdp-info">
          <div className="ax-pdp-top">
            <Link href={`/brand/${product.brand}`} className="brand"><BadgeCheck size={15} /> {brandName}</Link>
            {product.priceOnRequest
              ? <span className="stock ask">Price on request</span>
              : <span className={`stock${canBuy || (!variant && product.inStock) ? "" : " out"}`}>{product.inStock && (!variant || variant.inStock) ? <><Check size={14} /> In stock</> : "Out of stock"}</span>}
          </div>
          <h1>{product.name}</h1>
          {(product.model || product.subcategory) && <p className="ax-pdp-model">{[product.model ? `Model ${product.model}` : "", product.subcategory].filter(Boolean).join(" · ")}</p>}
          <RatingLine rating={product.rating} />

          <div className="ax-pdp-price">
            {product.priceOnRequest ? (
              <>
                <div className="now"><b className="por">Price on request</b></div>
                <p className="tax">{inst
                  ? "We quote each order for the quantity you need, with delivery to your address, before you pay anything."
                  : `${brandName} doesn't publish prices for India, so we quote each order: you get today's price before you pay anything.`}</p>
              </>
            ) : (
              <>
                <div className="now">
                  {priceShown !== null ? <b>{formatINR(priceShown)}</b> : <b>{fromPrices.length > 1 && new Set(fromPrices).size > 1 ? <><small>From </small>{formatINR(Number(lowest))}</> : formatINR(Number(lowest))}</b>}
                  {priceShown !== null && off > 0 && <><s>MRP {formatINR(Number(mrpShown))}</s><em>{off}% off</em></>}
                </div>
                {priceShown !== null && off > 0 && <p className="save">You save {formatINR(Number(mrpShown) - priceShown)}</p>}
                {product.offer && <p className="ax-offer"><BadgePercent size={15} /><span><b>{product.offer.title}</b>: {product.offer.percent}% off{product.offer.endsAt ? `, till ${new Date(product.offer.endsAt - 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</span></p>}
                <p className="tax">{priceShown !== null && !off && mrpShown ? `MRP ${formatINR(mrpShown)} · ` : ""}Inclusive of all taxes</p>
                {product.inStock && !inst && <button type="button" className="ax-link ax-watch" onClick={() => setAlertKind("price")}><BellRing size={14} /> Email me if the price drops</button>}
              </>
            )}
          </div>

          {variants.length > 1 && (
            <div className={`ax-pick${needChoice ? " need" : ""}`} id="ax-pick">
              <div className="ax-pick-head">
                <span>{optionName}: <b>{variant ? variant.label : <em>{chooseText(optionName)}</em>}</b></span>
                {product.sizeGuide && <button type="button" className="ax-link" onClick={() => setSizes(true)}><Ruler size={15} /> Size guide</button>}
              </div>
              <div className="ax-pick-opts" role="radiogroup" aria-label={optionName}>
                {variants.map((v) => {
                  const vp = v.price ?? product.price;
                  const differs = !product.priceOnRequest && fromPrices.length > 1 && new Set(fromPrices).size > 1 && typeof vp === "number";
                  return (
                    <button key={v.id} type="button" role="radio" aria-checked={vid === v.id} className={`${vid === v.id ? "on" : ""}${v.inStock ? "" : " oos"}`}
                      onClick={() => { setVid(v.id); setNeedChoice(false); }} title={v.inStock ? undefined : "Out of stock"}>
                      <span>{v.label}</span>{differs && <small>{formatINR(vp as number)}</small>}
                    </button>
                  );
                })}
              </div>
              {needChoice && <p className="ax-pick-err" role="alert">Please {chooseText(optionName)} first.</p>}
              {variant && !variant.inStock && <p className="ax-pick-err">This {optionWord(optionName)} is out of stock right now.</p>}
            </div>
          )}
          {product.colourNote && <p className="ax-pdp-note">{product.colourNote}</p>}

          {product.priceOnRequest ? (
            <div className="ax-pdp-buy ask">
              <button type="button" className="ax-btn teal lg" onClick={() => setAsk("price")}><MessageSquareText size={18} /> Ask for the price</button>
              <button type="button" className="ax-btn lg" onClick={() => setAsk("bulk")}><Building2 size={18} /> Bulk order</button>
            </div>
          ) : product.inStock ? (
            <div className="ax-pdp-buy">
              <div className="ax-qty" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One less"><Minus size={16} /></button>
                <output aria-live="polite">{qty}</output>
                <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="One more"><Plus size={16} /></button>
              </div>
              <button type="button" className="ax-btn teal lg add" onClick={() => add()} disabled={!!variant && !variant.inStock}><ShoppingCart size={18} /> Add to cart</button>
              <button type="button" className="ax-btn dark lg" onClick={() => add(() => setLocation("/checkout"))} disabled={!!variant && !variant.inStock}><Zap size={18} /> Buy now</button>
            </div>
          ) : (
            <div className="ax-pdp-oos">This is out of stock right now. <button type="button" className="ax-link" onClick={() => setAlertKind("stock")}><BellRing size={14} /> Email me when it's back</button> or <Link href={`/category/${product.category}`}>see similar products</Link>.</div>
          )}
          {!product.priceOnRequest && product.inStock && (
            <div className="ax-pdp-alt">
              <WhatsAppButton className="ax-link ax-wa-link" text={`Hello ${BUSINESS.brand}, I'd like to order ${brandName} ${product.name}${variant ? ` (${variant.label})` : ""} × ${qty}.\n${SITE_URL}/products/${product.slug}`} />
              <button type="button" className="ax-link" onClick={() => setCallMe(true)}><PhoneCall size={14} /> Call me to order</button>
            </div>
          )}
          {!inst && <DeliveryCheck price={priceShown ?? (typeof lowest === "number" ? lowest : null)} />}
          {!inst && !product.priceOnRequest && <ReorderRemind productId={product.id} variantId={variant?.id ?? (variants.length === 1 ? variants[0]!.id : null)} name={`${brandName} ${product.name}`} />}
          {inst ? (
            <p className="ax-pdp-bulk">
              Ordering for a hospital or college?{" "}
              {!listAt.here
                ? <a href={listAt.there} className="ax-link"><ClipboardList size={14} /> Build a bulk list on Aethex {listPage === "/hospitals" ? "for Hospitals" : "for Medical Colleges"}</a>
                : listed
                ? <a href={listAt.list} className="ax-link"><ClipboardList size={14} /> On your bulk list: open it</a>
                : <button type="button" className="ax-link" onClick={addToList}><ClipboardList size={14} /> Add to your bulk list</button>}
            </p>
          ) : !product.priceOnRequest && product.inStock && <p className="ax-pdp-bulk">Buying for a clinic or hospital? <button type="button" className="ax-link" onClick={() => setAsk("bulk")}>Ask for a bulk price</button></p>}

          <ul className="ax-pdp-perks">
            {inst ? (
              <>
                <li><Building2 size={20} /><span><b>Quoted for your order</b><small>Price and delivery confirmed before you pay</small></span></li>
                <li><Truck size={20} /><span><b>Delivered to your institution</b><small>Across India; the delivery charge is in the quotation</small></span></li>
              </>
            ) : (
              <>
                <li><Banknote size={20} /><span><b>{config?.onlinePayments ? "Pay online or cash on delivery" : "Cash on delivery"}</b><small>{config?.onlinePayments ? "UPI, cards and netbanking, or cash at your door" : "Pay in cash when your order arrives"}</small></span></li>
                <li><Truck size={20} /><span><b>{`Free delivery from ${formatINR(FREE_DELIVERY_FROM)}`}</b><small>{formatINR(DELIVERY_FEE)} below that · ships {BUSINESS.dispatch}</small></span></li>
              </>
            )}
            <li><RotateCcw size={20} /><span><b>{BUSINESS.replacementDays}-day replacement</b><small>If it arrives damaged, defective or wrong</small></span></li>
            <li><ShieldCheck size={20} /><span><b>Genuine {brandName}</b><small>{product.warranty || "With the manufacturer's warranty"}</small></span></li>
          </ul>
        </div>
      </div>

      {/* about, specifications, size guide, delivery */}
      <nav className="ax-wrap ax-pdp-tabs" aria-label="On this page">
        <a href="#about">Overview</a><a href="#specs">Specifications</a>{product.sizeGuide && <a href="#sizes">Size guide</a>}<a href="#delivery">Delivery & returns</a>
      </nav>
      <section className="ax-wrap ax-pdp-more">
        <div className="ax-pdp-about">
          <h2 id="about">About this product</h2>
          <p className="lead">{product.summary}</p>
          {product.features.length > 0 && (
            <ul className="ax-pdp-feats">{product.features.map((f) => <li key={f}><Check size={16} /> <span>{f}</span></li>)}</ul>
          )}
          {product.longDescription && <p>{product.longDescription}</p>}
          {product.sections && product.sections.length > 0 && (
            <div className="ax-pdp-secs">
              {product.sections.map((s) => <div key={s.title}><h3>{s.title}</h3><p>{s.text}</p></div>)}
            </div>
          )}

          <h2 id="specs">Specifications</h2>
          <dl className="ax-pdp-specs">
            {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>

          {product.sizeGuide && (
            <>
              <h2 id="sizes">Size guide</h2>
              <SizeTable guide={product.sizeGuide} />
            </>
          )}
        </div>
        <aside className="ax-pdp-side" id="delivery">
          <h2>Delivery & returns</h2>
          <dl>
            {inst ? (
              <>
                <div><dt>Payment</dt><dd>After you accept the quotation, by bank transfer or against your purchase order.</dd></div>
                <div><dt>Delivery</dt><dd>To your hospital, college or clinic anywhere in India. The delivery charge and time for your address are in the quotation.</dd></div>
              </>
            ) : (
              <>
                <div><dt>Payment</dt><dd>{config?.onlinePayments ? "Pay online (UPI, debit and credit cards, netbanking, wallets) or cash on delivery." : "Cash on delivery. Keep the exact amount ready if you can."}</dd></div>
                <div><dt>Delivery</dt><dd>Free on orders from {formatINR(FREE_DELIVERY_FROM)}; {formatINR(DELIVERY_FEE)} below that. Ships {BUSINESS.dispatch}; delivery is {BUSINESS.delivery}.</dd></div>
              </>
            )}
            <div><dt>Replacement</dt><dd>Tell us within {BUSINESS.replacementDays} days of delivery if it arrives damaged, defective or wrong, and we'll replace it.{hygiene ? " For hygiene reasons it can't be returned once opened or used unless it's faulty." : ""}</dd></div>
            <div><dt>Cancel</dt><dd>Free, any time before it ships.</dd></div>
          </dl>
          <p className="links"><Link href="/shipping-policy">Shipping policy</Link> · <Link href="/returns-policy">Returns & replacement</Link></p>
          <p className="fine">Product details are from {brandName}. For medical devices, read the instructions for use, and ask your doctor about readings or symptoms.</p>
        </aside>
      </section>

      {store?.byId.get(product.id) && !inst && <TogetherBundle product={store.byId.get(product.id)!} fromOrders={together} />}

      <CustomerReviews productId={product.id} />

      <ProductQA productId={product.id} productName={`${brandName} ${product.name}`} />

      {together.length > 0 && store && (
        <section className="ax-wrap ax-pdp-related ax-together">
          <div className="ax-h-title"><h2>Bought together with this</h2><AddAllButton items={[...(store.byId.get(product.id) ? [store.byId.get(product.id)!] : []), ...together]} label="Add all to cart" className="ax-btn" /></div>
          <div className="ax-grid grid">
            {together.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
          </div>
        </section>
      )}

      {related.length > 0 && store && (
        <section className="ax-wrap ax-pdp-related">
          <div className="ax-h-title"><h2>More {categoryName.toLowerCase()}</h2><Link href={`/category/${product.category}`} className="ax-link">See all →</Link></div>
          <div className="ax-grid grid">
            {related.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
          </div>
        </section>
      )}

      <div className="ax-wrap"><RecentlyViewed exclude={product.id} /></div>

      {/* phones: price and buttons stay in reach */}
      <div className="ax-pdp-bar">
        {product.priceOnRequest ? (
          <>
            <div><b>Price on request</b><small>{brandName}</small></div>
            <button type="button" className="ax-btn teal" onClick={() => setAsk("price")}><MessageSquareText size={17} /> Ask price</button>
          </>
        ) : product.inStock ? (
          <>
            <div><b>{formatINR((priceShown ?? Number(lowest)) * qty)}</b>{qty > 1 ? <small>{qty} × {formatINR(priceShown ?? Number(lowest))}</small> : <small>{config?.onlinePayments ? "Pay online or cash" : "Cash on delivery"}</small>}</div>
            <button type="button" className="ax-btn teal" onClick={() => add()}><ShoppingCart size={17} /> Add</button>
            <button type="button" className="ax-btn dark" onClick={() => add(() => setLocation("/checkout"))}>Buy now</button>
          </>
        ) : (
          <>
            <div><b>Out of stock</b><small>{brandName}</small></div>
            <button type="button" className="ax-btn" onClick={() => setAlertKind("stock")}><BellRing size={16} /> Notify me</button>
          </>
        )}
      </div>

      <EnquiryDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        title={ask === "bulk" ? "Bulk order" : product.priceOnRequest ? "Ask for the price" : "Tell me when it's back"}
        kind={ask === "bulk" ? "bulk" : "price"}
        productId={product.id}
        variantId={variant?.id ?? null}
        itemLabel={`${brandName} ${product.name}${variant ? ` · ${variant.label}` : ""}`}
        defaultQty={ask === "bulk" ? 10 : qty}
      />
      <AlertDialog
        open={!!alertKind}
        onClose={() => setAlertKind(null)}
        kind={alertKind ?? "stock"}
        productId={product.id}
        variantId={variant?.id ?? null}
        itemLabel={`${brandName} ${product.name}${variant ? ` · ${variant.label}` : ""}`}
        price={priceShown ?? (typeof lowest === "number" ? lowest : null)}
      />
      <CallbackDialog open={callMe} onClose={() => setCallMe(false)} productId={product.id} variantId={variant?.id ?? null} qty={qty} itemLabel={`${brandName} ${product.name}${variant ? ` · ${variant.label}` : ""} × ${qty}`} />
      <CompareTray />
      {product.sizeGuide && (
        <Dialog open={sizes} onClose={() => setSizes(false)} title="Size guide" wide>
          <SizeTable guide={product.sizeGuide} />
        </Dialog>
      )}
    </div>
  );
}

function SizeTable({ guide }: { guide: NonNullable<Product["sizeGuide"]> }) {
  return (
    <div className="ax-size">
      {guide.how && <p>{guide.how}</p>}
      <div className="ax-size-scroll">
        <table>
          <thead><tr>{guide.header.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{guide.rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
