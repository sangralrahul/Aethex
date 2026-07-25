import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetCart } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { formatINR } from "@/lib/utils";
import { cadusUrl } from "@/lib/host";
import { ChevronRight, MapPin, CreditCard, Smartphone, Landmark, PackageCheck, ShieldCheck, Truck, CheckCircle2, Lock, Sparkles, Heart, Package, ArrowRight, Copy, Check, MessageSquare } from "lucide-react";


type Step = "address" | "payment" | "confirm";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI / QR Code", icon: Smartphone, desc: "Google Pay, PhonePe, BHIM, Paytm" },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", icon: Landmark, desc: "All major Indian banks" },
  { id: "cod", label: "Cash on Delivery", icon: PackageCheck, desc: "Pay when you receive your order" },
];

function StepIndicator({ current, step, label, index }: { current: Step; step: Step; label: string; index: number }) {
  const steps: Step[] = ["address", "payment", "confirm"];
  const currentIdx = steps.indexOf(current);
  const stepIdx = steps.indexOf(step);
  const done = currentIdx > stepIdx;
  const active = current === step;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
        done ? "bg-[#00C2A8] text-[#F5F3EE]"
             : active ? "bg-[#00C2A8]/20 border-2 border-[#00C2A8] text-[#00C2A8]"
             : "bg-black/5 border border-black/15 text-[#8e8e93]"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : index}
      </div>
      <span className={`text-sm font-medium ${active ? "text-[#1c1c1e]" : done ? "text-[#00C2A8]" : "text-[#8e8e93]"}`}>{label}</span>
    </div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const sessionId = useSession();
  const { data: cart } = useGetCart({ sessionId }, { query: { enabled: !!sessionId } });
  const [step, setStep] = useState<Step>("address");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId] = useState(() => "AX" + Date.now().toString().slice(-8));

  const [addr, setAddr] = useState({
    fullName: "", phone: "", email: "",
    line1: "", line2: "", city: "", state: "Maharashtra", pincode: "",
    saveAddress: false,
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.18);
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + gst + shipping;

  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setOrderPlaced(true);
  };

  const [copied, setCopied] = useState(false);
  const deliveryDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
        {/* Top gradient banner */}
        <div className="w-full py-16 px-4 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg,#007AFF 0%,#00C2A8 100%)" }}>
          <div className="absolute inset-0 opacity-10">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white" style={{ width: Math.random() * 6 + 2, height: Math.random() * 6 + 2, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.6 + 0.2 }} />
            ))}
          </div>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <p className="text-white/80 text-sm font-medium mb-1 tracking-widest uppercase">Order Confirmed</p>
            <h1 className="text-4xl font-display font-bold text-white mb-3">Thank you for using AETHEX!</h1>
            <p className="text-white/75 text-base max-w-sm mx-auto">Your order is confirmed and being prepared for dispatch. We appreciate your trust in us.</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-4">

          {/* Order ID Card */}
          <div className="bg-white border border-black/[0.08] rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-[#6c6c70] mb-1 font-medium uppercase tracking-wide">Order ID</p>
              <p className="text-lg font-bold text-[#1c1c1e] font-mono">{orderId}</p>
            </div>
            <button onClick={copyOrderId} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: copied ? "rgba(0,194,168,0.12)" : "rgba(0,122,255,0.08)", color: copied ? "#00C2A8" : "#007AFF" }}>
              {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.12)" }}>
                <Truck className="w-4 h-4 text-[#00C2A8]" />
              </div>
              <div>
                <p className="text-xs text-[#6c6c70] font-medium">Estimated Delivery</p>
                <p className="text-sm font-bold text-[#1c1c1e]">{deliveryDate}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,194,168,0.12)", color: "#00C2A8" }}>5–7 Days</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-black/[0.06]">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,122,255,0.08)" }}>
                <Package className="w-4 h-4 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-xs text-[#6c6c70] font-medium">Confirmation</p>
                <p className="text-sm font-bold text-[#1c1c1e]">Sent to {addr.email || "your email"}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1c1c1e] mb-4">Order Summary</h3>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-[#1c1c1e] font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-[#6c6c70]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#1c1c1e]">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-black/[0.06] pt-3 space-y-2">
                <div className="flex justify-between text-sm text-[#6c6c70]">
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6c6c70]">
                  <span>GST (18%)</span><span>{formatINR(gst)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6c6c70]">
                  <span>Shipping</span><span>{shipping === 0 ? "Free 🎉" : formatINR(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span className="text-[#1c1c1e]">Total Paid</span>
                  <span style={{ color: "#00C2A8" }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/orders" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#ffffff" }}>
              <Package className="w-4 h-4" />
              Track Order
            </Link>
            <Link href="/shop" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm border border-black/10 bg-white text-[#1c1c1e] transition-all hover:bg-black/5">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <a href={cadusUrl("/")} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm border border-black/10 bg-white text-[#007AFF] transition-all hover:bg-[#007AFF]/5" style={{ textDecoration: "none" }}>
            <Sparkles className="w-4 h-4" />
            Ask Cadus AI a clinical question
          </a>


          {/* Support note */}
          <div className="text-center pt-2 pb-6">
            <p className="text-xs text-[#8e8e93]">Need help? <a href="mailto:email@aethex.in" className="text-[#007AFF] font-medium">email@aethex.in</a></p>
            <p className="text-xs text-[#aeaeb2] mt-1">Made with <Heart className="inline w-3 h-3 text-rose-400" /> by AETHEX · Clavix Technologies Pvt Ltd</p>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen  bg-[#F2F2F7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#1c1c1e] mb-2">Your cart is empty</h2>
          <p className="text-[#6c6c70] mb-6">Add some products before checking out.</p>
          <Link href="/shop" className="px-6 py-3 bg-[#00C2A8] text-[#F5F3EE] font-bold rounded-xl">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-[#F2F2F7] pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 text-sm text-[#6c6c70] mb-8">
          <Link href="/" className="hover:text-[#1c1c1e] transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/cart" className="hover:text-[#1c1c1e] transition-colors">Cart</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1c1c1e]">Checkout</span>
        </div>

        <h1 className="text-3xl font-display font-bold text-[#1c1c1e] mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2">
          <StepIndicator current={step} step="address" label="Delivery Address" index={1} />
          <div className="flex-1 h-px bg-black/10 min-w-8" />
          <StepIndicator current={step} step="payment" label="Payment" index={2} />
          <div className="flex-1 h-px bg-black/10 min-w-8" />
          <StepIndicator current={step} step="confirm" label="Confirm" index={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            {step === "address" && (
              <form onSubmit={handleAddressNext} className="bg-white border border-black/[0.08] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-[#00C2A8]" />
                  <h2 className="text-lg font-display font-bold text-[#1c1c1e]">Delivery Address</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#3c3c43] mb-1.5">Full Name *</label>
                    <input value={addr.fullName} onChange={e => setAddr(a => ({...a, fullName: e.target.value}))} required
                      placeholder="Dr. Priya Sharma"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#3c3c43] mb-1.5">Phone Number *</label>
                    <input value={addr.phone} onChange={e => setAddr(a => ({...a, phone: e.target.value}))} required
                      placeholder="+91 98765 43210" type="tel"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-[#3c3c43] mb-1.5">Email Address *</label>
                    <input value={addr.email} onChange={e => setAddr(a => ({...a, email: e.target.value}))} required
                      placeholder="doctor@hospital.in" type="email"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-[#3c3c43] mb-1.5">Address Line 1 *</label>
                    <input value={addr.line1} onChange={e => setAddr(a => ({...a, line1: e.target.value}))} required
                      placeholder="House / Flat / Block No., Street Name"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-[#3c3c43] mb-1.5">Address Line 2</label>
                    <input value={addr.line2} onChange={e => setAddr(a => ({...a, line2: e.target.value}))}
                      placeholder="Landmark, Area (optional)"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#3c3c43] mb-1.5">City *</label>
                    <input value={addr.city} onChange={e => setAddr(a => ({...a, city: e.target.value}))} required
                      placeholder="Mumbai"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#3c3c43] mb-1.5">PIN Code *</label>
                    <input value={addr.pincode} onChange={e => setAddr(a => ({...a, pincode: e.target.value}))} required
                      placeholder="400001" maxLength={6} pattern="[0-9]{6}"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-[#3c3c43] mb-1.5">State *</label>
                    <select value={addr.state} onChange={e => setAddr(a => ({...a, state: e.target.value}))} required
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] focus:outline-none focus:border-[#00C2A8]/50 text-sm">
                      {INDIA_STATES.map(s => <option key={s} value={s} className="bg-white">{s}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit"
                  className="w-full py-3.5 bg-[#00C2A8] text-[#F5F3EE] font-bold rounded-xl hover:bg-[#00D4B8] transition-colors">
                  Continue to Payment →
                </button>
              </form>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="bg-white border border-black/[0.08] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-[#00C2A8]" />
                  <h2 className="text-lg font-display font-bold text-[#1c1c1e]">Payment Method</h2>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-[#6c6c70]">
                    <Lock className="w-3 h-3" />
                    <span>Secured by Razorpay</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <label key={method.id} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? "border-[#00C2A8]/60 bg-[#00C2A8]/8"
                        : "border-black/[0.08] hover:border-black/20"
                    }`}>
                      <input type="radio" name="payment" value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="sr-only" />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === method.id ? "bg-[#00C2A8]/20" : "bg-black/5"
                      }`}>
                        <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? "text-[#00C2A8]" : "text-[#6c6c70]"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1c1c1e]">{method.label}</p>
                        <p className="text-xs text-[#6c6c70]">{method.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        paymentMethod === method.id ? "border-[#00C2A8] bg-[#00C2A8]" : "border-black/20"
                      }`}>
                        {paymentMethod === method.id && <div className="w-full h-full rounded-full bg-[#F2F2F7] scale-[0.4]" />}
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === "upi" && (
                  <div>
                    <label className="block text-sm text-[#3c3c43] mb-1.5">Enter UPI ID</label>
                    <input value={upiId} onChange={e => setUpiId(e.target.value)}
                      placeholder="name@upi or number@paytm"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8]/50 text-sm" />
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This is a demo checkout. No actual payment will be processed. Razorpay integration is configured for production.</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("address")}
                    className="flex-none px-5 py-3 bg-black/5 border border-black/10 text-[#1c1c1e] font-semibold rounded-xl hover:bg-black/10 transition-colors text-sm">
                    ← Back
                  </button>
                  <button onClick={() => setStep("confirm")}
                    className="flex-1 py-3 bg-[#00C2A8] text-[#F5F3EE] font-bold rounded-xl hover:bg-[#00D4B8] transition-colors">
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-5">
                {/* Address Summary */}
                <div className="bg-white border border-black/[0.08] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1c1c1e] flex items-center gap-2"><MapPin className="w-4 h-4 text-[#00C2A8]" /> Delivering to</h3>
                    <button onClick={() => setStep("address")} className="text-xs text-[#00C2A8] hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-[#1c1c1e] font-medium">{addr.fullName}</p>
                  <p className="text-sm text-[#6c6c70]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                  <p className="text-sm text-[#6c6c70]">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-sm text-[#6c6c70]">{addr.phone}</p>
                </div>

                {/* Payment Summary */}
                <div className="bg-white border border-black/[0.08] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1c1c1e] flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#00C2A8]" /> Payment</h3>
                    <button onClick={() => setStep("payment")} className="text-xs text-[#00C2A8] hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-[#1c1c1e]">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                  {paymentMethod === "upi" && upiId && <p className="text-xs text-[#6c6c70] mt-1">{upiId}</p>}
                </div>

                {/* Order Items */}
                <div className="bg-white border border-black/[0.08] rounded-2xl p-6">
                  <h3 className="font-semibold text-[#1c1c1e] mb-4">Items ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-[#1c1c1e] truncate">{item.productName}</p>
                          <p className="text-[#6c6c70] text-xs">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-[#1c1c1e] font-medium shrink-0 ml-4">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-black/[0.08] mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-[#3c3c43]">
                      <span>GST Invoice included (18%)</span>
                      <span>{formatINR(gst)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#3c3c43]">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handlePlaceOrder} disabled={processing}
                  className="w-full py-4 bg-[#00C2A8] text-[#F5F3EE] font-bold rounded-xl hover:bg-[#00D4B8] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-lg">
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-[#F5F3EE]/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Place Order — ${formatINR(total)}`
                  )}
                </button>
                <p className="text-center text-xs text-[#8e8e93] flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  SSL encrypted · Powered by Razorpay
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-black/[0.08] rounded-2xl p-6 sticky top-24">
              <h3 className="font-display font-bold text-[#1c1c1e] mb-5">Order Summary</h3>
              <div className="space-y-3 mb-5">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#3c3c43] truncate flex-1">{item.productName} <span className="text-[#8e8e93]">×{item.quantity}</span></span>
                    <span className="text-[#1c1c1e] shrink-0 ml-2">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-black/[0.08] pt-4 space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6c6c70]">Subtotal</span>
                  <span className="text-[#1c1c1e]">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6c6c70]">GST (18%)</span>
                  <span className="text-[#1c1c1e]">{formatINR(gst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6c6c70]">Shipping</span>
                  <span className={shipping === 0 ? "text-[#00C2A8]" : "text-[#1c1c1e]"}>{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
                </div>
              </div>
              <div className="border-t border-black/[0.08] pt-4 flex justify-between font-bold text-lg">
                <span className="text-[#1c1c1e]">Total</span>
                <span className="text-[#00C2A8]">{formatINR(total)}</span>
              </div>
              <div className="mt-5 pt-5 border-t border-black/[0.08] space-y-3">
                {[
                  { icon: ShieldCheck, label: "GST Invoice included" },
                  { icon: Truck, label: "Fast delivery pan India" },
                  { icon: PackageCheck, label: "Easy 7-day returns" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#6c6c70]">
                    <item.icon className="w-3.5 h-3.5 text-[#00C2A8]" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
