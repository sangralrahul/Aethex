import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, MessageSquare, Trash2, ChevronDown, ChevronUp, Brain, Clock, Search } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { loginUrl } from "@/lib/host";


const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Consult {
  id: number;
  query: string;
  response: string;
  model: string | null;
  createdAt: string;
}

export default function ConsultHistory() {
  const { isLoggedIn, getJwt } = useUserAuth();
  const [consults, setConsults] = useState<Consult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const jwt = getJwt();

  const fetchConsults = () => {
    if (!isLoggedIn || !jwt) { setLoading(false); return; }
    fetch(`${API_BASE}/api/monetization/consults`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(data => { setConsults(data.consults ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchConsults(); }, [isLoggedIn]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch(`${API_BASE}/api/monetization/consults/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt!}` },
    });
    setConsults(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  };

  const filtered = consults.filter(c =>
    c.query.toLowerCase().includes(search.toLowerCase()) ||
    c.response.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,rgba(10,22,40,0.96) 0%,rgba(13,33,68,0.93) 50%,rgba(10,48,96,0.96) 100%)" }} />
        <div className="max-w-4xl mx-auto px-4 pt-14 pb-10 relative z-10">
          <Link href="/account" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.2)" }}>
              <Brain className="w-5 h-5" style={{ color: "#00C2A8" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Consults</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Your saved Cadus AI interactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {!isLoggedIn ? (
          <div className="rounded-2xl p-10 text-center bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
            <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "#00C2A8" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1c1c1e" }}>Sign in to view your consult history</h2>
            <a href={loginUrl("/")}>
              <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white mt-4" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                Sign In
              </button>
            </a>

          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white" style={{ border: "1px solid rgba(60,60,67,0.12)" }}>
              <Search className="w-4 h-4" style={{ color: "#aeaeb2" }} />
              <input
                type="text"
                placeholder="Search your consults..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: "#1c1c1e" }}
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)" }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl p-10 text-center bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
                <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "#aeaeb2" }} />
                <p className="font-semibold mb-1" style={{ color: "#1c1c1e" }}>
                  {search ? "No matching consults found" : "No consults yet"}
                </p>
                <p className="text-sm" style={{ color: "#636366" }}>
                  {search ? "Try a different search term." : "Your Cadus AI conversations will be saved here automatically."}
                </p>
                {!search && (
                  <Link href="/cadus">
                    <button className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                      Start a Consult
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs pl-1" style={{ color: "#636366" }}>{filtered.length} consult{filtered.length !== 1 ? "s" : ""}</p>
                {filtered.map(c => (
                  <div key={c.id} className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-3 h-3 shrink-0" style={{ color: "#aeaeb2" }} />
                            <span className="text-xs" style={{ color: "#aeaeb2" }}>{formatDate(c.createdAt)}</span>
                            {c.model && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8", border: "1px solid rgba(0,194,168,0.2)" }}>
                                {c.model}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "#1c1c1e" }}>{c.query}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                            className="p-2 rounded-xl transition-all hover:opacity-70"
                            style={{ color: "#636366" }}
                          >
                            {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deleting === c.id}
                            className="p-2 rounded-xl transition-all hover:bg-red-50"
                            style={{ color: "#aeaeb2" }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expanded === c.id && (
                        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid rgba(60,60,67,0.08)" }}>
                          <div>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Your Query</p>
                            <p className="text-sm leading-relaxed" style={{ color: "#1c1c1e" }}>{c.query}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: "#00C2A8" }}>Cadus AI Response</p>
                            <div className="rounded-xl p-3.5 text-sm leading-relaxed whitespace-pre-wrap"
                              style={{ background: "rgba(0,194,168,0.04)", border: "1px solid rgba(0,194,168,0.12)", color: "#3c3c43", maxHeight: 400, overflowY: "auto" }}>
                              {c.response.slice(0, 2000)}{c.response.length > 2000 ? "…" : ""}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
