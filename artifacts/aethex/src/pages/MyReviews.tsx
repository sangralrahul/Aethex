/**
 * My reviews (/my-reviews): everything the signed-in account has had
 * delivered, with the review written for each (checking, live, or not
 * published) and a way to write or change one. Without signing in, an order
 * can still be reviewed from its page (order tracking with the order number
 * and phone). Data: GET /api/store/my-reviews (worker/store.ts).
 * Styles: src/shop.css (.ax-myrv).
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, MessageSquareQuote, PackageSearch, PenLine } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { ProductImage } from "@/components/store/ProductImage";
import { ReviewDialog, Stars, type ReviewTarget } from "@/components/store/Reviews";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { myReviewables, type ReviewableItem } from "@/lib/store/api";
import { isBookId, itemHref } from "@/lib/store/bookdata";
import { loginUrl } from "@/lib/host";

const STATUS_TEXT = { pending: "We're checking it", approved: "Live on the product page", rejected: "Not published" } as const;

export default function MyReviews() {
  useSeo({ title: "My reviews | Aethex Store", description: "Review what you've bought on Aethex.", path: "/my-reviews" });
  const { isLoggedIn } = useUserAuth();
  const [items, setItems] = useState<ReviewableItem[] | null>(null);
  const [err, setErr] = useState("");
  const [target, setTarget] = useState<ReviewTarget | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let live = true;
    myReviewables().then((r) => { if (live) setItems(r.items); }).catch((e) => { if (live) { setErr((e as Error).message); setItems([]); } });
    return () => { live = false; };
  }, [isLoggedIn]);

  const todo = (items ?? []).filter((i) => !i.review);
  const done = (items ?? []).filter((i) => i.review);
  const open = (i: ReviewableItem) => setTarget({
    orderId: i.orderId, productId: i.productId, name: i.name,
    existing: i.review ? { rating: i.review.rating, title: i.review.title, body: i.review.body, name: i.review.name, city: i.review.city } : undefined,
  });

  const row = (i: ReviewableItem) => (
    <li key={`${i.orderId}:${i.productId}`} className="ax-myrv-item">
      <Link href={itemHref(i.productId, i.slug)} className="img"><ProductImage src={i.image} width={120} book={isBookId(i.productId)} /></Link>
      <div className="tx">
        <small>{i.brand}</small>
        <Link href={itemHref(i.productId, i.slug)} className="nm">{i.name}</Link>
        <span className="meta">Order {i.orderId} · delivered {new Date(i.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        {i.review && (
          <div className="mine">
            <span className={`st s-${i.review.status}`}>{STATUS_TEXT[i.review.status]}</span>
            <Stars value={i.review.rating} size={14} />
            {i.review.title && <b>{i.review.title}</b>}
            <p>{i.review.body}</p>
            {i.review.reply && <p className="reply"><b>Reply from Aethex</b>{i.review.reply}</p>}
          </div>
        )}
      </div>
      <button type="button" className={`ax-btn${i.review ? "" : " teal"}`} onClick={() => open(i)}><PenLine size={15} /> {i.review ? "Change" : "Write a review"}</button>
    </li>
  );

  return (
    <div className="ax-cart-page">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "My reviews" }]} title="My reviews"
        sub={items?.length ? `${todo.length ? `${todo.length} to review · ` : ""}${done.length} written` : undefined} />
      <div className="ax-wrap ax-myrv">
        {!isLoggedIn ? (
          <div className="ax-empty">
            <span className="ic"><MessageSquareQuote size={26} /></span>
            <h2>Review what you've bought</h2>
            <p>Sign in to see everything delivered to you and review it. Ordered without an account? Open the order with its number and your mobile number, and review it from there.</p>
            <div className="acts">
              <a className="ax-btn teal" href={loginUrl("/", { next: "/my-reviews" })}>Sign in</a>
              <Link href="/orders/track" className="ax-btn"><PackageSearch size={16} /> Find an order</Link>
            </div>
          </div>
        ) : items === null ? (
          <div className="ax-orders-loading"><Loader2 size={22} className="spin" /> Loading…</div>
        ) : !items.length ? (
          <div className="ax-empty">
            <span className="ic"><MessageSquareQuote size={26} /></span>
            <h2>Nothing to review yet</h2>
            <p>{err || "Once an order is delivered, its items show up here for you to review."}</p>
            <div className="acts"><Link href="/orders" className="ax-btn teal">My orders</Link></div>
          </div>
        ) : (
          <>
            {todo.length > 0 && <><h2>Waiting for your review</h2><ul className="ax-myrv-list">{todo.map(row)}</ul></>}
            {done.length > 0 && <><h2>Your reviews</h2><ul className="ax-myrv-list">{done.map(row)}</ul></>}
            <p className="fine">Reviews show with the name you choose, never your phone, email or address. We check each one before it appears.</p>
          </>
        )}
      </div>
      <ReviewDialog
        target={target}
        access={{}}
        onClose={() => setTarget(null)}
        onDone={(productId, status, r) => setItems((list) => (list ?? []).map((i) => (i.orderId === target?.orderId && i.productId === productId
          ? { ...i, review: { id: i.review?.id ?? "", productId, rating: r.rating, body: r.body, name: r.name, createdAt: Date.now(), status, ...(r.title ? { title: r.title } : {}), ...(r.city ? { city: r.city } : {}) } }
          : i)))}
      />
    </div>
  );
}
