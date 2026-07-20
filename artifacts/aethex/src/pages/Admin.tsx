import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShieldCheck, LayoutDashboard, Package, Users, ShoppingBag, FileText, BarChart3, Settings, Lock, Eye, EyeOff, ChevronRight, TrendingUp, IndianRupee, Star, CheckCircle2, XCircle, Clock, AlertTriangle, BadgeCheck } from "lucide-react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type AdminTab = "dashboard" | "products" | "orders" | "users" | "sellers" | "blog" | "analytics" | "verifications" | "settings";

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "sellers", label: "Sellers", icon: ShieldCheck },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "verifications", label: "Verifications", icon: BadgeCheck },
  { id: "settings", label: "Settings", icon: Settings },
];

interface VerificationRequest {
  id: number;
  email: string;
  name: string | null;
  registrationNumber: string;
  councilName: string;
  documentName: string | null;
  documentData: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

const DEMO_STATS = {
  totalRevenue: 18,  // lakhs
  orders: 1247,
  users: 52400,
  products: 1083,
  pendingSellers: 4,
  pendingReviews: 12,
  avgRating: 4.6,
  activeSubscriptions: 3821,
};

const DEMO_ORDERS = [
  { id: "AX24038671", user: "Dr. Priya Sharma", amount: 10900, status: "shipped", date: "2026-03-28" },
  { id: "AX24038215", user: "Dr. Rohan Malhotra", amount: 2800, status: "delivered", date: "2026-03-20" },
  { id: "AX24038010", user: "Dr. Ananya K.", amount: 8400, status: "confirmed", date: "2026-03-18" },
  { id: "AX24037890", user: "Dr. Sanjay Gupta", amount: 1800, status: "placed", date: "2026-03-15" },
  { id: "AX24037720", user: "Dr. Meera Iyer", amount: 4500, status: "cancelled", date: "2026-03-10" },
];

const DEMO_USERS = [
  { id: 1, name: "Dr. Priya Sharma", email: "priya@aiims.ac.in", orders: 3, isPro: true, joined: "2026-01-15" },
  { id: 2, name: "Dr. Rohan Malhotra", email: "rohan@pgi.edu.in", orders: 1, isPro: false, joined: "2026-02-10" },
  { id: 3, name: "Dr. Ananya Krishnan", email: "ananya@kem.ac.in", orders: 2, isPro: true, joined: "2026-02-25" },
  { id: 4, name: "Dr. Sanjay Gupta", email: "sanjay@gmch.ac.in", orders: 1, isPro: false, joined: "2026-03-05" },
];

const DEMO_SELLERS = [
  { id: 1, name: "MedSupply Co.", gst: "27AABCM1234A1Z5", status: "approved", products: 48, revenue: 284000 },
  { id: 2, name: "SurgiTech India", gst: "09AABCS5678B2Z1", status: "pending", products: 0, revenue: 0 },
  { id: 3, name: "Dr. Books Hub", gst: "29AABCD9012C3Z7", status: "approved", products: 127, revenue: 412000 },
  { id: 4, name: "HealthKart Pro", gst: "24AABCH3456D4Z2", status: "pending", products: 0, revenue: 0 },
];

const STATUS_COLORS: Record<string, string> = {
  placed: "#60A5FA",
  confirmed: "#A78BFA",
  shipped: "#FB923C",
  out_for_delivery: "#FBBF24",
  delivered: "#34D399",
  cancelled: "#F87171",
  approved: "#34D399",
  pending: "#FBBF24",
  rejected: "#F87171",
};

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: typeof TrendingUp; color: string }) {
  return (
    <div className="bg-white border border-black/[0.08] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-xs text-[#8e8e93] bg-black/5 px-2 py-1 rounded-lg">24h</span>
      </div>
      <div className="text-2xl font-display font-bold text-[#1c1c1e] mb-1">{value}</div>
      <div className="text-sm text-[#6c6c70]">{label}</div>
      {sub && <div className="text-xs text-[#00C2A8] mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#60A5FA";
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize"
      style={{ color, background: color + "20" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status.replace("_", " ")}
    </span>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("aethex_admin_auth") === "true");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyActionMsg, setVerifyActionMsg] = useState<{ id: number; type: "success" | "error"; text: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<{ id: number; reason: string } | null>(null);

  const { data: productsData } = useListProducts({ limit: 50 });
  const products = productsData?.products || [];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiBase = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const resp = await fetch(`${apiBase}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        sessionStorage.setItem("aethex_admin_auth", "true");
        sessionStorage.setItem("aethex_admin_pw", password);
        setAuthed(true);
        setError("");
      } else {
        setError(data.error ?? "Incorrect admin password.");
      }
    } catch {
      setError("Could not reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("aethex_admin_auth");
    sessionStorage.removeItem("aethex_admin_pw");
    setAuthed(false);
    setPassword("");
  };

  const adminPw = () => sessionStorage.getItem("aethex_admin_pw") ?? "";

  useEffect(() => {
    if (tab !== "verifications" || !authed) return;
    setVerifyLoading(true);
    fetch(`${API_BASE}/api/admin/verifications`, {
      headers: { "x-admin-password": adminPw() },
    })
      .then(r => r.json())
      .then(data => setVerifications(data.verifications ?? []))
      .catch(() => {})
      .finally(() => setVerifyLoading(false));
  }, [tab, authed]);

  const handleApprove = async (id: number) => {
    setVerifyActionMsg(null);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/verifications/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-password": adminPw(), "Content-Type": "application/json" },
      });
      const data = await resp.json();
      if (resp.ok) {
        setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: "approved" } : v));
        setVerifyActionMsg({ id, type: "success", text: "Approved — user is now verified." });
      } else {
        setVerifyActionMsg({ id, type: "error", text: data.error ?? "Approval failed." });
      }
    } catch {
      setVerifyActionMsg({ id, type: "error", text: "Network error." });
    }
  };

  const handleReject = async (id: number) => {
    const reason = rejectReason?.id === id ? rejectReason.reason : "";
    setVerifyActionMsg(null);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/verifications/${id}/reject`, {
        method: "POST",
        headers: { "x-admin-password": adminPw(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: "rejected", rejectionReason: reason || null } : v));
        setVerifyActionMsg({ id, type: "success", text: "Request rejected." });
        setRejectReason(null);
      } else {
        setVerifyActionMsg({ id, type: "error", text: data.error ?? "Rejection failed." });
      }
    } catch {
      setVerifyActionMsg({ id, type: "error", text: "Network error." });
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 ">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#00C2A8]/15 border border-[#00C2A8]/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[#00C2A8]" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Admin Access</h1>
            <p className="text-sm text-[#6c6c70] mt-1">AETHEX Administration Panel</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white border border-black/[0.08] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm text-[#3c3c43] mb-1.5">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-12 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50" />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#3c3c43]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#00C2A8] text-[#F5F3EE] font-bold rounded-xl hover:bg-[#00D4B8] transition-colors disabled:opacity-60">
              {loading ? "Verifying…" : "Access Admin Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] ">
      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="fixed left-0 top-[72px] bottom-0 w-56 bg-white border-r border-black/[0.08] flex flex-col z-40 hidden lg:flex">
          <div className="p-4 border-b border-black/[0.08]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00C2A8]" />
              <span className="font-display font-bold text-[#1c1c1e] text-sm">Admin Panel</span>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t.id ? "bg-[#00C2A8]/15 text-[#00C2A8]" : "text-[#3c3c43] hover:text-[#1c1c1e] hover:bg-black/5"
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.id === "sellers" && DEMO_SELLERS.filter(s => s.status === "pending").length > 0 && (
                  <span className="ml-auto w-5 h-5 flex items-center justify-center bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                    {DEMO_SELLERS.filter(s => s.status === "pending").length}
                  </span>
                )}
                {t.id === "verifications" && verifications.filter(v => v.status === "pending").length > 0 && (
                  <span className="ml-auto w-5 h-5 flex items-center justify-center bg-[#007AFF]/20 text-[#007AFF] text-xs font-bold rounded-full">
                    {verifications.filter(v => v.status === "pending").length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-black/[0.08]">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
              <Lock className="w-4 h-4" />
              Lock Admin
            </button>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.08] z-40 flex overflow-x-auto">
          {TABS.slice(0, 5).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                tab === t.id ? "text-[#00C2A8]" : "text-[#6c6c70]"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 p-6 pb-24 lg:pb-8 min-h-screen">

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Dashboard</h1>
                  <p className="text-[#6c6c70] text-sm">AETHEX platform overview</p>
                </div>
                <div className="flex items-center gap-2">
                  {DEMO_STATS.pendingSellers > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {DEMO_STATS.pendingSellers} sellers pending
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value={`₹${DEMO_STATS.totalRevenue}L`} sub="+12% this month" icon={IndianRupee} color="#00C2A8" />
                <StatCard label="Total Orders" value={DEMO_STATS.orders.toLocaleString()} sub="+48 today" icon={ShoppingBag} color="#60A5FA" />
                <StatCard label="Registered Users" value={`${(DEMO_STATS.users / 1000).toFixed(1)}k`} sub="+120 this week" icon={Users} color="#A78BFA" />
                <StatCard label="Pro Subscribers" value={DEMO_STATS.activeSubscriptions.toLocaleString()} sub="+23 this week" icon={Star} color="#FBBF24" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white border border-black/[0.08] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-[#1c1c1e]">Recent Orders</h3>
                    <button onClick={() => setTab("orders")} className="text-xs text-[#00C2A8] hover:underline">View all</button>
                  </div>
                  <div className="space-y-3">
                    {DEMO_ORDERS.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1c1c1e] truncate">{order.id}</p>
                          <p className="text-xs text-[#6c6c70] truncate">{order.user}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <StatusBadge status={order.status} />
                          <p className="text-xs text-[#3c3c43] mt-1">₹{order.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-black/[0.08] rounded-2xl p-5">
                  <h3 className="font-display font-bold text-[#1c1c1e] mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Approve Sellers", count: 4, color: "#FBBF24", tab: "sellers" as AdminTab },
                      { label: "Review Posts", count: 3, color: "#60A5FA", tab: "blog" as AdminTab },
                      { label: "Flag Reviews", count: 12, color: "#F87171", tab: "products" as AdminTab },
                      { label: "View Analytics", count: null, color: "#00C2A8", tab: "analytics" as AdminTab },
                    ].map((action, i) => (
                      <button key={i} onClick={() => setTab(action.tab)}
                        className="p-4 bg-white/4 border border-white/6 rounded-xl text-left hover:bg-black/[0.08] transition-all">
                        <p className="text-sm font-semibold text-[#1c1c1e] mb-1">{action.label}</p>
                        {action.count !== null && (
                          <p className="text-xs" style={{ color: action.color }}>{action.count} pending</p>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link href="/admin/sellers" className="flex items-center justify-between p-3 bg-white/4 border border-white/6 rounded-xl hover:bg-black/[0.08] transition-all text-sm">
                      <span className="text-[#3c3c43]">Full Seller Management</span>
                      <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
                    </Link>
                    <Link href="/admin/blog" className="flex items-center justify-between p-3 bg-white/4 border border-white/6 rounded-xl hover:bg-black/[0.08] transition-all text-sm">
                      <span className="text-[#3c3c43]">Blog Content Management</span>
                      <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
                    </Link>
                    <Link href="/admin/reviews" className="flex items-center justify-between p-3 bg-white/4 border border-white/6 rounded-xl hover:bg-black/[0.08] transition-all text-sm">
                      <span className="text-[#3c3c43]">Product Review Moderation</span>
                      <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === "products" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Products</h1>
                <span className="px-3 py-1.5 bg-[#00C2A8]/15 border border-[#00C2A8]/30 text-[#00C2A8] text-sm font-medium rounded-xl">{products.length} products</span>
              </div>
              <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/[0.08]">
                        {["Product", "Category", "Price", "Stock", "Rating"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-[#6c6c70] font-medium uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 20).map((p: any) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-[#1c1c1e] truncate max-w-[200px]">{p.name}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6c6c70]">{p.categorySlug || "—"}</td>
                          <td className="px-4 py-3 text-sm text-[#1c1c1e]">₹{Number(p.price).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${p.inStock ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                              {p.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-amber-400">{Number(p.rating || 0).toFixed(1)} ★</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {tab === "orders" && (
            <div className="space-y-5">
              <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Orders</h1>
              <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/[0.08]">
                        {["Order ID", "Customer", "Amount", "Status", "Date"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-[#6c6c70] font-medium uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_ORDERS.map(order => (
                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-[#1c1c1e]">{order.id}</td>
                          <td className="px-4 py-3 text-sm text-[#3c3c43]">{order.user}</td>
                          <td className="px-4 py-3 text-sm text-[#1c1c1e]">₹{order.amount.toLocaleString()}</td>
                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3 text-sm text-[#6c6c70]">{new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === "users" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Users</h1>
                <span className="px-3 py-1.5 bg-black/[0.08] text-[#3c3c43] text-sm rounded-xl">{DEMO_STATS.users.toLocaleString()} total</span>
              </div>
              <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/[0.08]">
                        {["Name", "Email", "Orders", "Plan", "Joined"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-[#6c6c70] font-medium uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_USERS.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-[#1c1c1e]">{u.name}</td>
                          <td className="px-4 py-3 text-sm text-[#6c6c70]">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-[#1c1c1e]">{u.orders}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${u.isPro ? "bg-[#00C2A8]/15 text-[#00C2A8]" : "bg-black/[0.08] text-[#6c6c70]"}`}>
                              {u.isPro ? "PRO" : "FREE"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6c6c70]">{new Date(u.joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sellers Tab */}
          {tab === "sellers" && (
            <div className="space-y-5">
              <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Sellers</h1>
              <div className="space-y-3">
                {DEMO_SELLERS.map(seller => (
                  <div key={seller.id} className="bg-white border border-black/[0.08] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#1c1c1e]">{seller.name}</h3>
                        <p className="text-xs text-[#6c6c70] font-mono">GST: {seller.gst}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={seller.status} />
                        {seller.status === "pending" && (
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />Approve
                            </button>
                            <button className="px-3 py-1.5 bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/25 transition-colors flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {seller.status === "approved" && (
                      <div className="flex gap-4 text-sm">
                        <div><span className="text-[#6c6c70]">Products:</span> <span className="text-[#1c1c1e]">{seller.products}</span></div>
                        <div><span className="text-[#6c6c70]">Revenue:</span> <span className="text-[#00C2A8]">₹{(seller.revenue / 1000).toFixed(0)}k</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link href="/admin/sellers" className="px-4 py-2.5 bg-[#00C2A8]/15 border border-[#00C2A8]/30 text-[#00C2A8] text-sm font-semibold rounded-xl hover:bg-[#00C2A8]/25 transition-all">
                  Full Seller Management →
                </Link>
              </div>
            </div>
          )}

          {/* Blog Tab */}
          {tab === "blog" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Blog</h1>
                <Link href="/admin/blog" className="px-4 py-2.5 bg-[#00C2A8] text-[#F5F3EE] text-sm font-bold rounded-xl hover:bg-[#00D4B8] transition-colors">
                  Full Blog Editor →
                </Link>
              </div>
              <div className="bg-white border border-black/[0.08] rounded-2xl p-5">
                <p className="text-[#6c6c70] text-sm">Manage blog posts, categories, and featured content. Click "Full Blog Editor" for complete CMS access.</p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {[
                    { label: "Published Posts", value: "24", color: "#34D399" },
                    { label: "Draft Posts", value: "3", color: "#FBBF24" },
                    { label: "Total Views", value: "48.2K", color: "#60A5FA" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 bg-white/4 rounded-xl">
                      <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-[#6c6c70] mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {tab === "analytics" && (
            <div className="space-y-5">
              <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Analytics</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Page Views" value="1.2M" sub="+8% vs last month" icon={TrendingUp} color="#60A5FA" />
                <StatCard label="Conversion Rate" value="3.8%" sub="+0.4% improvement" icon={BarChart3} color="#00C2A8" />
                <StatCard label="Avg Order Value" value="₹2,340" sub="+₹180 vs last month" icon={IndianRupee} color="#A78BFA" />
                <StatCard label="Return Rate" value="2.1%" sub="-0.3% improvement" icon={Star} color="#34D399" />
              </div>
              <div className="bg-white border border-black/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-[#1c1c1e] mb-4">Top Performing Categories</h3>
                <div className="space-y-4">
                  {[
                    { cat: "Stethoscopes", pct: 85, revenue: "₹4.2L" },
                    { cat: "Books & Study Material", pct: 72, revenue: "₹3.8L" },
                    { cat: "Medical Scrubs", pct: 61, revenue: "₹2.9L" },
                    { cat: "BP Monitors & Equipment", pct: 54, revenue: "₹2.4L" },
                    { cat: "Surgical Instruments", pct: 43, revenue: "₹1.8L" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-[#3c3c43] shrink-0">{item.cat}</div>
                      <div className="flex-1 h-2 bg-black/[0.08] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00C2A8] to-[#00E5D0] rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-sm text-[#3c3c43] shrink-0 w-16 text-right">{item.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Verifications Tab */}
          {tab === "verifications" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Doctor Verifications</h1>
                <p className="text-[#6c6c70] text-sm mt-1">Review and approve doctor credential verification requests.</p>
              </div>

              {verifyLoading ? (
                <div className="flex items-center gap-3 justify-center py-16 text-[#8e8e93]">
                  <div className="w-5 h-5 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin" />
                  <span className="text-sm">Loading verification requests…</span>
                </div>
              ) : verifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center bg-white border border-black/[0.08] rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#007AFF]/10">
                    <BadgeCheck className="w-7 h-7 text-[#007AFF]" />
                  </div>
                  <p className="font-semibold text-[#1c1c1e]">No verification requests</p>
                  <p className="text-sm text-[#6c6c70]">Requests will appear here when doctors apply for verification.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map(v => (
                    <div key={v.id} className="bg-white border border-black/[0.08] rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[#007AFF]"
                            style={{ background: "rgba(0,122,255,0.1)" }}>
                            {(v.name ?? v.email)[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1c1c1e]">{v.name ?? "—"}</p>
                            <p className="text-xs text-[#6c6c70]">{v.email}</p>
                          </div>
                        </div>
                        <StatusBadge status={v.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="p-3 rounded-xl bg-black/[0.03]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e93] mb-1">Registration No.</p>
                          <p className="font-semibold text-[#1c1c1e]">{v.registrationNumber}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.03]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e93] mb-1">Council</p>
                          <p className="font-semibold text-[#1c1c1e] text-xs leading-tight">{v.councilName}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.03]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e93] mb-1">Submitted</p>
                          <p className="font-semibold text-[#1c1c1e]">{new Date(v.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.03]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e93] mb-1">Document</p>
                          <p className="font-semibold text-[#1c1c1e] text-xs">{v.documentName ?? "Not uploaded"}</p>
                        </div>
                      </div>

                      {v.documentData && v.documentName && (
                        <div className="mb-4">
                          {v.documentName.toLowerCase().endsWith(".pdf") ? (
                            <a href={v.documentData} download={v.documentName}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold rounded-xl hover:bg-[#007AFF]/15 transition-colors">
                              <FileText className="w-3.5 h-3.5" />
                              Download PDF Document
                            </a>
                          ) : (
                            <div className="rounded-xl overflow-hidden border border-black/[0.08] max-h-40">
                              <img src={v.documentData} alt="Document" className="w-full object-contain max-h-40" />
                            </div>
                          )}
                        </div>
                      )}

                      {verifyActionMsg?.id === v.id && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-3 ${verifyActionMsg.type === "success" ? "bg-[#00C2A8]/10 text-[#00C2A8]" : "bg-red-400/10 text-red-400"}`}>
                          {verifyActionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                          {verifyActionMsg.text}
                        </div>
                      )}

                      {v.status === "pending" && (
                        <div className="space-y-3">
                          {rejectReason?.id === v.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={rejectReason.reason}
                                onChange={e => setRejectReason({ id: v.id, reason: e.target.value })}
                                placeholder="Rejection reason (optional)…"
                                className="flex-1 px-3 py-2 text-sm bg-black/5 border border-black/10 rounded-xl focus:outline-none focus:border-red-400/50"
                              />
                              <button onClick={() => handleReject(v.id)}
                                className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors">
                                Confirm
                              </button>
                              <button onClick={() => setRejectReason(null)}
                                className="px-3 py-2 text-sm text-[#8e8e93] hover:text-[#1c1c1e] rounded-xl hover:bg-black/5 transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button onClick={() => handleApprove(v.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-sm rounded-xl transition-all"
                                style={{ background: "#007AFF", color: "#fff" }}>
                                <BadgeCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button onClick={() => setRejectReason({ id: v.id, reason: "" })}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-all">
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {v.rejectionReason && (
                        <p className="mt-2 text-xs text-[#6c6c70]">Rejection reason: <span className="text-red-400">{v.rejectionReason}</span></p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div className="space-y-5">
              <h1 className="text-2xl font-display font-bold text-[#1c1c1e]">Settings</h1>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "Store Settings", desc: "Store name, currency, timezone, GST number", action: "Configure" },
                  { title: "Payment Gateway", desc: "Razorpay API keys and webhook configuration", action: "Configure" },
                  { title: "Shipping & Logistics", desc: "Delivery partners, shipping zones, rates", action: "Configure" },
                  { title: "Email Notifications", desc: "SMTP settings, order confirmation templates", action: "Configure" },
                  { title: "SEO & Analytics", desc: "Google Analytics, sitemap, robots.txt, meta tags", action: "Configure" },
                  { title: "Admin Security", desc: "Change admin password, 2FA settings", action: "Configure" },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white border border-black/[0.08] rounded-2xl hover:border-black/15 transition-all">
                    <div>
                      <h3 className="font-semibold text-[#1c1c1e] text-sm">{setting.title}</h3>
                      <p className="text-xs text-[#6c6c70] mt-0.5">{setting.desc}</p>
                    </div>
                    <button className="px-4 py-2 bg-black/[0.08] border border-black/10 text-[#3c3c43] text-sm font-medium rounded-xl hover:bg-white/12 transition-colors shrink-0 ml-4">
                      {setting.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
