# AETHEX

### AI-Powered Medical Commerce & Learning Platform

**AETHEX** is an AI-powered medical commerce platform designed for doctors, medical students, and healthcare learners. It combines medical product commerce with intelligent AI assistance, personalized learning tools, and a modern digital healthcare experience.

The platform is designed to make medical shopping and learning more accessible through AI-powered discovery, recommendations, assistance, and automated workflows.

---

## 🚀 Project Overview

Medical professionals and students often need to search across multiple platforms for medical equipment, study resources, learning tools, and reliable assistance.

AETHEX brings these experiences together into a single platform.

### The platform combines:

- 🛒 Medical product commerce
- 🤖 CADUS medical assistant
- 📚 Medical learning resources
- 🧠 AI-powered educational tools
- 🔎 Intelligent product discovery
- 💳 Checkout and order management
- 📦 Order tracking
- 🏪 Multi-seller marketplace functionality
- 📊 Admin and seller analytics
- 📱 PWA/offline capabilities

---

## 🎯 Problem

Medical students and healthcare professionals frequently face fragmented product discovery and learning experiences.

Finding the right medical equipment, study material, educational resources, and AI assistance can require multiple platforms.

**AETHEX solves this by creating a unified medical ecosystem where users can discover products, access learning resources, interact with AI, and complete commerce workflows from one platform.**

---

## 💡 Solution

AETHEX combines **AI + medical commerce + education** into a single experience.

Users can:

1. Search and discover medical products.
2. Explore products by category.
3. Receive AI-powered assistance.
4. Access medical learning resources.
5. Use AI tools for educational workflows.
6. Add products to a cart.
7. Complete checkout.
8. Track orders.
9. Manage their account and subscriptions.

---

## 🤖 CADUS

CADUS is the AI layer of AETHEX.

It provides an intelligent interface for medical and educational assistance.

### AI capabilities include:

- Medical Q&A
- Differential diagnosis assistance
- Deep research
- Medical image analysis
- Drug interaction information
- Dosage calculations
- Laboratory value assistance
- SOAP note assistance
- Medical MCQ assistance
- Patient education
- Procedure guidance
- Educational learning assistance
- Reference-style answers: key points, evidence-certainty labels and dose cards, with numbered sources
- A safety review of every clinical answer, and an on-device answer history that exports to CSV
- A privacy guard that hides patient identifiers before anything is sent
- Patient cases: a de-identified case sheet with a vitals timeline that Cadus reasons over and writes notes and letters from
- Institution protocols: local protocols, formulary and antibiotic policy that answers follow, shared across a team as a team pack
- Cadus modes, picked beside the message box: Auto, Fast, Think, Exam (high-yield facts, traps and MCQs), Simple (plain words) and Deep Dive, with a tone (Professional, Friendly, Mentor) and a length
- Deep Dive: plans the question, searches PubMed and guideline sites step by step (shown live), then writes a cited report that is safety-reviewed
- Cadus Crew: assistants with their own instructions, starters and tool, ready-made (Viva Examiner, NEET-PG Coach, Discharge Writer, Clinical Pharmacist, Thesis Guide and more) or your own
- Follow-up questions written for each answer, and branching a chat from any answer
- Case Simulator: a live patient to practise on (ask, examine, order tests, treat, call a senior) with changing vitals and a clock, then a scored debrief with the diagnosis, what was missed and teaching points
- Rx Safety Check: a typed, photographed or PDF prescription checked for one patient (doses, interactions, allergies, pregnancy, kidney, liver, age, duplicates), with generics, NLEM and Jan Aushadhi names, and Cadus's own interaction table as a second check
- Guideline Watch: the newest guidelines, meta-analyses and trials on PubMed for the specialties you follow (last 7, 30 or 90 days), summarised only from those records, with papers new since your last check marked and digests saved to the Library
- Report Explainer: a lab, imaging or pathology report (photo, PDF or text) as a summary for the doctor, with critical values first, and an explanation for the patient in their language to print or send on WhatsApp

> CADUS is intended as an educational and informational assistant and is not a replacement for qualified medical professionals.

---

## 🛍️ Medical Commerce

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

---

## 🧠 AI-Powered Commerce

AETHEX is designed around an **AI-assisted commerce workflow**:

```text
User Intent
     ↓
AI Understanding
     ↓
Product / Resource Discovery
     ↓
Relevant Recommendations
     ↓
User Selection
     ↓
Cart
     ↓
Checkout
     ↓
Order
     ↓
Tracking
```

This approach reduces the friction between **what a user needs** and **finding the appropriate product or resource**.

---

## 📚 Study Hub

The Study Hub brings medical education resources into the same platform.

### Features include:

- Medical coaching platform comparison
- NEET PG resources
- NEXT resources
- FMGE resources
- USMLE resources
- INI-CET resources
- Medical books
- Educational videos
- Learning paths
- Flashcards
- Quizzes
- Mentorship
- Webinars
- Institutional analytics

---

## ⚡ Key Features

### Commerce

- Product catalogue
- Search and filtering
- Product details
- Shopping cart
- Checkout
- Order management
- Order tracking
- Reviews and ratings
- Wishlist
- Multiple payment methods

### AI

- CADUS
- Natural-language interaction
- AI medical assistance
- AI educational tools
- AI image analysis
- AI research workflows
- Voice input

### Marketplace

- Seller registration
- Seller dashboard
- Product management
- Seller orders
- Seller analytics
- Seller payouts
- Public seller storefronts
- Admin seller approval

### Platform

- User authentication
- Account management
- Notifications
- Subscription management
- Dark/light mode
- Multi-language interface
- Voice search
- PWA support
- Responsive UI

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   AETHEX Frontend   │
                    │     React + Vite    │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
           Commerce         CADUS       Study Hub
                │              │              │
                └──────────────┼──────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
   Cloudflare D1        Anthropic        External APIs
        Database        Claude AI       Notifications
```

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- TypeScript
- Progressive Web App architecture

### Backend

- Node.js
- Express 5
- TypeScript

### Database

- Cloudflare D1 (SQLite)

### AI

- Anthropic Claude (text and vision)

### Integrations

- Resend
- Twilio
- Razorpay-ready checkout architecture

### Development

- pnpm
- TypeScript
- Git
- GitHub

---

## 🔐 Authentication & Security

AETHEX includes authentication and account-management workflows.

The application uses environment variables for sensitive integrations.

### Example environment variables

```env
ANTHROPIC_API_KEY=
# Optional: an NCBI API key raises PubMed's rate limit for Cadus Research
NCBI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BREVO_API_KEY=
BREVO_FROM_EMAIL=
# The store
ADMIN_EMAILS=
STORE_EMAIL=
# Online payments (optional: off until both keys are set)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

On Cloudflare these are Worker variables and secrets (`npx wrangler secret put NAME`).

**Never commit production API keys or secrets to GitHub.**

---

## ⚙️ Local Development

### 1. Clone the repository

```bash
git clone https://github.com/SANGRALRAHUL/AETHEX.git
cd AETHEX
```

### 2. Install pnpm

```bash
npm install -g pnpm
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Configure environment variables

Create the required environment configuration and add your API credentials.

### 5. Start development server

```bash
pnpm dev
```

### 6. Build for production

```bash
pnpm build
```

### 7. Run production server

```bash
pnpm start
```

---

## 📁 Project Structure

```text
AETHEX/
│
├── aethex/                 # Main application
│
├── artifacts/              # Project artifacts
├── attached_assets/        # Application assets
├── downloads/              # Downloadable resources
├── lib/                    # Shared libraries
├── scripts/                # Utility scripts
├── screenshots/             # Project screenshots
├── supabase/               # Database configuration
│
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── replit.md
```

---

## 🧩 Technical Challenges

### 1. AI Reliability

AI responses need to remain useful while handling different types of medical and educational requests.

**Approach:** structured AI workflows, model fallback strategies, and dedicated AI helper functions.

### 2. AI + Commerce Integration

Connecting conversational AI with product discovery creates a challenge between natural-language requests and structured product data.

**Approach:** separate AI interaction from commerce services and connect them through structured application workflows.

### 3. Multi-Service Architecture

The application combines commerce, AI, authentication, notifications, database services, and seller functionality.

**Approach:** modular frontend and backend architecture with dedicated service boundaries.

### 4. Performance

A large application with AI, product data, dashboards, and multiple user workflows requires careful performance management.

**Approach:** caching strategies, optimized API workflows, PWA capabilities, and modular application components.

---

## 🔮 Roadmap

Future improvements include:

- More advanced AI shopping agents
- Personalized product recommendations
- Conversational cart creation
- AI-driven product comparison
- Smarter medical learning personalization
- Advanced seller intelligence
- Automated commerce workflows
- More payment integrations
- Expanded healthcare marketplace capabilities

---

## 🎥 Project Demonstration

A 5-minute project demonstration is available as part of the project submission.

**Demo:** Add your video link here.

---

## 🌐 Project

**GitHub:**  
https://github.com/SANGRALRAHUL/AETHEX

---

## 👨‍💻 Author

### Rahul Sangral

Full-Stack Developer | AI Builder | Entrepreneur

**GitHub:**  
https://github.com/SANGRALRAHUL

---

## 📄 License

This project is licensed under the **MIT License**.

---

## ⭐ Vision

> **Make medicine more accessible, intelligent, and effortless.**

AETHEX aims to build a unified platform where **AI, healthcare commerce, and medical education** work together to create a better experience for the next generation of healthcare professionals.
