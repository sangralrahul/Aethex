import { useState } from "react";
import { Link } from "wouter";
import { Package, MapPin, ChevronRight, Search, Clock, CheckCircle2, Truck, PackageCheck, X, Eye, RefreshCw } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useUserAuth } from "@/hooks/use-user-auth";

type OrderStatus = "placed" | "confirmed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  address: string;
  trackingId?: string;
  courier?: string;
  estimatedDelivery?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; step: number }> = {
  placed: { label: "Order Placed", color: "#60A5FA", bg: "rgba(96,165,250,0.15)", step: 1 },
  confirmed: { label: "Confirmed", color: "#A78BFA", bg: "rgba(167,139,250,0.15)", step: 2 },
  shipped: { label: "Shipped", color: "#FB923C", bg: "rgba(251,146,60,0.15)", step: 3 },
  out_for_delivery: { label: "Out for Delivery", color: "#FBBF24", bg: "rgba(251,191,36,0.15)", step: 4 },
  delivered: { label: "Delivered", color: "#34D399", bg: "rgba(52,211,153,0.15)", step: 5 },
  cancelled: { label: "Cancelled", color: "#F87171", bg: "rgba(248,113,113,0.15)", step: 0 },
};

const STEPS = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const DEMO_ORDERS: Order[] = [
  {
    id: "AX24038671",
    date: "2026-03-28",
    status: "shipped",
    items: [
      { name: "3M Littmann Classic III Stethoscope", quantity: 1, price: 8500 },
      { name: "Medical Scrub Set (M)", quantity: 2, price: 1200 },
    ],
    total: 10900,
    address: "Flat 4B, Doctor's Colony, Andheri East, Mumbai - 400069",
    trackingId: "BLKT204938123",
    courier: "Bluedart",
    estimatedDelivery: "2026-04-01",
  },
  {
    id: "AX24038215",
    date: "2026-03-20",
    status: "delivered",
    items: [
      { name: "OMRON Blood Pressure Monitor (HEM-7120)", quantity: 1, price: 2800 },
    ],
    total: 2800,
    address: "12, MG Road, Bangalore - 560001",
    trackingId: "FX7284910023",
    courier: "FedEx",
    estimatedDelivery: "2026-03-24",
  },
  {
    id: "AX24037890",
    date: "2026-03-15",
    status: "delivered",
    items: [
      { name: "Harrison's Principles of Internal Medicine", quantity: 1, price: 4800 },
      { name: "Robbins & Cotran Pathology", quantity: 1, price: 3600 },
    ],
    total: 8400,
    address: "Flat 4B, Doctor's Colony, Andheri East, Mumbai - 400069",
    trackingId: "DX912837465",
    courier: "Delhivery",
    estimatedDelivery: "2026-03-19",
  },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ color: cfg.color, background: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function StepperTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return (
    <div className="flex items-center gap-2 text-sm text-red-400">
      <X className="w-4 h-4" />
      This order was cancelled.
    </div>
  );

  const currentStep = STATUS_CONFIG[status].step;

  return (
    <div className="relative">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-black/10" />
        <div className="absolute top-4 left-0 h-0.5 bg-[#00C2A8] transition-all"
          style={{ width: `${Math.max(0, ((currentStep - 1) / 4)) * 100}%` }} />
        {STEPS.map((step, idx) => {
          const done = currentStep > idx + 1;
          const active = currentStep === idx + 1;
          return (
            <div key={step.key} className="relative flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done ? "bg-[#00C2A8]" : active ? "bg-[#00C2A8]/20 border-2 border-[#00C2A8]" : "bg-[#F2F2F7] border border-black/15"
              }`}>
                <step.icon className={`w-4 h-4 ${done || active ? "text-[#00C2A8]" : "text-[#aeaeb2]"}`}
                  style={done ? { color: "#F5F3EE" } : {}} />
              </div>
              <span className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${
                done || active ? "text-[#1c1c1e]" : "text-[#aeaeb2]"
              }`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, onView }: { order: Order; onView: (o: Order) => void }) {
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden hover:border-black/15 transition-all">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#6c6c70]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1c1c1e]">Order #{order.id}</p>
            <p className="text-xs text-[#6c6c70]">{new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-[#1c1c1e] font-bold">{formatINR(order.total)}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="text-sm text-[#3c3c43] mb-4 space-y-1">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="truncate">{item.name} × {item.quantity}</span>
              <span className="text-[#1c1c1e] shrink-0 ml-4">{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        {order.trackingId && order.courier && (
          <div className="text-xs text-[#6c6c70] mb-4 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-[#00C2A8]" />
            {order.courier} · {order.trackingId}
            {order.estimatedDelivery && order.status !== "delivered" && (
              <span className="text-[#00C2A8]">· ETA: {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => onView(order)}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 border border-black/10 text-[#3c3c43] text-sm font-medium rounded-xl hover:bg-black/10 hover:text-[#1c1c1e] transition-all">
            <Eye className="w-4 h-4" />
            View Details
          </button>
          {(order.status === "shipped" || order.status === "out_for_delivery") && (
            <Link href="/orders/track"
              className="flex items-center gap-2 px-4 py-2 bg-[#00C2A8]/15 border border-[#00C2A8]/30 text-[#00C2A8] text-sm font-medium rounded-xl hover:bg-[#00C2A8]/25 transition-all">
              <MapPin className="w-4 h-4" />
              Track Order
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-black/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-[#1c1c1e]">Order #{order.id}</h3>
            <p className="text-sm text-[#6c6c70]">{new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="p-2 text-[#6c6c70] hover:text-[#1c1c1e] hover:bg-black/[0.08] rounded-lg transition-all">✕</button>
          </div>
        </div>
        <div className="p-5 space-y-6">
          {/* Tracker */}
          <div>
            <p className="text-xs text-[#6c6c70] uppercase tracking-widest mb-4">Order Progress</p>
            <StepperTracker status={order.status} />
          </div>

          {/* Items */}
          <div>
            <p className="text-xs text-[#6c6c70] uppercase tracking-widest mb-3">Items Ordered</p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/4 border border-white/6 rounded-xl">
                  <div>
                    <p className="text-sm text-[#1c1c1e] font-medium">{item.name}</p>
                    <p className="text-xs text-[#6c6c70]">Qty: {item.quantity} × {formatINR(item.price)}</p>
                  </div>
                  <span className="text-sm text-[#1c1c1e] font-semibold">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address & Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6c6c70] uppercase tracking-widest mb-2">Delivery Address</p>
              <p className="text-sm text-[#3c3c43] leading-relaxed">{order.address}</p>
            </div>
            {order.trackingId && (
              <div>
                <p className="text-xs text-[#6c6c70] uppercase tracking-widest mb-2">Tracking</p>
                <p className="text-sm text-[#3c3c43]">{order.courier}</p>
                <p className="text-sm font-mono text-[#00C2A8]">{order.trackingId}</p>
                {order.estimatedDelivery && (
                  <p className="text-xs text-[#6c6c70] mt-1">
                    {order.status === "delivered" ? "Delivered on" : "Expected by"}: {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-[#F2F2F7] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-[#6c6c70]">
              <span>Subtotal</span>
              <span>{formatINR(order.total * 0.85)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#6c6c70]">
              <span>GST (18%)</span>
              <span>{formatINR(order.total * 0.15)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#6c6c70]">
              <span>Shipping</span>
              <span className="text-[#00C2A8]">FREE</span>
            </div>
            <div className="border-t border-black/[0.08] pt-2 flex justify-between font-bold">
              <span className="text-[#1c1c1e]">Total</span>
              <span className="text-[#00C2A8]">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user, isLoggedIn } = useUserAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen  bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-[#8e8e93]" />
          </div>
          <h2 className="text-xl font-display font-bold text-[#1c1c1e] mb-2">Sign in to view orders</h2>
          <p className="text-[#6c6c70] text-sm mb-6">Access your complete order history and real-time tracking.</p>
          <Link href="/" className="px-6 py-3 bg-[#00C2A8] text-[#F5F3EE] font-bold rounded-xl hover:bg-[#00D4B8] transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const filtered = DEMO_ORDERS.filter(o => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen  bg-[#F2F2F7] pb-24">
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 text-sm text-[#6c6c70] mb-6">
          <Link href="/" className="hover:text-[#1c1c1e]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1c1c1e]">My Orders</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#1c1c1e]">My Orders</h1>
            <p className="text-[#6c6c70] text-sm mt-1">Track and manage all your aethex orders</p>
          </div>
          <Link href="/orders/track"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00C2A8]/15 border border-[#00C2A8]/30 text-[#00C2A8] text-sm font-semibold rounded-xl hover:bg-[#00C2A8]/25 transition-all">
            <MapPin className="w-4 h-4" />
            Track by ID
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID or product name..."
              className="w-full pl-9 pr-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] text-sm placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] text-sm focus:outline-none focus:border-[#00C2A8]/50">
            <option value="all" className="bg-white">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k} className="bg-white">{v.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Orders", value: DEMO_ORDERS.length, color: "#60A5FA" },
            { label: "Delivered", value: DEMO_ORDERS.filter(o => o.status === "delivered").length, color: "#34D399" },
            { label: "In Transit", value: DEMO_ORDERS.filter(o => ["shipped", "out_for_delivery"].includes(o.status)).length, color: "#FB923C" },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-black/[0.08] rounded-2xl p-4 text-center">
              <div className="text-2xl font-display font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-[#6c6c70] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <RefreshCw className="w-12 h-12 text-[#aeaeb2] mx-auto mb-4" />
            <p className="text-[#6c6c70]">No orders found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onView={setViewOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
