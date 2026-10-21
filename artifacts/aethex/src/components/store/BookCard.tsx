/**
 * A medical book in lists (the books page, its rails, the shop's search) and
 * its cover. The cover is the publisher's photo; a book without one (or whose
 * photo doesn't load) gets a designed cover with its title, authors and
 * edition, in a colour kept for its subject. The card has one action (add to
 * cart when the book has a price, otherwise ask for the price) and the
 * wishlist heart, like a product card.
 * Styles: src/shop.css (.ax-bk, .ax-bcv) and the product card (.ax-prod).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { Heart, MessageSquareText, ShoppingCart, Star } from "lucide-react";
import type { Book } from "@/lib/store/types";
import { discountPct } from "@/lib/store/rules";
import { bookName } from "@/lib/store/bookdata";
import { cart } from "@/lib/store/cart";
import { coverColour } from "@/config/bookCourses";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatINR } from "@/lib/utils";

/** "A, B, C, D" -> "A, B and others" */
export function shortAuthors(a?: string): string {
  if (!a) return "";
  const parts = a.split(/\s*,\s*|\s+and\s+/).filter(Boolean);
  return parts.length > 2 ? `${parts.slice(0, 2).join(", ")} and others` : parts.join(" and ");
}

export function BookCover({ book, publisher, size = "card", eager = false }: { book: Book; publisher: string; size?: "card" | "large" | "mini"; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [book.cover]);
  if (book.cover && !failed) {
    return (
      <span className={`ax-bcv photo ${size}`}>
        <img src={book.cover} alt="" loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      </span>
    );
  }
  const style = { "--c": coverColour(`${book.placements[0]?.subject ?? ""}${book.publisher}`) } as CSSProperties;
  return (
    <span className={`ax-bcv gen ${size}`} style={style} aria-hidden="true">
      <span className="pub">{publisher}</span>
      <b className="t">{book.title}</b>
      {book.authors && <span className="a">{shortAuthors(book.authors)}</span>}
      <span className="ed">{book.edition ?? "Latest edition"}</span>
    </span>
  );
}

export function BookCard({ book, publisher, eager = false }: { book: Book; publisher: string; eager?: boolean }) {
  const { toast } = useToast();
  const { has, toggle } = useWishlist();
  const saved = has(book.id);
  const href = `/books/${book.slug}`;
  const priced = book.price !== null && !book.priceOnRequest;
  const off = priced ? discountPct(Number(book.price), book.mrp) : 0;
  const add = () => {
    const n = cart.add(book.id, null, 1);
    toast({ title: "Added to cart", description: n > 1 ? `You now have ${n} copies in your cart.` : bookName(book) });
  };

  let action: React.ReactNode;
  if (!priced) {
    action = <Link href={`${href}#ask`} className="add wide" aria-label={`Ask for the price of ${book.title}`}><MessageSquareText size={15} /><span>Ask price</span></Link>;
  } else if (book.inStock === false) {
    action = <span className="oos">Out of stock</span>;
  } else {
    action = <button type="button" className="add" onClick={add} aria-label={`Add ${book.title} to cart`}><ShoppingCart size={15} /></button>;
  }

  return (
    <article className="ax-prod ax-bk" data-book={book.id}>
      <Link href={href} className="img" aria-label={bookName(book)}>
        <BookCover book={book} publisher={publisher} eager={eager} />
        {off >= 5 && <span className="off">{off}% off</span>}
        {book.offer && <span className="sale">{book.offer.title}</span>}
      </Link>
      <button type="button" className={`fav${saved ? " on" : ""}`} onClick={() => { const a = toggle(book.id); toast({ title: a ? "Saved to your wishlist" : "Removed from your wishlist" }); }} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="txt">
        <Link href={href} className="nm">{book.title}</Link>
        {book.authors && <span className="au">{shortAuthors(book.authors)}</span>}
        <span className="ed">{[book.edition, publisher].filter(Boolean).join(" · ")}</span>
        {book.rating && book.rating.count > 0 && <span className="rt" aria-label={`${book.rating.avg.toFixed(1)} out of 5 stars from ${book.rating.count} review${book.rating.count === 1 ? "" : "s"}`}><Star size={13} fill="currentColor" /> {book.rating.avg.toFixed(1)} <em>({book.rating.count})</em></span>}
        <div className={`row${priced ? "" : " ask"}`}>
          {priced ? (
            <span className="pr">{formatINR(Number(book.price))}{off >= 5 && <s>{formatINR(Number(book.mrp))}</s>}</span>
          ) : (
            <span className="pr por">Price on request</span>
          )}
          {action}
        </div>
      </div>
    </article>
  );
}
