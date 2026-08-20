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
- 🤖 CADUS AI medical assistant
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

## 🤖 CADUS AI

CADUS AI is the AI layer of AETHEX.

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

> CADUS AI is intended as an educational and informational assistant and is not a replacement for qualified medical professionals.

---

## 🛍️ Medical Commerce

AETHEX provides a dedicated medical marketplace with categories including:

- Scrubs
- Aprons
- Medical Books
- Stethoscopes
- Surgical Instruments
- Dental Supplies
- Laboratory Supplies
- Medical Equipment

Users can search, filter, sort, review, purchase, and track products.

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

- CADUS AI
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
           Commerce         CADUS AI       Study Hub
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
        Supabase             Groq          External APIs
        Database           AI Models       Notifications
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

- Supabase
- PostgreSQL

### AI

- Groq API
- Llama models
- Vision-capable AI models

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
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

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
