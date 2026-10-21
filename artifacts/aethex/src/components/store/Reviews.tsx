/**
 * Reviews from buyers: stars, the rating line under a product's name, the
 * "Customer reviews" section of product and book pages, and the dialog a buyer
 * writes one in (from a delivered order: the order page or /my-reviews).
 * Only buyers of delivered orders can review, and the store approves each
 * review before it shows (worker/store.ts). Styles: src/shop.css (.ax-crv).
 */
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, MessageSquareQuote, ShieldCheck } from "lucide-react";
import { Dialog } from "./Dialog";
import { readContact } from "./EnquiryForm";
import { sendReview, useReviews, type ReviewBody } from "@/lib/store/api";
import type { Rating, Review, ReviewStatus } from "@/lib/store/types";
import { useUserAuth } from "@/hooks/use-user-auth";

const STAR = "M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.11c.08.2.27.33.48.35l5.51.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.18.56l1.28 5.38a.56.56 0 0 1-.84.61l-4.72-2.88a.56.56 0 0 0-.59 0l-4.72 2.88a.56.56 0 0 1-.84-.61l1.28-5.38a.56.56 0 0 0-.18-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.51-.44c.21-.02.4-.15.48-.35z";

/** Five stars filled to the rating (to the tenth). */
export function Stars({ value, size = 16, label }: { value: number; size?: number; label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className="ax-stars" role="img" aria-label={label ?? `${value.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs><linearGradient id={`${id}-${i}`}><stop offset={`${fill * 100}%`} stopColor="#E8A317" /><stop offset={`${fill * 100}%`} stopColor="#E3E7ED" /></linearGradient></defs>
            <path d={STAR} fill={`url(#${id}-${i})`} />
          </svg>
        );
      })}
    </span>
  );
}

/** "4.3 ★★★★☆ (12 reviews)", for under a product's name; nothing until there's an approved review. */
export function RatingLine({ rating, href = "#reviews" }: { rating?: Rating; href?: string }) {
  if (!rating?.count) return null;
  return (
    <a href={href} className="ax-crv-line">
      <b>{rating.avg.toFixed(1)}</b><Stars value={rating.avg} size={15} /><span>{rating.count} review{rating.count === 1 ? "" : "s"}</span>
    </a>
  );
}

const dateText = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** The reviews section of a product or book page (id="reviews"). */
export function CustomerReviews({ productId, what = "product" }: { productId: number; what?: "product" | "book" }) {
  const { data } = useReviews(productId);
  const [all, setAll] = useState(false);
  useEffect(() => setAll(false), [productId]);
  const s = data?.summary;
  const list = data?.reviews ?? [];
  const shown = all ? list : list.slice(0, 6);
  return (
    <section className="ax-wrap ax-crv" id="reviews" aria-labelledby="ax-crv-h">
      <div className="ax-crv-head">
        <h2 id="ax-crv-h">Customer reviews</h2>
        <p><ShieldCheck size={15} /> From buyers of delivered orders, checked before they appear.</p>
      </div>
      {!s?.count ? (
        <div className="ax-crv-none">
          <MessageSquareQuote size={22} />
          <p><b>No reviews yet.</b> Bought this {what}? Once your order is delivered, you can review it from <Link href="/orders">your order</Link> or <Link href="/my-reviews">My reviews</Link>.</p>
        </div>
      ) : (
        <div className="ax-crv-body">
          <div className="ax-crv-sum">
            <b className="avg">{s.avg.toFixed(1)}</b>
            <Stars value={s.avg} size={20} />
            <small>{s.count} review{s.count === 1 ? "" : "s"}</small>
            <ul className="ax-crv-dist" aria-label="How many of each rating">
              {s.dist.map((n, i) => (
                <li key={i}><span>{5 - i} star</span><i><em style={{ width: `${s.count ? (n / s.count) * 100 : 0}%` }} /></i><span>{n}</span></li>
              ))}
            </ul>
            <p className="fine">Bought it? Review it from <Link href="/my-reviews">My reviews</Link> once it's delivered.</p>
          </div>
          <ul className="ax-crv-list">
            {shown.map((r) => <ReviewItem key={r.id} r={r} />)}
            {list.length > shown.length && <li className="more"><button type="button" className="ax-btn" onClick={() => setAll(true)}>Show all {list.length} reviews</button></li>}
          </ul>
        </div>
      )}
    </section>
  );
}

function ReviewItem({ r }: { r: Review }) {
  return (
    <li className="ax-crv-item">
      <div className="top"><Stars value={r.rating} size={15} />{r.title && <b>{r.title}</b>}</div>
      <p className="by"><span>{r.name}{r.city ? `, ${r.city}` : ""}</span> · <CheckCircle2 size={13} /> Verified purchase · {dateText(r.createdAt)}</p>
      <p className="tx">{r.body}</p>
      {r.reply && <p className="reply"><b>Reply from Aethex</b>{r.reply}</p>}
    </li>
  );
}

/** Star buttons for choosing a rating. */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const words = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  return (
    <div className="ax-crv-pick" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n === 1 ? "" : "s"}: ${words[n]}`} className={(hover || value) >= n ? "on" : ""}
          onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}>
          <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
        </button>
      ))}
      <span>{words[hover || value] || "Choose 1 to 5 stars"}</span>
    </div>
  );
}

export type ReviewTarget = { orderId: string; productId: number; name: string; existing?: { rating: number; title?: string; body: string; name: string; city?: string } };

/** Writing (or changing) a review of one item of a delivered order. */
/** "Meera I." (or "Dr Meera I.") from a full name: a first name and an initial, which the buyer can change. */
function shortName(full: string): string {
  const words = full.replace(/^dr\.?\s+/i, "Dr ").trim().split(/\s+/).filter(Boolean);
  const dr = words[0] === "Dr" && words.length > 1;
  const first = dr ? `Dr ${words[1]}` : words[0] ?? "";
  const rest = words.slice(dr ? 2 : 1);
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first;
}

export function ReviewDialog({ target, access, onClose, onDone }: {
  target: ReviewTarget | null; access: { token?: string; phone?: string }; onClose: () => void; onDone: (productId: number, status: ReviewStatus, review: ReviewBody) => void;
}) {
  const { user } = useUserAuth();
  const [f, setF] = useState({ rating: 0, title: "", body: "", name: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const edited = useRef(false);
  useEffect(() => {
    if (!target) return;
    const e = target.existing;
    const c = readContact();
    setF({ rating: e?.rating ?? 0, title: e?.title ?? "", body: e?.body ?? "", name: e?.name ?? shortName(user?.name || c.name || ""), city: e?.city ?? c.city ?? "" });
    edited.current = false;
    setErr(""); setSent(false); setBusy(false);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  // The account can finish loading after the form opens: its name goes in until the buyer types their own.
  useEffect(() => {
    if (!target || target.existing || edited.current || !user?.name) return;
    setF((x) => ({ ...x, name: shortName(user.name) }));
  }, [user?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!target) return null;
  const set = (k: "title" | "body" | "name" | "city") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (k === "name") edited.current = true; setF((x) => ({ ...x, [k]: e.target.value })); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.rating) return setErr("Choose from 1 to 5 stars.");
    if (f.body.trim().length < 20) return setErr("Tell other buyers a little more (at least a sentence).");
    if (f.name.trim().length < 2) return setErr("Add the name to show with your review.");
    setBusy(true);
    try {
      const body: ReviewBody = { orderId: target.orderId, productId: target.productId, rating: f.rating, body: f.body.trim(), name: f.name.trim(), ...(f.title.trim() ? { title: f.title.trim() } : {}), ...(f.city.trim() ? { city: f.city.trim() } : {}) };
      const r = await sendReview(body, access);
      setSent(true);
      onDone(target.productId, r.status, body);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} title={target.existing ? "Change your review" : "Write a review"}>
      {sent ? (
        <div className="ax-enq-done">
          <CheckCircle2 size={30} />
          <h3>Thank you for your review</h3>
          <p>We check every review before it appears, usually within a day or two.</p>
          <button type="button" className="ax-btn teal" onClick={onClose}>Done</button>
        </div>
      ) : (
        <form className="ax-crv-form" onSubmit={submit} noValidate>
          <p className="ax-crv-what">{target.name}</p>
          <StarPicker value={f.rating} onChange={(n) => { setF((x) => ({ ...x, rating: n })); setErr(""); }} />
          <div className="ax-form">
            <label className="f wide"><span>Headline <em>(optional)</em></span><input value={f.title} onChange={set("title")} maxLength={100} placeholder="The most important thing to know" /></label>
            <label className="f wide"><span>Your review</span><textarea value={f.body} onChange={set("body")} rows={5} maxLength={2000} placeholder="What did you like or dislike? How have you used it?" /></label>
            <label className="f"><span>Name to show</span><input value={f.name} onChange={set("name")} maxLength={40} autoComplete="off" /></label>
            <label className="f"><span>City <em>(optional)</em></span><input value={f.city} onChange={set("city")} maxLength={40} /></label>
          </div>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <button type="submit" className="ax-btn teal lg" disabled={busy}>{busy ? <Loader2 size={17} className="spin" /> : null} {target.existing ? "Send the change" : "Send my review"}</button>
          <p className="ax-sum-secure"><ShieldCheck size={13} /> Shown with the name you choose; never your phone, email or address. {target.existing ? "A changed review is checked again before it shows." : "Checked before it appears."}</p>
        </form>
      )}
    </Dialog>
  );
}
