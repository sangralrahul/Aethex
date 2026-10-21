/**
 * The store's policies: shipping and delivery (/shipping-policy), returns,
 * replacement, refunds and cancellation (/returns-policy), and grievances and
 * seller details (/grievance). The promises come from src/config/business.ts
 * and the delivery rules from lib/store/rules.ts, so pages and policies agree.
 * Paying online (and refunds to the way you paid) is described once the store
 * has switched it on (useStoreConfig: the Razorpay keys are set).
 * Styles: src/shop.css (.ax-policy).
 */
import { Link, useLocation } from "wouter";
import { ShopHead } from "@/components/shop/ShopHead";
import { useSeo } from "@/hooks/use-seo";
import { BUSINESS } from "@/config/business";
import { COD_LIMIT, DELIVERY_FEE, FREE_DELIVERY_FROM, ONLINE_LIMIT } from "@/lib/store/rules";
import { useStoreConfig } from "@/lib/store/api";
import { formatINR } from "@/lib/utils";

const PAGES = {
  "/shipping-policy": { title: "Shipping & delivery", desc: "Where we deliver, delivery charges, dispatch and delivery times, and how to pay." },
  "/returns-policy": { title: "Returns, replacement & cancellation", desc: "Replacements for damaged, defective or wrong items, refunds and cancelling an order." },
  "/grievance": { title: "Grievances & seller details", desc: "How to raise a complaint, our Grievance Officer, and who sells on Aethex." },
} as const;
type PagePath = keyof typeof PAGES;

function Contact() {
  return (
    <ul className="ax-policy-contact">
      <li><b>Email</b> <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>
      {BUSINESS.phone && <li><b>Phone</b> <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a></li>}
      {BUSINESS.hours && <li><b>Hours</b> {BUSINESS.hours}</li>}
    </ul>
  );
}

function Shipping() {
  const { data: config } = useStoreConfig();
  const online = !!config?.onlinePayments;
  return (
    <>
      <h2>Where we deliver</h2>
      <p>We deliver across India through courier partners. If we can't deliver to your PIN code, we'll tell you before dispatch and cancel the order at no cost to you.</p>
      <h2>Delivery charges</h2>
      <p>Delivery is free on orders of {formatINR(FREE_DELIVERY_FROM)} or more (after discounts). Smaller orders have a delivery charge of {formatINR(DELIVERY_FEE)}. You see the charge before you place the order.</p>
      <h2>Dispatch and delivery times</h2>
      <p>Orders ship {BUSINESS.dispatch}. Delivery is {BUSINESS.delivery}; remote areas can take longer. Items sold on price request ship after you've accepted the price we quote.</p>
      <h2>Confirming your order</h2>
      <p>We may call or message the number you gave to confirm a cash-on-delivery order and the address before it ships. If we can't reach you after a few tries, we may cancel the order and let you know.</p>
      <h2>Payment</h2>
      {online
        ? <p>You can pay online when you place the order (UPI, debit and credit cards, netbanking and wallets, processed securely by Razorpay; we never see or keep your card or UPI details), or pay cash on delivery: you pay the courier when the order arrives. Cash on delivery is available on orders up to {formatINR(COD_LIMIT)}, and paying online on orders up to {formatINR(config?.onlineLimit ?? ONLINE_LIMIT)}. Prices are inclusive of all taxes.</p>
        : <p>Orders are paid by cash on delivery: you pay the courier when the order arrives. Cash on delivery is available on orders up to {formatINR(COD_LIMIT)}. Prices are inclusive of all taxes.</p>}
      <h2>Tracking</h2>
      <p>When your order ships we send the courier's name and tracking number by email (if you gave one). You can also follow it any time on <Link href="/orders/track">Track your order</Link> with your order number and mobile number.</p>
      <h2>At delivery</h2>
      <p>Please check that the package is sealed and undamaged. If it isn't, you can refuse it, or accept it and tell us within {BUSINESS.replacementDays} days with photos so we can replace the item (see <Link href="/returns-policy">Returns & replacement</Link>).</p>
      <h2>Questions</h2>
      <Contact />
    </>
  );
}

function Returns() {
  const d = BUSINESS.replacementDays;
  const { data: config } = useStoreConfig();
  const online = !!config?.onlinePayments;
  return (
    <>
      <h2>Damaged, defective or wrong items</h2>
      <p>If an item arrives damaged, doesn't work, or isn't what you ordered, tell us within {d} days of delivery. Write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your order number and photos or a short video of the item and its packaging. We'll arrange a pickup where the courier offers one, and send a replacement at no cost. If we can't replace it, we refund it in full.</p>
      <h2>Hygiene and personal-use items</h2>
      <p>Orthopaedic supports and braces, pillows and cushions, and diabetes consumables (test strips, lancets) can't be returned once opened or used, unless they are faulty, damaged or not what you ordered.</p>
      <h2>Change of mind</h2>
      <p>Because these are health and medical products, we can't take items back for a change of mind once they are delivered. You can cancel free of charge before your order ships, or refuse it at the door.</p>
      <h2>Manufacturer's warranty</h2>
      <p>Products carry the manufacturer's warranty shown on the product page and the warranty card. For a fault after the first {d} days, the brand's service centre handles repair or replacement under that warranty; write to us and we'll help you reach them.</p>
      <h2>Refunds</h2>
      {online && <p>An order paid online is refunded to the account, card or UPI app you paid with, through Razorpay; a refund usually reaches you within 5 to 7 business days of being sent.</p>}
      <p>{online ? "An order paid in cash is refunded" : "As orders are paid in cash, refunds are made"} by bank transfer (NEFT or IMPS) or UPI to an account in your name that you give us. We send the refund within 7 business days of approving it, or of receiving the returned item where a pickup is needed.</p>
      <h2 id="cancel">Cancelling an order</h2>
      <p>You can cancel an order any time before it ships: open it from the confirmation page, <Link href="/orders">My orders</Link> or <Link href="/orders/track">Track your order</Link>, or write to us. Once it has shipped it can't be cancelled online, but you can refuse it at delivery. Nothing is charged for a cancelled cash-on-delivery order.{online ? " A cancelled order that was paid online is refunded in full, to the way you paid." : ""}</p>
      <h2>Questions</h2>
      <Contact />
    </>
  );
}

function Grievance() {
  const g = BUSINESS.grievance;
  const seller: [string, string][] = [["Seller", BUSINESS.legalName], ["Registered office", BUSINESS.address], ["GSTIN", BUSINESS.gstin], ["CIN", BUSINESS.cin]];
  return (
    <>
      <h2>Raise a complaint</h2>
      <p>Write to us first with your order number and what went wrong; most problems are solved within a day or two.</p>
      <Contact />
      <h2>Grievance Officer</h2>
      <p>If you're not satisfied with our answer, write to our Grievance Officer. We acknowledge every complaint within 48 hours and resolve it within one month of receiving it, as required by the Consumer Protection (E-Commerce) Rules, 2020.</p>
      <ul className="ax-policy-contact">
        {g.name && <li><b>Name</b> {g.name}</li>}
        <li><b>Designation</b> {g.designation}</li>
        <li><b>Email</b> <a href={`mailto:${g.email}`}>{g.email}</a></li>
        {g.phone && <li><b>Phone</b> {g.phone}</li>}
        {BUSINESS.address && <li><b>Address</b> {BUSINESS.address}</li>}
      </ul>
      <h2>Who sells on Aethex</h2>
      <p>Products on Aethex are sold by {BUSINESS.legalName}. We buy genuine products from the brands and their authorised distributors; each product page names its manufacturer and, where known, its country of origin.</p>
      <dl className="ax-policy-dl">
        {seller.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <p className="fine">See also our <Link href="/terms-of-service">terms of service</Link>, <Link href="/privacy-policy">privacy policy</Link>, <Link href="/shipping-policy">shipping policy</Link> and <Link href="/returns-policy">returns policy</Link>.</p>
    </>
  );
}

export default function StorePolicy() {
  const [location] = useLocation();
  const path = (Object.keys(PAGES).find((p) => location.startsWith(p)) ?? "/shipping-policy") as PagePath;
  const page = PAGES[path];
  useSeo({ title: `${page.title} | Aethex Store`, description: page.desc, path });
  return (
    <div className="ax-shop-page">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Policies" }, { label: page.title }]} title={page.title} sub={page.desc} />
      <div className="ax-wrap ax-policy-wrap">
        <nav className="ax-policy-nav" aria-label="Store policies">
          {(Object.keys(PAGES) as PagePath[]).map((p) => <Link key={p} href={p} className={p === path ? "on" : ""}>{PAGES[p].title}</Link>)}
          <Link href="/terms-of-service">Terms of service</Link>
          <Link href="/privacy-policy">Privacy policy</Link>
        </nav>
        <article className="ax-policy">
          {path === "/shipping-policy" ? <Shipping /> : path === "/returns-policy" ? <Returns /> : <Grievance />}
        </article>
      </div>
    </div>
  );
}
