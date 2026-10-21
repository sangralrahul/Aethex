// Online payments through Razorpay (UPI, cards, netbanking, wallets), for
// worker/store.ts. Off until the keys are set in Cloudflare:
//   npx wrangler secret put RAZORPAY_KEY_ID        (rzp_test_... to try it, rzp_live_... for real payments)
//   npx wrangler secret put RAZORPAY_KEY_SECRET
//   npx wrangler secret put RAZORPAY_WEBHOOK_SECRET  (optional: the secret of a webhook to
//     https://aethex.in/api/store/razorpay/webhook with the payment.authorized, payment.captured,
//     order.paid, refund.processed and refund.failed events)
// The site opens Razorpay's checkout for an order created here, and the payment
// counts once its signature (and Razorpay's record of it) checks out.

export interface RazorpayEnv {
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}

const API = "https://api.razorpay.com/v1";

export const razorpayReady = (env: RazorpayEnv) => !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

export class RazorpayError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function call<T>(env: RazorpayEnv, method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  let r: Response;
  try {
    r = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Basic ${auth}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new RazorpayError("Couldn't reach Razorpay. Please try again in a moment.", 502);
  }
  const data = (await r.json().catch(() => null)) as (T & { error?: { description?: string } }) | null;
  if (!r.ok || !data) throw new RazorpayError(data?.error?.description || `Razorpay said no (${r.status}).`, r.status);
  return data;
}

export type RzpOrder = { id: string; amount: number; currency: string; receipt: string; status: string };
export type RzpPayment = { id: string; order_id: string; amount: number; currency: string; status: string; method?: string; captured?: boolean };
export type RzpRefund = { id: string; payment_id: string; amount: number; status: string; created_at?: number };

/**
 * A Razorpay order for one of ours: the amount in paise, our order number as the receipt.
 * Whether Razorpay captures payments by itself is the account's setting; a payment that is only
 * authorised is captured here (worker/store.ts), so either setting works.
 */
export const createRzpOrder = (env: RazorpayEnv, amountPaise: number, receipt: string, notes: Record<string, string>) =>
  call<RzpOrder>(env, "POST", "/orders", { amount: amountPaise, currency: "INR", receipt: receipt.slice(0, 40), notes });

export const fetchRzpPayment = (env: RazorpayEnv, paymentId: string) => call<RzpPayment>(env, "GET", `/payments/${encodeURIComponent(paymentId)}`);

/** The payments made against one of Razorpay's orders (to find one whose page closed before it reported back). */
export const fetchRzpOrderPayments = async (env: RazorpayEnv, rzpOrderId: string) =>
  (await call<{ items?: RzpPayment[] }>(env, "GET", `/orders/${encodeURIComponent(rzpOrderId)}/payments`)).items ?? [];

export const captureRzpPayment = (env: RazorpayEnv, paymentId: string, amountPaise: number) =>
  call<RzpPayment>(env, "POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency: "INR" });

/** Captures an authorised payment; when it was captured meanwhile (the webhook, or Razorpay itself), its record says so. */
export async function captureOrFetch(env: RazorpayEnv, paymentId: string, amountPaise: number): Promise<RzpPayment> {
  try {
    return await captureRzpPayment(env, paymentId, amountPaise);
  } catch (e) {
    const p = await fetchRzpPayment(env, paymentId);
    if (p.status === "captured") return p;
    throw e;
  }
}

export const refundRzpPayment = (env: RazorpayEnv, paymentId: string, amountPaise: number, notes: Record<string, string>) =>
  call<RzpRefund>(env, "POST", `/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, speed: "normal", notes });

/** Every refund of a payment, as Razorpay has them (pending, processed or failed; up to 100, far more than any order has). */
export const fetchRzpRefunds = async (env: RazorpayEnv, paymentId: string) =>
  (await call<{ items?: RzpRefund[] }>(env, "GET", `/payments/${encodeURIComponent(paymentId)}/refunds?count=100`)).items ?? [];

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** The checkout's proof of payment: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export async function paymentSignatureOk(env: RazorpayEnv, rzpOrderId: string, paymentId: string, signature: string): Promise<boolean> {
  if (!env.RAZORPAY_KEY_SECRET || !signature) return false;
  return sameText(await hmacHex(env.RAZORPAY_KEY_SECRET, `${rzpOrderId}|${paymentId}`), signature.toLowerCase());
}

/** A webhook from Razorpay: HMAC-SHA256 of the raw body with the webhook secret. */
export async function webhookSignatureOk(env: RazorpayEnv, body: string, signature: string): Promise<boolean> {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  return sameText(await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, body), signature.toLowerCase());
}

export const paise = (rupees: number) => Math.round(rupees * 100);
