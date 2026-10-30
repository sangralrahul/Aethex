/**
 * My orders (/orders): the signed-in account's orders, and orders placed in
 * this browser, newest first; each opens to its progress, items and address.
 * Styles: src/shop.css (.ax-orders, .ax-ov).
 */
import { RemindersPanel } from "@/components/store/StoreExtras2";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Loader2, Package, PackageSearch } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderView, when } from "@/components/store/OrderView";
import { BuyAgainRail } from "@/components/shop/BuyAgain";
import { RecentlyViewed } from "@/components/store/StoreExtras";
import { ProductImage } from "@/components/store/ProductImage";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { getOrder, myOrders, savedOrders, tokenFor, type CustomerOrder } from "@/lib/store/api";
import { STATUS_LABEL } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";
import { loginUrl } from "@/lib/host";

export default function Orders() {
  useSeo({ title: "My orders | Aethex Store", description: "Your Aethex orders.", path: "/orders" });
  const { isLoggedIn } = useUserAuth();
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      const found = new Map<string, CustomerOrder>();
      if (isLoggedIn) {
        try { (await myOrders()).orders.forEach((o) => found.set(o.id, o)); } catch (e) { setNote((e as Error).message); }
      }
      const local = savedOrders().filter((o) => !found.has(o.id)).slice(0, 12);
      const got = await Promise.allSettled(local.map((o) => getOrder(o.id, o.token)));
      got.forEach((g) => { if (g.status === "fulfilled") found.set(g.value.order.id, g.value.order); });
      if (live) {
        const list = Array.from(found.values()).sort((a, b) => b.createdAt - a.createdAt);
        setOrders(list);
        if (list.length === 1) setOpen(list[0].id);
      }
    })();
    return () => { live = false; };
  }, [isLoggedIn]);

  const update = (o: CustomerOrder) => setOrders((list) => (list ?? []).map((x) => (x.id === o.id ? o : x)));
  const counts = useMemo(() => {
    const live = (orders ?? []).filter((o) => o.status !== "cancelled" && o.status !== "delivered").length;
    return live ? `${live} on the way` : "";
  }, [orders]);

  return (
    <div className="ax-cart-page">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "My orders" }]} title="My orders"
        sub={orders?.length ? `${orders.length} order${orders.length === 1 ? "" : "s"}${counts ? ` · ${counts}` : ""}` : undefined}
        right={<Link href="/orders/track" className="ax-btn"><PackageSearch size={16} /> Track an order</Link>} />
      <div className="ax-wrap ax-orders">
        {!isLoggedIn && (
          <p className="ax-orders-note">Showing orders placed in this browser. <a href={loginUrl("/", { next: "/orders" })}>Sign in</a> to see orders from your account on any device.</p>
        )}
        {note && <p className="ax-form-err">{note}</p>}
        <RemindersPanel />
        {orders === null ? (
          <div className="ax-orders-loading"><Loader2 size={22} className="spin" /> Loading your orders…</div>
        ) : orders.length === 0 ? (
          <div className="ax-empty">
            <span className="ic"><Package size={26} /></span>
            <h2>No orders yet</h2>
            <p>Orders you place will appear here. Ordered from another phone or browser? Track it with the order number and your mobile number.</p>
            <div className="acts"><Link href="/shop" className="ax-btn teal">Browse the store</Link><Link href="/orders/track" className="ax-btn">Track an order</Link></div>
          </div>
        ) : (
          <ul className="ax-orders-list">
            {orders.map((o) => (
              <li key={o.id} className={open === o.id ? "open" : ""}>
                <button type="button" className="ax-orders-row" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                  <span className="pics">{o.lines.slice(0, 3).map((l) => <span key={`${l.productId}:${l.variantId ?? ""}`}><ProductImage src={l.image} width={96} /></span>)}</span>
                  <span className="tx"><b>{o.id}</b><small>{when(o.createdAt)} · {o.lines.reduce((s, l) => s + l.qty, 0)} item{o.lines.reduce((s, l) => s + l.qty, 0) === 1 ? "" : "s"}</small></span>
                  <span className={`ax-ov-status s-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <b className="tot">{formatINR(o.total)}</b>
                  <ChevronDown size={18} className="chev" />
                </button>
                {open === o.id && <OrderView order={o} token={tokenFor(o.id)} onChange={update} />}
              </li>
            ))}
          </ul>
        )}
        <BuyAgainRail />
        <RecentlyViewed />
      </div>
    </div>
  );
}
