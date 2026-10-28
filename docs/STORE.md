# The AETHEX store

How the medical store works, and how to set it up on Cloudflare. Back to the [README](../README.md).

## Overview

The store sells genuine products from verified brands, with the brands' own photos and details:
**Dr Trust, Tynor, OMRON, Accu-Chek, Rossmax, 3M Littmann, MDF Instruments and HEINE**
(366 products in 13 categories: BP monitors, sphygmomanometers, stethoscopes, diagnostic
instruments, pulse oximeters, thermometers, nebulizers, diabetes care, weighing scales,
orthopaedic supports, pain relief, pillows and cushions, rehab and mobility).

- **Catalogue:** `artifacts/aethex/src/data/store/catalog.json`, served by the Worker
  (`/api/store/catalog`, `/api/store/products/:slug`) with the store's own prices and stock applied.
- **Price on request:** brands that don't publish Indian prices (MDF, Littmann, HEINE, Rossmax)
  take price requests until a price is set in the admin.
- **Orders:** cash on delivery, or paid online through Razorpay (UPI, cards, netbanking,
  wallets) once its keys are set, or by bank transfer (NEFT, RTGS, IMPS) once the store's
  account is set; priced again on the server; confirmation and status emails; tracking with
  order number and mobile; cancelling until shipped (a paid order is refunded).
- **Ways to buy:** buy again from past orders (and a "Buy it again" row in the shop), a
  pay-for-me link to send a cart to someone who pays, addresses kept in the account and
  picked at checkout, quick add from search, "add all" for bought-together items and the
  wishlist, gift orders (a message, delivered to someone else), buying for a clinic or
  business (with its GSTIN on the invoice once the store's GSTIN is set), order on WhatsApp,
  and "call me to order" requests that show in the admin.
- **Offers and coupons:** sales on brands or categories for a time, and coupon codes (percent
  with a cap, or an amount, from a minimum order), set in the admin.
- **Reviews:** only buyers of delivered orders can review, and the admin approves each one;
  the stars on products and in search results come from these reviews only.
- **Also:** delivery check by PIN code (India Post data in `public/pincodes`), back-in-stock and
  price-drop emails, compare up to three products, book sets by year, "bought together" from
  real orders, and quotation requests in a hospital's or college's account.
- **Admin:** `aethex.in/admin` for the accounts in `ADMIN_EMAILS`: orders (confirm, ship with
  tracking, deliver, cancel, refund, CSV export), price/book requests, bulk quotations, product
  prices, MRP, stock, country of origin and visibility, offers and coupons, and reviews.
- **Business details and policies:** `artifacts/aethex/src/config/business.ts`
  (legal name, address, GSTIN, phone, Grievance Officer, dispatch and delivery promises).

### Store setup (once)

```bash
npx wrangler d1 migrations apply aethex --remote   # creates the store tables (also created on first use)
npx wrangler secret put ADMIN_EMAILS               # e.g. you@aethex.in (comma-separated for several)
npx wrangler secret put STORE_EMAIL                # optional: inbox for new orders and requests
```

### Bank transfer and WhatsApp (optional)

"Order on WhatsApp" shows on product pages and the cart once the store's WhatsApp number is
set, and "Bank transfer" shows at checkout (for orders from ₹2,000) once the account's name,
number and IFSC are set. Until then neither is shown.

```bash
npx wrangler secret put STORE_WHATSAPP             # 10-digit mobile, e.g. 98XXXXXXXX
npx wrangler secret put STORE_BANK_ACCOUNT_NAME    # as on the account
npx wrangler secret put STORE_BANK_ACCOUNT_NUMBER
npx wrangler secret put STORE_BANK_IFSC            # e.g. HDFC0001234
npx wrangler secret put STORE_BANK_NAME            # optional: the bank's name and branch
```

An order paid by bank transfer waits for its money: when it reaches the account, open the
order in the admin and press "Mark paid" (with the transfer's reference, if you like). The
customer is told and the order is placed. One unpaid after 3 days is cancelled, and both
sides are emailed.

### Online payments (Razorpay, when you're ready)

Checkout offers cash on delivery only until both keys are set. Create API keys in the
Razorpay Dashboard (test keys start with `rzp_test_` and take no real money; use the
`rzp_live_` keys to go live), then:

```bash
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET    # optional, see below
```

Optional but recommended: in the Razorpay Dashboard, add a webhook to
`https://aethex.in/api/store/razorpay/webhook` with the events `payment.authorized`,
`payment.captured`, `order.paid`, `refund.processed` and `refund.failed`, and a secret of
your choosing; set the same secret as `RAZORPAY_WEBHOOK_SECRET`. Without it, a payment whose
page was closed early is still found when the order is opened, and by the hourly job; with it,
refunds made in the Razorpay Dashboard (and any that fail) show on the order too.
