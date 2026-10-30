/**
 * Update 80: /offers, every sale running now and the coupon codes the store lists publicly (a code is listed only when
 * the admin ticks "Show on the offers page"), with what each covers, until when, and a copy button.
 * Styles: src/shop.css (.ax-offers).
 */
import { useState } from "react";
import { Link } from "wouter";
import { BadgePercent, Check, Clock, Copy, Tag, Ticket } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { useSeo } from "@/hooks/use-seo";
import { useOffersPage } from "@/lib/store/api";
import { couponText } from "@/lib/store/promo";

const until = (ms: number | null | undefined) => (ms ? new Date(ms - 1).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "");

export default function Offers() {
  useSeo({ title: "Offers and coupon codes | Aethex Store", description: "Sales running now on the Aethex Store, and coupon codes you can use at checkout.", path: "/offers" });
  const { data, isLoading } = useOffersPage();
  const [copied, setCopied] = useState("");
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); } catch { /* not allowed */ } setCopied(code); window.setTimeout(() => setCopied(""), 1800); };
  const none = !isLoading && data && !data.offers.length && !data.coupons.length;
  return (
    <div className="ax-cart-page" data-store="offers">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Offers" }]} title="Offers" sub="Sales running now, and codes to use at checkout" />
      <div className="ax-wrap ax-offers">
        {isLoading ? <p className="ax-orders-loading">Loading…</p> : none ? (
          <div className="ax-empty"><span className="ic"><BadgePercent size={26} /></span><h2>No offers right now</h2><p>Check back soon. Free delivery and cash on delivery are always on.</p><Link href="/shop" className="ax-btn teal">Browse the store</Link></div>
        ) : <>
          {data!.coupons.length > 0 && <section>
            <h2><Ticket size={19} /> Coupon codes</h2>
            <div className="grid">{data!.coupons.map((c) => (
              <article key={c.code} className="ax-coupon" data-coupon={c.code}>
                <div className="l"><small>{c.label ?? "Coupon"}</small><b>{c.kind === "percent" ? `${c.value}% off` : `₹${c.value.toLocaleString("en-IN")} off`}</b><p>{couponText(c as never)}</p>
                  {(c.categories.length > 0 || c.brands.length > 0) && <p className="on">On {[...c.categories.map((x) => <Link key={x.slug} href={`/category/${x.slug}`}>{x.name}</Link>), ...c.brands.map((x) => <Link key={x.slug} href={`/brand/${x.slug}`}>{x.name}</Link>)].reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), [])}</p>}
                  {c.endsAt && <p className="end"><Clock size={13} /> Until {until(c.endsAt)}</p>}
                </div>
                <button type="button" className="code" onClick={() => void copy(c.code)} data-copy={c.code}><span>{c.code}</span>{copied === c.code ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
              </article>
            ))}</div>
            <p className="fine">Type the code at checkout. One code per order.</p>
          </section>}
          {data!.offers.length > 0 && <section>
            <h2><Tag size={19} /> Sales running now</h2>
            <div className="grid">{data!.offers.map((o) => (
              <article key={o.id} className="ax-sale" data-offer={o.id}>
                <b>{o.percent}% off</b><span>{o.title}</span>
                <p className="on">{[...o.categories.map((x) => <Link key={x.slug} href={`/category/${x.slug}`}>{x.name}</Link>), ...o.brands.map((x) => <Link key={x.slug} href={`/brand/${x.slug}`}>{x.name}</Link>)].reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), [])}</p>
                {o.endsAt && <p className="end"><Clock size={13} /> Until {until(o.endsAt)}</p>}
                <small>Already taken off the prices: no code needed.</small>
              </article>
            ))}</div>
          </section>}
        </>}
      </div>
    </div>
  );
}
