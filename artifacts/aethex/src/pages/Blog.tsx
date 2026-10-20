import { useState, useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import { Link, useSearch } from "wouter";
import { Search, Clock, Eye, Rss, ChevronLeft, ChevronRight, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Clinical Tips", "NEET-PG Prep", "Medical News", "Product Guides", "Doctor Life", "Research & Studies"];
const CATEGORY_COLORS: Record<string, string> = {
  "Clinical Tips": "bg-blue-100 text-blue-700",
  "NEET-PG Prep": "bg-violet-100 text-violet-700",
  "Medical News": "bg-rose-100 text-rose-700",
  "Product Guides": "bg-emerald-100 text-emerald-700",
  "Doctor Life": "bg-amber-100 text-amber-700",
  "Research & Studies": "bg-cyan-100 text-cyan-700",
};

const apiBase = () => import.meta.env.BASE_URL.replace(/\/$/, "");

function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); (metaDesc as HTMLMetaElement).name = "description"; document.head.appendChild(metaDesc); }
    (metaDesc as HTMLMetaElement).content = description;
  }, [title, description]);
}

function NewsletterForm({ source = "blog" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/newsletter/subscribe`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Subscription failed"); return; }
      setDone(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" /> Subscribed! Welcome to Aethex Insights.</div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)"
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
      {error && <p className="text-rose-500 text-xs">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Subscribe Free
      </button>
    </form>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useSEO("Medical Blog — Insights, News & Study Tips | Aethex", "Read the latest medical news, NEET-PG study tips, clinical insights, and product guides from Aethex's expert team of Indian doctors.");

  const fetchPosts = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "9" });
    if (category !== "All") params.append("category", category);
    if (search) params.append("search", search);
    fetch(`${apiBase()}/api/blog/posts?${params}`)
      .then(r => r.json()).then(d => {
        setPosts(d.posts ?? []);
        setPopular(d.popular ?? []);
        setTotalPages(d.pages ?? 1);
        setTotal(d.total ?? 0);
      }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [category, search, page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <PageHero
        tag="Medical Blog"
        title="Medical Insights, News & Study Tips"
        subtitle="Expert articles for Indian doctors and medical students — NEET-PG prep, clinical tips, product guides, and the latest in medicine."
        icon={<Rss className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />}
        right={
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#FFFFFF" }}
              />
            </div>
            <button type="submit"
              className="px-4 py-3 font-semibold text-sm rounded-xl transition-all hover:opacity-90 shrink-0"
              style={{ background: "#007A69", color: "#FFFFFF" }}>
              Search
            </button>
          </form>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-all", category === c ? "bg-primary text-white shadow" : "bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary")}>
                {c}
              </button>
            ))}
          </div>

          {search && <p className="text-slate-500 text-sm mb-4">{total} results for "{search}" <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="text-primary hover:underline">Clear</button></p>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-400 font-semibold">No articles found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {posts.map((post, i) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className={cn("bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group", i === 0 && "md:col-span-2 lg:col-span-3")}>
                    {post.featuredImage && (
                      <div className={cn("overflow-hidden", i === 0 ? "h-56" : "h-44")}>
                        <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-600")}>{post.category}</span>
                      </div>
                      <h2 className={cn("font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-2", i === 0 ? "text-xl" : "text-base")}>{post.title}</h2>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-medium text-slate-600">{post.authorName}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime} min read</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
                        <span className="ml-auto">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={cn("w-9 h-9 rounded-xl text-sm font-semibold transition-all", page === p ? "bg-primary text-white" : "border border-slate-200 text-slate-600 hover:border-primary hover:text-primary")}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 hidden lg:block space-y-6">
          {/* Newsletter */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div>
              <h3 className="font-bold text-slate-900">Weekly Medical Updates</h3>
            </div>
            <p className="text-slate-500 text-xs mb-4">Get NEET-PG tips, clinical insights, and medical news every week. 12,000+ subscribers.</p>
            <NewsletterForm source="sidebar" />
          </div>

          {/* Popular Posts */}
          {popular.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Popular Posts</h3>
              <div className="space-y-3">
                {popular.map((p, i) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-3 group">
                    <span className="text-2xl font-bold text-slate-200 leading-tight w-6 shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{p.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{p.views}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{p.readTime} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Categories</h3>
            <div className="space-y-1">
              {CATEGORIES.filter(c => c !== "All").map(c => (
                <button key={c} onClick={() => { setCategory(c); setPage(1); window.scrollTo(0, 0); }}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all", category === c ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-primary")}>
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
