import { useState, useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import { Globe, RefreshCw, Zap, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NEWS_CATEGORIES = ["All", "India Medical News", "Global Health", "NEET-PG Updates", "Drug Approvals", "Medical Research"];
const apiBase = () => import.meta.env.BASE_URL.replace(/\/$/, "");

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return `${minutes}m ago`;
}

export default function MedicalNews() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    document.title = "Medical News — Latest Health Updates | Aethex";
  }, []);

  const fetchNews = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const params = category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
      const res = await fetch(`${apiBase()}/api/news${params}`);
      const data = await res.json();
      setArticles(data.articles ?? []);
      setIsDemo(data.source === "demo");
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNews(); }, [category]);

  const breakingNews = articles.find(a => {
    const pub = new Date(a.publishedAt || a.published_at || Date.now());
    return (Date.now() - pub.getTime()) < 4 * 60 * 60 * 1000;
  });

  const SOURCE_LOGOS: Record<string, string> = {
    "The Hindu": "TH", "Medical Dialogues": "MD", "WHO": "WHO", "Pharmabiz": "PB",
    "IJMR": "IJMR", "The Lancet": "TL", "PIB India": "PIB", "Times of India": "TOI",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Live Medical News"
        title="Medical News"
        subtitle="Stay current with India's medical landscape — ICMR updates, drug approvals, NEET-PG news and global health developments"
        icon={<Globe className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breaking News Banner */}
        {breakingNews && (
          <div className="bg-rose-600 text-white rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">Breaking</span>
            </div>
            <p className="font-semibold text-sm line-clamp-1 flex-1">{breakingNews.title}</p>
            <span className="text-xs text-rose-200 shrink-0">{formatTimeAgo(breakingNews.publishedAt || Date.now().toString())}</span>
          </div>
        )}

        {/* Filters + Refresh */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {NEWS_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-all", category === c ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900")}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => fetchNews(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-60">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No news found for this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {articles.map((article, i) => (
              <a key={i} href={article.url || "#"} target="_blank" rel="noopener noreferrer"
                className={cn("bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group", i === 0 && "md:col-span-2")}>
                {article.urlToImage && (
                  <div className={cn("overflow-hidden", i === 0 ? "h-52" : "h-36")}>
                    <img src={article.urlToImage} alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {article.source?.name && (
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {SOURCE_LOGOS[article.source.name] ?? article.source.name?.slice(0, 6) ?? "News"}
                      </span>
                    )}
                    {(article.category) && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{article.category}</span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />{formatTimeAgo(article.publishedAt || new Date().toISOString())}
                    </span>
                  </div>
                  <h3 className={cn("font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2", i === 0 ? "text-lg mb-2" : "text-base mb-1")}>{article.title}</h3>
                  {article.description && <p className="text-slate-500 text-sm line-clamp-2">{article.description}</p>}
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-primary">
                    Read full article <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-slate-400 text-xs mt-8">News updated every 6 hours · Sources: ICMR, AIIMS, NBE, WHO, The Lancet, Times of India and more</p>
      </div>
    </div>
  );
}
