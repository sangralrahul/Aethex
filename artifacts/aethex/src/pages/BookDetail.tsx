/**
 * A book in the library (/books/:slug): title, edition, author, publisher, the
 * course and exams it's for, and a request (we confirm the edition, price and
 * availability), with the other books for the same subject.
 * Styles: src/shop.css (.ax-book).
 */
import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, BookMarked, BookOpen, Building2, GraduationCap, Share2 } from "lucide-react";
import { EnquiryForm } from "@/components/store/EnquiryForm";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { CURRICULUM, type CurrBook, type Degree } from "@/data/curriculumBooks";
import { SITE_URL } from "@/config/business";

export function bookSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
const title = (name: string) => name.replace(/\s+\d+(?:st|nd|rd|th)\s+Ed(?:ition)?.*$/i, "");

function findBook(slug: string): { book: CurrBook; degree: Degree; yearLabel: string; subjectName: string; subjectColor: string; siblings: CurrBook[] } | null {
  for (const deg of CURRICULUM) {
    for (const year of deg.years) {
      for (const subj of year.subjects) {
        for (const book of subj.books) {
          if (bookSlug(book.name) === slug) {
            return { book, degree: deg, yearLabel: year.label, subjectName: subj.name, subjectColor: subj.color || deg.color, siblings: subj.books.filter((b) => b !== book) };
          }
        }
      }
    }
  }
  return null;
}

export default function BookDetail() {
  const [, params] = useRoute("/books/:slug");
  const slug = params?.slug || "";
  const found = useMemo(() => findBook(slug), [slug]);
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  useSeo({
    title: found ? `${title(found.book.name)} (${found.book.edition}) by ${found.book.author} | Aethex` : "Book | Aethex",
    description: found ? `${title(found.book.name)}, ${found.book.edition}, by ${found.book.author} (${found.book.publisher}). For ${found.degree.label}: ${found.subjectName}. Request it and we'll confirm the price and availability.` : "Medical textbooks on request.",
    path: `/books/${slug}`,
  });

  if (!found) {
    return (
      <div className="ax-shop-page">
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "48px 0" }}>
          <span className="ic"><BookOpen size={26} /></span>
          <h2>Book not found</h2>
          <p>This book may have been removed, or the link is incomplete.</p>
          <div className="acts"><Link href="/books" className="ax-btn teal"><ArrowLeft size={16} /> All medical books</Link></div>
        </div></div>
      </div>
    );
  }

  const { book, degree, yearLabel, subjectName, subjectColor, siblings } = found;
  const share = async () => {
    const url = `${SITE_URL}/books/${slug}`;
    try {
      if (navigator.share) { await navigator.share({ title: title(book.name), url }); return; }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch { /* cancelled */ }
  };
  const details: [string, string][] = [
    ["Author", book.author], ["Publisher", book.publisher], ["Edition", book.edition],
    ["Course", degree.label], ["Year or specialty", yearLabel], ["Subject", subjectName],
  ];
  if (book.forExam?.length) details.push(["Useful for", book.forExam.join(", ")]);

  return (
    <div className="ax-shop-page">
      <div className="ax-wrap">
        <nav className="ax-crumbs ax-pdp-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/books">Medical books</Link><span aria-hidden="true">/</span>
          <span>{degree.label}</span><span aria-hidden="true">/</span>
          <span aria-current="page">{title(book.name)}</span>
        </nav>
      </div>
      <div className="ax-wrap ax-book">
        <div className="ax-book-cover" style={{ background: `linear-gradient(160deg, ${subjectColor}EE, ${subjectColor}99)` }}>
          <BookOpen size={44} />
          <b>{title(book.name)}</b>
          <span>{book.author}</span>
          <em>{book.edition}</em>
        </div>
        <div className="ax-book-info">
          <div className="tags">
            <span style={{ color: subjectColor, background: `${subjectColor}16` }}><GraduationCap size={14} /> {subjectName}</span>
            <span>{degree.label}</span>
            {book.featured && <span className="std">Standard text</span>}
          </div>
          <h1>{title(book.name)}</h1>
          <p className="by">{book.edition} · by <b>{book.author}</b> · <Building2 size={14} /> {book.publisher}</p>
          <dl className="ax-pdp-specs">
            {details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <button type="button" className="ax-link" onClick={share}><Share2 size={15} /> Share this book</button>
        </div>
        <aside className="ax-book-req">
          <h2><BookMarked size={19} /> {sent ? "Request sent" : "Request this book"}</h2>
          <EnquiryForm kind="book" item={`${title(book.name)} (${book.edition}) by ${book.author}, ${book.publisher}`} onDone={() => setSent(true)} />
        </aside>
      </div>

      {siblings.length > 0 && (
        <section className="ax-wrap ax-book-more">
          <div className="ax-h-title"><h2>More for {subjectName}</h2><Link href="/books" className="ax-link">All books →</Link></div>
          <ul>
            {siblings.slice(0, 12).map((b) => (
              <li key={b.name}>
                <Link href={`/books/${bookSlug(b.name)}`}>
                  <span className="spine" style={{ background: subjectColor }} />
                  <span><b>{title(b.name)}</b><small>{b.edition} · {b.author}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
