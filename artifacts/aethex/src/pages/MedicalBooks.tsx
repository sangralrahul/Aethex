/**
 * Medical books (/books): every course from MBBS to AYUSH, in the store's
 * design. Without a course or a search it shows the courses and a few rails;
 * with one it works like the shop: filters (year or degree, subject,
 * publisher, priced), sort, and a grid. The state lives in the address
 * (?course=&group=&subject=&pub=&priced=1&sort=&q=) so any view can be shared.
 * A year or degree also shows its set of standard books (one per subject) to
 * order in one go (components/store/BookSet.tsx, #set); the first view lists
 * the sets. Books come from useBooks() (src/data/store/books.json with the
 * store's prices). Styles: src/shop.css (.ax-shop, .ax-bk, .ax-bset) and the
 * product card.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Activity, ArrowRight, BookOpen, Brain, ChevronLeft, ChevronRight, FlaskConical, GraduationCap, HeartPulse, Layers, Leaf, Library, MessageSquareText,
  Pill, Search as SearchIcon, SlidersHorizontal, Smile, Stethoscope, Target, X, type LucideProps,
} from "lucide-react";
import { ShopHead, type Crumb } from "@/components/shop/ShopHead";
import { TopLayer } from "@/components/shop/TopLayer";
import { BookCard } from "@/components/store/BookCard";
import { BookSetPanel } from "@/components/store/BookSet";
import { bookSet, buyable, setGroups } from "@/lib/store/booksets";
import { EnquiryDialog } from "@/components/store/EnquiryForm";
import { useSeo } from "@/hooks/use-seo";
import { useBooks, type BookStore } from "@/lib/store/api";
import type { Book } from "@/lib/store/types";
import { BOOK_SORTS, countBy, courseCounts, courseIdsOf, indexBooks, recommendRank, searchBooks, sortBooks, type BookSort } from "@/lib/store/books";
import { BOOK_COURSES, courseOf, groupInfo, type CourseIcon } from "@/config/bookCourses";

const PAGE = 30;

export const COURSE_ICONS: Record<CourseIcon, ComponentType<LucideProps>> = {
  stethoscope: Stethoscope, graduation: GraduationCap, brain: Brain, target: Target, heart: HeartPulse, smile: Smile,
  pill: Pill, activity: Activity, leaf: Leaf, flask: FlaskConical,
};

interface View {
  course: string;
  group: string;
  subject: string;
  pubs: string[];
  priced: boolean;
  sort: BookSort;
  q: string;
}

function readView(sp: URLSearchParams): View {
  const sort = sp.get("sort") as BookSort | null;
  return {
    course: sp.get("course") ?? "",
    group: sp.get("group") ?? "",
    subject: sp.get("subject") ?? "",
    pubs: (sp.get("pub") ?? "").split(",").filter(Boolean),
    priced: sp.get("priced") === "1",
    sort: sort && BOOK_SORTS.some((s) => s.id === sort) ? sort : "recommended",
    q: (sp.get("q") ?? "").trim(),
  };
}

function viewUrl(v: View): string {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.course) p.set("course", v.course);
  if (v.group) p.set("group", v.group);
  if (v.subject) p.set("subject", v.subject);
  if (v.pubs.length) p.set("pub", v.pubs.join(","));
  if (v.priced) p.set("priced", "1");
  if (v.sort !== "recommended") p.set("sort", v.sort);
  const s = p.toString();
  return `/books${s ? `?${s}` : ""}`;
}

/* ------------------------------------------------------------------ filters */

function Filters({ v, set, bs, inCourse, inGroup, inSubject, onClear, active }: {
  v: View; set: (p: Partial<View>) => void; bs: BookStore; inCourse: Book[]; inGroup: Book[]; inSubject: Book[]; onClear: () => void; active: boolean;
}) {
  const course = courseOf(v.course);
  const groups = useMemo(() => {
    if (!course) return [];
    const n = countBy(inCourse, (b) => b.placements.map((p) => p.group));
    return course.groups.filter((g) => n.get(g.id)).map((g) => ({ ...g, n: n.get(g.id)! }));
  }, [course, inCourse]);
  const subjects = useMemo(() => {
    const n = countBy(inGroup, (b) => b.placements.filter((p) => (v.group ? p.group === v.group : !course || groupInfo(p.group)?.course.id === course.id)).map((p) => p.subject));
    return Array.from(n.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [inGroup, v.group, course]);
  const pubs = useMemo(() => {
    const n = countBy(inSubject, (b) => [b.publisher]);
    return Array.from(n.entries()).sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, name: bs.publisherName(slug), count }));
  }, [inSubject, bs]);
  const [allPubs, setAllPubs] = useState(false);
  const courses = useMemo(() => courseCounts(inCourse), [inCourse]);

  return (
    <div className="ax-filters-in">
      <div className="ax-f-head">
        <b>Filters</b>
        {active && <button type="button" className="ax-f-clear" onClick={onClear}>Clear all</button>}
      </div>

      <div className="ax-f-sec">
        <label className="ax-switch">
          <input type="checkbox" checked={v.priced} onChange={(e) => set({ priced: e.target.checked })} />
          <span className="track"><i /></span>
          <span>Ready to buy (priced)</span>
        </label>
      </div>

      {!course && (
        <div className="ax-f-sec">
          <h3>Course</h3>
          <div className="ax-f-cats">
            {BOOK_COURSES.filter((c) => courses.get(c.id)).map((c) => (
              <button type="button" key={c.id} onClick={() => set({ course: c.id, group: "", subject: "" })}><span>{c.label}</span><em>{courses.get(c.id)}</em></button>
            ))}
          </div>
        </div>
      )}

      {groups.length > 1 && (
        <div className="ax-f-sec">
          <h3>{course?.id === "mbbs" ? "Year" : "Course"}</h3>
          <div className="ax-f-cats">
            <button type="button" className={!v.group ? "on" : ""} onClick={() => set({ group: "", subject: "" })}><span>All of {course?.label}</span></button>
            {groups.map((g) => (
              <button type="button" key={g.id} className={v.group === g.id ? "on" : ""} onClick={() => set({ group: v.group === g.id ? "" : g.id, subject: "" })}><span>{g.label}</span><em>{g.n}</em></button>
            ))}
          </div>
        </div>
      )}

      {subjects.length > 1 && (
        <div className="ax-f-sec">
          <h3>{v.course === "pg" || v.course === "ss" ? "Specialty" : "Subject"}</h3>
          <div className="ax-f-cats">
            <button type="button" className={!v.subject ? "on" : ""} onClick={() => set({ subject: "" })}><span>All subjects</span></button>
            {subjects.map(([name, n]) => (
              <button type="button" key={name} className={v.subject === name ? "on" : ""} onClick={() => set({ subject: v.subject === name ? "" : name })}><span>{name}</span><em>{n}</em></button>
            ))}
          </div>
        </div>
      )}

      {pubs.length > 1 && (
        <div className="ax-f-sec">
          <h3>Publisher</h3>
          <div className="ax-f-brands">
            {(allPubs ? pubs : pubs.slice(0, 8)).map((p) => (
              <label key={p.slug} className="ax-check">
                <input type="checkbox" checked={v.pubs.includes(p.slug)} onChange={() => set({ pubs: v.pubs.includes(p.slug) ? v.pubs.filter((x) => x !== p.slug) : [...v.pubs, p.slug] })} />
                <span className="box" /> {p.name} <em className="n">{p.count}</em>
              </label>
            ))}
          </div>
          {pubs.length > 8 && <button type="button" className="ax-link ax-f-more" onClick={() => setAllPubs(!allPubs)}>{allPubs ? "Show fewer" : `Show all ${pubs.length} publishers`}</button>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the first view: courses and rails */

function Rail({ title, books, bs, more }: { title: string; books: Book[]; bs: BookStore; more?: { href: string; label: string } }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  if (!books.length) return null;
  return (
    <section className="ax-h-sec ax-bk-rail">
      <div className="ax-wrap">
        <div className="ax-h-title">
          <h2>{title}</h2>
          <div className="ax-h-arrows">
            <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="ax-h-rail" ref={track}>
          {books.map((b) => <BookCard key={b.id} book={b} publisher={bs.publisherName(b.publisher)} />)}
        </div>
        {more && <div className="ax-h-more"><Link href={more.href} className="ax-link">{more.label} <ArrowRight size={16} /></Link></div>}
      </div>
    </section>
  );
}

/** Up to n books, the courses taking turns, best first in each. */
function mixCourses(books: Book[], n: number): Book[] {
  const queues = BOOK_COURSES.map((c) => books.filter((b) => b.placements[0] && groupInfo(b.placements[0].group)?.course.id === c.id).sort((a, b) => recommendRank(b) - recommendRank(a)));
  const out: Book[] = [];
  for (let i = 0; out.length < n && queues.some((q) => i < q.length); i++) for (const q of queues) if (i < q.length && out.length < n) out.push(q[i]);
  return out;
}

/** The years and degrees that have a set of standard books, as cards. */
function SetCards({ bs }: { bs: BookStore }) {
  const sets = useMemo(() => setGroups(bs.books, BOOK_COURSES.flatMap((c) => c.groups.map((g) => g.id))), [bs]);
  if (!sets.length) return null;
  return (
    <section className="ax-h-sec ax-bset-cards">
      <div className="ax-wrap">
        <div className="ax-h-title"><h2>Book sets by year</h2></div>
        <p className="ax-bset-cards-sub">One standard textbook for every subject of the year, ready to order together. Switch any book, or leave out what you have.</p>
        <div className="ax-bset-grid">
          {sets.map((p) => {
            const g = groupInfo(p.group)!;
            const ready = p.subjects.filter((s) => buyable(s.options[0])).length;
            return (
              <Link key={p.group} href={`/books?course=${g.course.id}${g.course.groups.length > 1 ? `&group=${g.group.id}` : ""}#set`} className="ax-bset-card">
                <span className="ic"><Layers size={18} /></span>
                <span className="tx"><b>{p.label}</b><small>{p.subjects.length} subjects{ready ? ` · ${ready} ready to order` : ""}</small></span>
                <ArrowRight size={16} />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Landing({ bs, onAsk }: { bs: BookStore; onAsk: () => void }) {
  const counts = useMemo(() => courseCounts(bs.books), [bs]);
  const standard = useMemo(() => mixCourses(bs.books.filter((b) => b.standard && b.price !== null && b.cover), 16), [bs]);
  const classics = useMemo(() => mixCourses(bs.books.filter((b) => b.standard && b.price === null), 16), [bs]);
  const fresh = useMemo(() => bs.books.filter((b) => (b.year ?? 0) >= 2025 && b.cover && b.price !== null).sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || recommendRank(b) - recommendRank(a)).slice(0, 16), [bs]);
  const exams = useMemo(() => sortBooks(bs.books.filter((b) => b.placements.some((p) => p.group === "exam-pg")), "recommended").slice(0, 16), [bs]);
  return (
    <>
      <section className="ax-h-sec ax-bk-courses">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>Shop by course</h2></div>
          <div className="ax-bk-cgrid">
            {BOOK_COURSES.map((c) => {
              const Icon = COURSE_ICONS[c.icon];
              return (
                <Link key={c.id} href={`/books?course=${c.id}`} className="ax-bk-course">
                  <span className="ic"><Icon size={22} /></span>
                  <span className="tx"><b>{c.label}</b><small>{c.blurb}</small></span>
                  <em>{counts.get(c.id) ?? 0} books</em>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <SetCards bs={bs} />
      <Rail title="Textbooks you can order now" books={standard} bs={bs} more={{ href: "/books?priced=1", label: "All books with a price" }} />
      <Rail title="New editions" books={fresh} bs={bs} more={{ href: "/books?sort=newest", label: "All books, newest first" }} />
      <Rail title="The standard references" books={classics} bs={bs} />
      <Rail title="NEET-PG, INI-CET and FMGE" books={exams} bs={bs} more={{ href: "/books?course=exams", label: "All entrance exam books" }} />
      <section className="ax-wrap ax-bk-help">
        <div>
          <span className="ic"><MessageSquareText size={20} /></span>
          <span><b>Can't find your book?</b><small>Tell us the title, author and edition: we'll find it and tell you the price.</small></span>
          <button type="button" className="ax-btn teal" onClick={onAsk}>Ask for a book</button>
        </div>
        <Link href="/medical-colleges">
          <span className="ic"><Library size={20} /></span>
          <span><b>Buying for a library or a batch?</b><small>Send one list with quantities for a quotation.</small></span>
          <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ page */

export default function MedicalBooks() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const v = useMemo(() => readView(new URLSearchParams(searchString)), [searchString]);
  const { data: bs, isLoading, error, refetch } = useBooks();
  const [text, setText] = useState(v.q);
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState<null | "filter" | "sort">(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => { setText(v.q); }, [v.q]);
  useEffect(() => { setShown(PAGE); }, [searchString]);
  useEffect(() => { document.body.style.overflow = sheet ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [sheet]);

  const set = (p: Partial<View>) => setLocation(viewUrl({ ...v, ...p }));
  const course = courseOf(v.course);
  const group = v.group ? groupInfo(v.group)?.group : undefined;
  const browsing = !!(v.course || v.q || v.priced || v.pubs.length || v.sort !== "recommended" || v.subject);

  const index = useMemo(() => (bs ? indexBooks(bs.books, bs.publisherName) : null), [bs]);
  const base = useMemo(() => (bs && index ? (v.q ? searchBooks(bs.books, index, v.q) : bs.books) : []), [bs, index, v.q]);
  const inCourse = useMemo(() => (v.course ? base.filter((b) => courseIdsOf(b).has(v.course)) : base), [base, v.course]);
  const inGroup = useMemo(() => (v.group ? inCourse.filter((b) => b.placements.some((p) => p.group === v.group)) : inCourse), [inCourse, v.group]);
  const inSubject = useMemo(() => (v.subject
    ? inGroup.filter((b) => b.placements.some((p) => p.subject === v.subject && (v.group ? p.group === v.group : !v.course || groupInfo(p.group)?.course.id === v.course)))
    : inGroup), [inGroup, v.subject, v.group, v.course]);
  const results = useMemo(() => {
    let list = inSubject;
    if (v.pubs.length) list = list.filter((b) => v.pubs.includes(b.publisher));
    if (v.priced) list = list.filter((b) => b.price !== null && !b.priceOnRequest);
    return v.q && v.sort === "recommended" ? list : sortBooks(list, v.sort);
  }, [inSubject, v.pubs, v.priced, v.q, v.sort]);

  const title = v.q ? `Books for “${v.q}”` : v.subject ? `${v.subject} books` : group ? `${group.label} books` : course ? `${course.label} books` : "Medical books";
  // The year's (or the one-degree course's) set of standard books, above its books.
  const setGroup = v.group || (course && course.groups.length === 1 ? course.groups[0].id : "");
  const plan = useMemo(() => (bs && setGroup && !v.q && !v.subject ? bookSet(bs.books, setGroup) : null), [bs, setGroup, v.q, v.subject]);
  useSeo({
    title: `${v.q ? title : course ? `${course.label} books: buy online` : "Medical books for every course"} | Aethex`,
    description: course
      ? `${course.label} textbooks, guides and exam books (${course.blurb}) with the publishers' latest editions. Order online with cash on delivery across India.`
      : "Textbooks, reviews and exam books for MBBS, MD/MS, nursing, dental, pharmacy, physiotherapy, AYUSH and allied health, with the publishers' latest editions and prices.",
    path: "/books",
  });

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Medical books", href: "/books" }];
  if (course) crumbs.push({ label: course.label, href: `/books?course=${course.id}` });
  if (group && course && course.groups.length > 1) crumbs.push({ label: group.short });
  if (v.q) crumbs.push({ label: "Search" });

  const filterCount = (v.group ? 1 : 0) + (v.subject ? 1 : 0) + v.pubs.length + (v.priced ? 1 : 0);
  const active = !!(v.q || filterCount);
  const clearAll = () => set({ group: "", subject: "", pubs: [], priced: false, q: "" });
  const submit = (e: React.FormEvent) => { e.preventDefault(); set({ q: text.trim() }); };
  const total = bs?.books.length ?? 0;
  const priced = useMemo(() => (bs ? bs.books.filter((b) => b.price !== null).length : 0), [bs]);
  const countText = !bs ? "Loading books…" : `${results.length.toLocaleString("en-IN")} book${results.length === 1 ? "" : "s"}`;

  if (error && !bs) {
    return (
      <div className="ax-shop-page">
        <ShopHead crumbs={crumbs} title="Medical books" />
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "40px 0" }}>
          <span className="ic"><BookOpen size={26} /></span>
          <h2>The books didn't load</h2>
          <p>{error.message}</p>
          <div className="acts"><button type="button" className="ax-btn teal" onClick={() => refetch()}>Try again</button></div>
        </div></div>
      </div>
    );
  }

  const filterProps = bs ? { v, set, bs, inCourse, inGroup, inSubject, onClear: clearAll, active } : null;
  const sub = !browsing
    ? <>{bs ? `${total.toLocaleString("en-IN")} books` : "Loading books…"} · textbooks, reviews and exam books for every course, from the publishers' latest editions{bs ? `. ${priced.toLocaleString("en-IN")} with a price, ready to order.` : "."}</>
    : course && !v.q && !group ? <>{course.blurb} <span className="ax-sh-meta">{countText}</span></> : countText;

  return (
    <div className="ax-shop-page ax-books">
      <ShopHead
        crumbs={crumbs}
        title={title}
        sub={sub}
        right={
          <form className="ax-sh-search" role="search" onSubmit={submit}>
            <SearchIcon size={17} aria-hidden="true" />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Title, author, subject or ISBN" aria-label="Search medical books" />
            {text && <button type="button" className="clr" onClick={() => { setText(""); if (v.q) set({ q: "" }); }} aria-label="Clear search"><X size={15} /></button>}
          </form>
        }
      >
        <div className="ax-chips" role="list" aria-label="Courses">
          <button type="button" role="listitem" className={!v.course ? "on" : ""} onClick={() => set({ course: "", group: "", subject: "" })}>All courses</button>
          {BOOK_COURSES.map((c) => (
            <button type="button" role="listitem" key={c.id} className={v.course === c.id ? "on" : ""} onClick={() => set({ course: c.id, group: "", subject: "" })}>{c.label}</button>
          ))}
        </div>
        {course && course.groups.length > 1 && (
          <div className="ax-chips ax-chips-sub" role="list" aria-label={`${course.label} years and degrees`}>
            <button type="button" role="listitem" className={!v.group ? "on" : ""} onClick={() => set({ group: "", subject: "" })}>All</button>
            {course.groups.map((g) => (
              <button type="button" role="listitem" key={g.id} className={v.group === g.id ? "on" : ""} onClick={() => set({ group: g.id, subject: "" })}>{g.short}</button>
            ))}
          </div>
        )}
      </ShopHead>

      {!browsing ? (
        bs ? <Landing bs={bs} onAsk={() => setAsking(true)} /> : (
          <div className="ax-wrap ax-bk-loading"><div className="ax-grid grid">{Array.from({ length: 10 }, (_, k) => <div key={k} className="ax-prod sk" />)}</div></div>
        )
      ) : (
        <div className="ax-wrap ax-shop">
          <aside className="ax-filters" aria-label="Filters">{filterProps && <Filters {...filterProps} />}</aside>
          <div className="ax-results">
            <div className="ax-toolbar">
              <p className="ax-count">{countText}</p>
              <div className="ax-active">
                {v.priced && <button type="button" onClick={() => set({ priced: false })}>Ready to buy <X size={12} /></button>}
                {group && <button type="button" onClick={() => set({ group: "", subject: "" })}>{group.label} <X size={12} /></button>}
                {v.subject && <button type="button" onClick={() => set({ subject: "" })}>{v.subject} <X size={12} /></button>}
                {v.pubs.map((p) => <button type="button" key={p} onClick={() => set({ pubs: v.pubs.filter((x) => x !== p) })}>{bs?.publisherName(p) ?? p} <X size={12} /></button>)}
              </div>
              <label className="ax-sort">
                <span>Sort</span>
                <select value={v.sort} onChange={(e) => set({ sort: e.target.value as BookSort })} aria-label="Sort books">
                  {BOOK_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>

            {isLoading || !bs ? (
              <div className="ax-grid grid">{Array.from({ length: 8 }, (_, k) => <div key={k} className="ax-prod sk" />)}</div>
            ) : results.length === 0 ? (
              <div className="ax-empty">
                <span className="ic"><BookOpen size={26} /></span>
                <h2>No books match</h2>
                <p>{v.q ? "Try the author's surname, a shorter title, or the ISBN. Or ask us for it: we'll find it." : "Try fewer filters, or another course."}</p>
                <div className="acts">
                  {active && <button type="button" className="ax-btn teal" onClick={clearAll}>Clear filters</button>}
                  <button type="button" className="ax-btn" onClick={() => setAsking(true)}>Ask for a book</button>
                </div>
              </div>
            ) : (
              <>
                {plan && <BookSetPanel plan={plan} bs={bs} />}
                <div className="ax-grid grid ax-bk-grid">
                  {results.slice(0, shown).map((b, i) => <BookCard key={b.id} book={b} publisher={bs.publisherName(b.publisher)} eager={i < 5} />)}
                </div>
                {results.length > shown && (
                  <div className="ax-more">
                    <p>Showing {shown} of {results.length.toLocaleString("en-IN")}</p>
                    <button type="button" className="ax-btn" onClick={() => setShown((n) => n + PAGE)}>Show more books</button>
                  </div>
                )}
                <p className="ax-bk-note">Prices are the publishers' own. Can't find a book? <button type="button" className="ax-link" onClick={() => setAsking(true)}>Ask for it</button></p>
              </>
            )}
          </div>
        </div>
      )}

      {browsing && (
        <div className="ax-mbar">
          <button type="button" onClick={() => setSheet("filter")}><SlidersHorizontal size={16} /> Filter{filterCount ? <em>{filterCount}</em> : null}</button>
          <button type="button" onClick={() => setSheet("sort")}>Sort: {BOOK_SORTS.find((s) => s.id === v.sort)?.label}</button>
        </div>
      )}
      {sheet && (
        <TopLayer>
          <div className="ax-sheet" role="dialog" aria-modal="true" aria-label={sheet === "filter" ? "Filters" : "Sort"} onClick={() => setSheet(null)}>
            <div className="ax-sheet-in" onClick={(e) => e.stopPropagation()}>
              <div className="ax-sheet-head">
                <b>{sheet === "filter" ? "Filters" : "Sort by"}</b>
                <button type="button" onClick={() => setSheet(null)} aria-label="Close"><X size={18} /></button>
              </div>
              <div className="ax-sheet-body">
                {sheet === "filter" ? (filterProps && <Filters {...filterProps} />) : (
                  <div className="ax-sort-list">
                    {BOOK_SORTS.map((s) => (
                      <button type="button" key={s.id} className={v.sort === s.id ? "on" : ""} onClick={() => { set({ sort: s.id }); setSheet(null); }}>{s.label}</button>
                    ))}
                  </div>
                )}
              </div>
              {sheet === "filter" && (
                <div className="ax-sheet-foot"><button type="button" className="ax-btn teal" onClick={() => setSheet(null)}>Show {results.length.toLocaleString("en-IN")} book{results.length === 1 ? "" : "s"}</button></div>
              )}
            </div>
          </div>
        </TopLayer>
      )}

      <EnquiryDialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Ask for a book"
        kind="book"
        itemLabel="Tell us the title, author and edition below, and how many copies."
      />
    </div>
  );
}
