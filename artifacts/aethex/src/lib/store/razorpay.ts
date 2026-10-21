/**
 * Razorpay's checkout on the site (UPI, cards, netbanking, wallets): its script
 * loads only when someone pays online, and opens for an order the Worker made
 * (worker/razorpay.ts). Whatever the checkout reports, the Worker checks the
 * payment with Razorpay before the order counts as paid.
 */
import type { RazorpayCheckout, RazorpayPaid } from "./api";

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayInstance = { open(): void; on(event: string, cb: (r: { error?: { description?: string; reason?: string } }) => void): void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;
/** The checkout script's constructor, once loaded. */
const rzp = () => (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;

let loading: Promise<void> | null = null;
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No browser"));
  if (rzp()) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => (rzp() ? resolve() : reject(new Error("no Razorpay")));
      s.onerror = () => reject(new Error("blocked"));
      document.head.appendChild(s);
    }).catch((e) => { loading = null; throw e; });
  }
  return loading;
}

export type PayOutcome = { paid: RazorpayPaid } | { closed: true; failure?: string };

/** Opens the checkout and settles once the customer pays, or closes it (with the last failure, if a payment failed). */
export async function payWithRazorpay(ck: RazorpayCheckout): Promise<PayOutcome> {
  try {
    await loadRazorpay();
  } catch {
    throw new Error("The payment window couldn't load. Check your connection (or an ad blocker), then try again, or pay cash on delivery.");
  }
  return new Promise<PayOutcome>((resolve) => {
    let failure = "";
    let done = false;
    const finish = (o: PayOutcome) => { if (!done) { done = true; resolve(o); } };
    const Checkout = rzp()!;
    const rz = new Checkout({
      key: ck.key,
      amount: ck.amount,
      currency: ck.currency,
      name: ck.name,
      description: ck.description,
      order_id: ck.orderId,
      prefill: ck.prefill,
      theme: { color: "#2B7A6F" },
      handler: (r: RazorpayPaid) => finish({ paid: r }),
      modal: { ondismiss: () => finish({ closed: true, failure: failure || undefined }), confirm_close: true },
    });
    rz.on("payment.failed", (r) => { failure = r.error?.description || "The payment didn't go through."; });
    rz.open();
  });
}
