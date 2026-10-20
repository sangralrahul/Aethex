/**
 * Track an order (/orders/track): the order number and the mobile number it
 * was placed with show its progress, courier details, and a way to cancel
 * before it ships. Orders placed in this browser open directly.
 * Styles: src/shop.css (.ax-track, .ax-ov).
 */
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Loader2, PackageSearch, Search } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderView } from "@/components/store/OrderView";
import { useSeo } from "@/hooks/use-seo";
import { getOrder, lookupOrder, savedOrders, tokenFor, type CustomerOrder } from "@/lib/store/api";
import { normPhone } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";

export default function OrderTracking() {
  useSeo({ title: "Track your order | Aethex Store", description: "Track an Aethex order with its order number and your mobile number.", path: "/orders/track" });
  const sp = new URLSearchParams(useSearch());
  const [id, setId] = useState((sp.get("order") || "").toUpperCase());
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [usedPhone, setUsedPhone] = useState("");
  const recent = savedOrders().slice(0, 5);

  // An order placed in this browser opens without the phone number.
  useEffect(() => {
    const t = id ? tokenFor(id) : undefined;
    if (!t) return;
    getOrder(id, t).then((r) => setOrder(r.order)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const oid = id.trim().toUpperCase();
    if (!/^AX\d{6}-[A-Z0-9]{6}$/.test(oid)) return setErr("Order numbers look like AX261020-7KQ4MP. You'll find it in your order email or confirmation.");
    const p = normPhone(phone);
    if (!p) return setErr("Enter the 10-digit mobile number you ordered with.");
    setBusy(true);
    try {
      const t = tokenFor(oid);
      const r = t ? await getOrder(oid, t).catch(() => lookupOrder(oid, p)) : await lookupOrder(oid, p);
      setOrder(r.order);
      setUsedPhone(p);
    } catch (e2) {
      setErr((e2 as Error).message);
      setOrder(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ax-cart-page">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Orders", href: "/orders" }, { label: "Track" }]} title="Track your order" sub="Use the order number from your confirmation and the mobile number you ordered with." />
      <div className="ax-wrap ax-track">
        <form className="ax-co-card ax-track-form" onSubmit={submit} noValidate>
          <h2><PackageSearch size={19} /> Find an order</h2>
          <div className="ax-form">
            <label className="f"><span>Order number</span><input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="AX261020-7KQ4MP" autoComplete="off" spellCheck={false} maxLength={20} /></label>
            <label className="f"><span>Mobile number</span><input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={16} /></label>
          </div>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <button type="submit" className="ax-btn teal lg" disabled={busy}>{busy ? <Loader2 size={17} className="spin" /> : <Search size={17} />} Track order</button>
          {recent.length > 0 && !order && (
            <div className="ax-track-recent">
              <small>Ordered in this browser</small>
              {recent.map((o) => (
                <Link key={o.id} href={`/order/${o.id}`}><b>{o.id}</b><span>{new Date(o.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {formatINR(o.total)}</span></Link>
              ))}
            </div>
          )}
        </form>
        {order && <OrderView order={order} token={tokenFor(order.id)} phone={usedPhone || undefined} onChange={setOrder} />}
      </div>
    </div>
  );
}
