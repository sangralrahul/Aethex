import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Component, Suspense, lazy, useState, useEffect, type ComponentType, type ReactNode } from "react";
import { isLoginHost, isCadusHost, isAuthHost, isMainHost, isDownloadsHost, isAethexDomain, downloadsUrl, loginUrl, cadusUrl, currentPortal } from "@/lib/host";
import { reloadFresh } from "@/lib/fresh-start";
import { misplaced } from "@/lib/portals";


/** The download page lives at downloads.aethex.in; aethex.in/downloads (and the
 *  Cadus link to it) goes there. Off the aethex.in domain it renders in place. */
function DownloadsRoute() {
  if (typeof window !== "undefined" && isAethexDomain() && !isDownloadsHost()) {
    window.location.replace(downloadsUrl());
    return null;
  }
  return <Downloads />;
}

/**
 * Pages load on demand, so the first visit downloads only the page it opens.
 * After a new deploy an old tab (or a browser holding the previous version)
 * may ask for a chunk that no longer exists: load the current site once,
 * fresh from the network.
 */
function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().then(
      (m) => { try { sessionStorage.removeItem("aethex_chunk_reload"); } catch { /* blocked */ } return m; },
      (err) => {
        let tried = true;
        try { tried = !!sessionStorage.getItem("aethex_chunk_reload"); sessionStorage.setItem("aethex_chunk_reload", "1"); } catch { /* blocked */ }
        if (!tried && navigator.onLine !== false) { void reloadFresh(); return new Promise<{ default: T }>(() => {}); }
        throw err;
      },
    ),
  );
}

/** A page that couldn't load (offline, or a deploy replaced it): say so instead of a blank screen. */
class PageError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.error("[aethex] the page failed to load:", error);
    // A newer version of the site taking over (service worker update) fixes most of these: load it.
    try { navigator.serviceWorker?.addEventListener("controllerchange", () => window.location.reload(), { once: true }); } catch { /* not supported */ }
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return (
      <div role="alert" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center", fontFamily: "system-ui, sans-serif", color: "#0F1729" }}>
        <b style={{ fontSize: 18 }}>{offline ? "You're offline" : "This page couldn't load"}</b>
        <span style={{ maxWidth: 420, fontSize: 14, color: "#4A5264" }}>{offline ? "This page hasn't been opened on this device before, so it needs a connection. Cadus and the pages you've visited still work offline." : "Check your connection and try again."}</span>
        <button onClick={() => void reloadFresh()} style={{ height: 36, padding: "0 16px", border: 0, borderRadius: 10, background: "#0F1729", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </div>
    );
  }
}

/** Shown for the moment a page is loading. */
function PageLoading() {
  return (
    <div role="status" aria-label="Loading" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
      <span style={{ width: 26, height: 26, borderRadius: "50%", border: "2.5px solid rgba(15,23,41,.12)", borderTopColor: "#007A6C", animation: "aethexSpin .8s linear infinite" }} />
      <style>{"@keyframes aethexSpin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => { window.location.href = to; }, [to]);
  return null;
}




function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PortalWorkspace } from "@/components/layout/Workspace";
import { QuickStart } from "@/components/layout/QuickStart";
import { sitePortal } from "@/lib/portals";

const Home = lazyPage(() => import("@/pages/Home"));
const Hub = lazyPage(() => import("@/pages/Hub"));
const FindHome = lazyPage(() => import("@/pages/find/FindHome"));
const FindDoctors = lazyPage(() => import("@/pages/find/FindDoctors"));
const DoctorPage = lazyPage(() => import("@/pages/find/DoctorPage"));
const ListPractice = lazyPage(() => import("@/pages/find/ListPractice"));
const Practice = lazyPage(() => import("@/pages/find/Practice"));
const MyAppointments = lazyPage(() => import("@/pages/find/MyAppointments"));
const FindAdmin = lazyPage(() => import("@/pages/find/FindAdmin"));
const ClinicsPage = lazyPage(() => import("@/pages/find/Clinics").then((m) => ({ default: m.ClinicsPage })));
const ClinicPage = lazyPage(() => import("@/pages/find/Clinics").then((m) => ({ default: m.ClinicPage })));
const AskPage = lazyPage(() => import("@/pages/find/AskDoctor").then((m) => ({ default: m.AskPage })));
const QuestionPage = lazyPage(() => import("@/pages/find/AskDoctor").then((m) => ({ default: m.QuestionPage })));
const ArticlesPage = lazyPage(() => import("@/pages/find/Articles").then((m) => ({ default: m.ArticlesPage })));
const ArticlePage = lazyPage(() => import("@/pages/find/Articles").then((m) => ({ default: m.ArticlePage })));
const WriteArticle = lazyPage(() => import("@/pages/find/Articles").then((m) => ({ default: m.WriteArticle })));
const PrescriptionPage = lazyPage(() => import("@/pages/find/Prescription"));
const HealthRecords = lazyPage(() => import("@/pages/find/HealthRecords"));
const WhichDoctor = lazyPage(() => import("@/pages/find/DoctorTools").then((m) => ({ default: m.WhichDoctor })));
const SavedDoctors = lazyPage(() => import("@/pages/find/DoctorTools").then((m) => ({ default: m.SavedDoctors })));
const FamilyPage = lazyPage(() => import("@/pages/find/DoctorTools").then((m) => ({ default: m.FamilyPage })));
const Products = lazyPage(() => import("@/pages/Products"));
const ProductDetail = lazyPage(() => import("@/pages/ProductDetail"));
const BookDetail = lazyPage(() => import("@/pages/BookDetail"));
const Cart = lazyPage(() => import("@/pages/Cart"));
const Wishlist = lazyPage(() => import("@/pages/Wishlist"));
const Flashcards = lazyPage(() => import("@/pages/Flashcards"));
const CadusAI = lazyPage(() => import("@/pages/CadusAI"));
const CadusSignIn = lazyPage(() => import("@/pages/CadusSignIn"));
const CadusShared = lazyPage(() => import("@/pages/CadusShared"));
const CadusLegal = lazyPage(() => import("@/pages/CadusLegal"));
const CadusPlans = lazyPage(() => import("@/pages/CadusPlans"));
const Downloads = lazyPage(() => import("@/pages/Downloads"));
const legal = (kind: "terms" | "privacy" | "disclaimer" | "about") => () => <CadusLegal kind={kind} />;
const LegalTerms = legal("terms"), LegalPrivacy = legal("privacy"), LegalDisclaimer = legal("disclaimer"), LegalAbout = legal("about");
const Invoice = lazyPage(() => import("@/pages/Invoice"));
const CustomTest = lazyPage(() => import("@/pages/study/CustomTest"));
const VitalsPage = lazyPage(() => import("@/pages/find/DoctorTools4"));
const StudyGroups = lazyPage(() => import("@/components/study/StudyBits3").then((m) => ({ default: m.StudyGroups })));
const Sectional = lazyPage(() => import("@/components/study/StudyBits3").then((m) => ({ default: m.Sectional })));
const LibraryPrint = lazyPage(() => import("@/components/study/StudyBits3").then((m) => ({ default: m.LibraryPrint })));
const StudyModeration = lazyPage(() => import("@/components/study/StudyBits3").then((m) => ({ default: m.Moderation })));
const MyLibrary = lazyPage(() => import("@/pages/study/MyLibrary"));
const BulkEstimate = lazyPage(() => import("@/pages/BulkEstimate"));
const ApprovePage = lazyPage(() => import("@/components/store/BulkExtras2").then((m) => ({ default: m.ApprovePage })));
const ApprovalsList = lazyPage(() => import("@/components/store/BulkExtras2").then((m) => ({ default: m.ApprovalsList })));
const EquipmentPage = lazyPage(() => import("@/components/store/BulkExtras2").then((m) => ({ default: m.EquipmentPage })));
const OffersPage = lazyPage(() => import("@/pages/Offers"));
const TeamPage = lazyPage(() => import("@/components/store/BulkExtras3").then((m) => ({ default: m.TeamPage })));
const SpendPage = lazyPage(() => import("@/components/store/BulkExtras3").then((m) => ({ default: m.SpendPage })));
const PurchaseOrderPage = lazyPage(() => import("@/components/store/BulkExtras3").then((m) => ({ default: m.PurchaseOrderPage })));
const EmailPrefs = lazyPage(() => import("@/components/home/EmailPrefs"));
const GiftPage = lazyPage(() => import("@/components/store/StoreExtras3").then((m) => ({ default: m.GiftPage })));
const ReorderPage = lazyPage(() => import("@/pages/Reorder"));
const OrderTracking = lazyPage(() => import("@/pages/OrderTracking"));
const Orders = lazyPage(() => import("@/pages/Orders"));
const MyReviews = lazyPage(() => import("@/pages/MyReviews"));
const MyQuotes = lazyPage(() => import("@/pages/MyQuotes"));
const Compare = lazyPage(() => import("@/pages/Compare"));
const AlertsStop = lazyPage(() => import("@/pages/AlertsStop"));
const AdminSellers = lazyPage(() => import("@/pages/AdminSellers"));
const SellerStorefront = lazyPage(() => import("@/pages/SellerStorefront"));
const StudyHub = lazyPage(() => import("@/pages/StudyHub"));
const Checkout = lazyPage(() => import("@/pages/Checkout"));
const Account = lazyPage(() => import("@/pages/Account"));
const StoreAdmin = lazyPage(() => import("@/pages/StoreAdmin"));
const Brands = lazyPage(() => import("@/pages/Brands"));
const OrderPlaced = lazyPage(() => import("@/pages/OrderPlaced"));
const StorePolicy = lazyPage(() => import("@/pages/StorePolicy"));

const Blog = lazyPage(() => import("@/pages/Blog"));
const BlogPost = lazyPage(() => import("@/pages/BlogPost"));
const MedicalNews = lazyPage(() => import("@/pages/News"));
const AdminBlog = lazyPage(() => import("@/pages/AdminBlog"));
const ClinicalTools = lazyPage(() => import("@/pages/ClinicalTools"));
const DrugReference = lazyPage(() => import("@/pages/DrugReference"));
const BMICalculator = lazyPage(() => import("@/pages/tools/BMICalculator"));
const DrugInteractionChecker = lazyPage(() => import("@/pages/tools/DrugInteractionChecker"));
const DosageCalculator = lazyPage(() => import("@/pages/tools/DosageCalculator"));
const MedicalAbbreviations = lazyPage(() => import("@/pages/tools/MedicalAbbreviations"));
const SymptomChecker = lazyPage(() => import("@/pages/tools/SymptomChecker"));
const RiskCalculator = lazyPage(() => import("@/pages/tools/RiskCalculator"));
const PrescriptionGenerator = lazyPage(() => import("@/pages/tools/PrescriptionGenerator"));
const LabValueInterpreter = lazyPage(() => import("@/pages/tools/LabValueInterpreter"));
const CaseStudySimulator = lazyPage(() => import("@/pages/tools/CaseStudySimulator"));
const ClinicalDecisionSupport = lazyPage(() => import("@/pages/tools/ClinicalDecisionSupport"));
const ECGAnalyzer = lazyPage(() => import("@/pages/tools/ECGAnalyzer"));
const RadiologyAssistant = lazyPage(() => import("@/pages/tools/RadiologyAssistant"));
const Contact = lazyPage(() => import("@/pages/Contact"));
const Login = lazyPage(() => import("@/pages/Login"));
const Signup = lazyPage(() => import("@/pages/Signup"));
const Onboarding = lazyPage(() => import("@/pages/Onboarding"));
const SettingsPage = lazyPage(() => import("@/pages/Settings"));
const PrivacyPolicy = lazyPage(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazyPage(() => import("@/pages/TermsOfService"));
const MedicalDisclaimer = lazyPage(() => import("@/pages/MedicalDisclaimer"));

const InstitutionHub = lazyPage(() => import("@/pages/InstitutionHub"));
const BulkPortal = lazyPage(() => import("@/pages/BulkPortal"));
const CmeHub = lazyPage(() => import("@/pages/CmeHub"));
const CaseOfTheDay = lazyPage(() => import("@/pages/CaseOfTheDay"));
const DrugInteractionCheckerPage = lazyPage(() => import("@/pages/DrugInteractionCheckerPage"));
const NeetPg = lazyPage(() => import("@/pages/NeetPg"));
const MedicalBooks = lazyPage(() => import("@/pages/MedicalBooks"));
import CadusQuickConsult from "@/components/cadus/CadusQuickConsult";
const MedicalKnowledgeHub = lazyPage(() => import("@/pages/StudyHub/MedicalKnowledgeHub/index"));
const SubjectPage = lazyPage(() => import("@/pages/StudyHub/MedicalKnowledgeHub/SubjectPage"));
const TopicPage = lazyPage(() => import("@/pages/StudyHub/MedicalKnowledgeHub/TopicPage"));
const DepartmentPage = lazyPage(() => import("@/pages/StudyHub/MedicalKnowledgeHub/DepartmentPage"));
const ConditionPage = lazyPage(() => import("@/pages/StudyHub/MedicalKnowledgeHub/ConditionPage"));
const SellerRegister = lazyPage(() => import("@/pages/seller/Register"));
const SellerLogin = lazyPage(() => import("@/pages/seller/Login"));
const SellerDashboard = lazyPage(() => import("@/pages/seller/Dashboard"));
const SellerProducts = lazyPage(() => import("@/pages/seller/Products"));
const SellerOrders = lazyPage(() => import("@/pages/seller/Orders"));
const SellerPayouts = lazyPage(() => import("@/pages/seller/Payouts"));
const SellerAnalytics = lazyPage(() => import("@/pages/seller/Analytics"));
const SellerSettings = lazyPage(() => import("@/pages/seller/Settings"));
const CalculatorPage = lazyPage(() => import("@/pages/Calculator"));
const Jobs = lazyPage(() => import("@/pages/Jobs"));
const Community = lazyPage(() => import("@/pages/Community"));
const ClinicalCases = lazyPage(() => import("@/pages/ClinicalCases"));

const StudyPlanner = lazyPage(() => import("@/pages/StudyPlanner"));
const MockTest = lazyPage(() => import("@/pages/MockTest"));
const LiveClasses = lazyPage(() => import("@/pages/LiveClasses"));
const HospitalDirectory = lazyPage(() => import("@/pages/HospitalDirectory"));
const DrugAlerts = lazyPage(() => import("@/pages/DrugAlerts"));
const PatientEducation = lazyPage(() => import("@/pages/PatientEducation"));
const TelemedicineDirectory = lazyPage(() => import("@/pages/TelemedicineDirectory"));
const CmeCertificate = lazyPage(() => import("@/pages/CmeCertificate"));
const AiScribe = lazyPage(() => import("@/pages/AiScribe"));
const Analytics = lazyPage(() => import("@/pages/Analytics"));
const AppWaitlist = lazyPage(() => import("@/pages/AppWaitlist"));
const Enterprise = lazyPage(() => import("@/pages/Enterprise"));

const AiDiagnosis = lazyPage(() => import("@/pages/AiDiagnosis"));
const AiAnswerEval = lazyPage(() => import("@/pages/AiAnswerEval"));
const LearningPath = lazyPage(() => import("@/pages/LearningPath"));
const SmartFlashcards = lazyPage(() => import("@/pages/SmartFlashcards"));
const VideoCases = lazyPage(() => import("@/pages/VideoCases"));
const Webinars = lazyPage(() => import("@/pages/Webinars"));
const Mentorship = lazyPage(() => import("@/pages/Mentorship"));
const Leaderboard = lazyPage(() => import("@/pages/Leaderboard"));
const InstitutionAnalytics = lazyPage(() => import("@/pages/InstitutionAnalytics"));
const QuizBuilder = lazyPage(() => import("@/pages/QuizBuilder"));
const ProgressTracker = lazyPage(() => import("@/pages/ProgressTracker"));
const ConsultHistory = lazyPage(() => import("@/pages/ConsultHistory"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 1000 * 30 },
  },
});

function Router() {
  const [sellerSession, setSellerSession] = useState<any | null>(() => {
    try {
      const raw = localStorage.getItem("aethex_seller_info");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const handleSellerLogin = (seller: any) => setSellerSession(seller);
  const handleSellerLogout = () => {
    localStorage.removeItem("aethex_seller_code");
    localStorage.removeItem("aethex_seller_info");
    setSellerSession(null);
    window.location.href = "/seller/login";
  };

  const sellerProps = { seller: sellerSession, onLogout: handleSellerLogout };

  const isLoginSubdomain = typeof window !== "undefined" && isLoginHost();
  const isCadusSubdomain = typeof window !== "undefined" && isCadusHost();
  const forcedApp = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("aethexApp") : null;
  const legalPage = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("legal") : null;

  if (legalPage === "privacy-policy" || legalPage === "terms-of-service" || legalPage === "medical-disclaimer") {
    const LegalPage = legalPage === "privacy-policy"
      ? PrivacyPolicy
      : legalPage === "terms-of-service"
        ? TermsOfService
        : MedicalDisclaimer;
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#F2F2F7" }}>
        <main className="flex-1 relative z-[1]">
          <LegalPage />
        </main>
      </div>
    );
  }

  // auth.aethex.in: the Cadus sign-in, with the pages it links to.
  if ((typeof window !== "undefined" && isAuthHost()) || forcedApp === "auth") {
    return (
      <Switch>
        <Route path="/terms" component={LegalTerms} />
        <Route path="/privacy" component={LegalPrivacy} />
        <Route path="/disclaimer" component={LegalDisclaimer} />
        <Route path="/about" component={LegalAbout} />
        <Route path="/plans" component={CadusPlans} />
        <Route component={CadusSignIn} />
      </Switch>
    );
  }

  // downloads.aethex.in: the Cadus download page; the installers themselves are
  // served by the Worker from R2 at /cadus/<version>/<file>.
  if ((typeof window !== "undefined" && isDownloadsHost()) || forcedApp === "downloads") {
    return <Downloads />;
  }

  if (isLoginSubdomain || forcedApp === "login") {
    return (
      <Switch>
        <Route path="/signup" component={Signup} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  if (isCadusSubdomain || forcedApp === "cadus") {
    return (
      <Switch>
        <Route path="/" component={CadusAI} />
        <Route path="/login" component={CadusSignIn} />
        <Route path="/sign-in" component={CadusSignIn} />
        <Route path="/shared" component={CadusShared} />
        <Route path="/terms" component={LegalTerms} />
        <Route path="/privacy" component={LegalPrivacy} />
        <Route path="/disclaimer" component={LegalDisclaimer} />
        <Route path="/about" component={LegalAbout} />
        <Route path="/plans" component={CadusPlans} />
        <Route path="/downloads" component={DownloadsRoute} />
        <Route path="/ai-assistant" component={CadusAI} />
        <Route path="/ai-assistant-classic">{() => <Redirect to="/" />}</Route>
        <Route path="/cadus-standalone" component={CadusAI} />
        <Route component={CadusAI} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Full-screen pages (no Navbar/Footer) */}
      <Route path="/ai-assistant" component={CadusAI} />
      <Route path="/ai-assistant/sign-in" component={CadusSignIn} />
      <Route path="/ai-assistant/shared" component={CadusShared} />
      <Route path="/ai-assistant/terms" component={LegalTerms} />
      <Route path="/ai-assistant/privacy" component={LegalPrivacy} />
      <Route path="/ai-assistant/disclaimer" component={LegalDisclaimer} />
      <Route path="/ai-assistant/about" component={LegalAbout} />
      <Route path="/ai-assistant/plans" component={CadusPlans} />
      <Route path="/downloads" component={DownloadsRoute} />
      <Route path="/ai-assistant-classic">{() => <Redirect to="/ai-assistant" />}</Route>
      <Route path="/cadus-standalone" component={CadusAI} />

      <Route path="/settings" component={SettingsPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/onboarding" component={Onboarding} />

      <Route path="/seller/register" component={SellerRegister} />
      <Route path="/seller/login">{() => <SellerLogin onLogin={handleSellerLogin} />}</Route>

      {/* Seller Dashboard pages (no Navbar/Footer) */}
      <Route path="/seller/dashboard">{() => sellerSession ? <SellerDashboard {...sellerProps} /> : <SellerLogin onLogin={handleSellerLogin} />}</Route>
      <Route path="/seller/products">{() => sellerSession ? <SellerProducts {...sellerProps} /> : <SellerLogin onLogin={handleSellerLogin} />}</Route>
      <Route path="/seller/orders">{() => sellerSession ? <SellerOrders {...sellerProps} /> : <SellerLogin onLogin={handleSellerLogin} />}</Route>
      <Route path="/seller/payouts">{() => sellerSession ? <SellerPayouts {...sellerProps} /> : <SellerLogin onLogin={handleSellerLogin} />}</Route>
      <Route path="/seller/analytics">{() => sellerSession ? <SellerAnalytics {...sellerProps} /> : <SellerLogin onLogin={handleSellerLogin} />}</Route>
      <Route path="/seller/settings">{() => sellerSession ? <SellerSettings {...sellerProps} /> : <SellerLogin onLogin={handleSellerLogin} />}</Route>

      {/* HOME — with full Navbar */}
      <Route path="/">
        {() => {
          if (typeof window !== "undefined" && isCadusHost()) {
            window.location.replace(cadusUrl("/"));
            return null;
          }

          // Update 58: aethex.in is the front door (Hub); each portal subdomain opens on its own home page.
          const portal = currentPortal();
          const page = portal === "store" ? <Home />
            : portal === "study" ? <StudyHub />
            : portal === "doctors" ? <FindHome />
            : portal === "hospitals" ? <BulkPortal segment="hospital" />
            : portal === "medicalcolleges" ? <BulkPortal segment="college" />
            : <Hub />;
          // aethex.in itself (update 61) shows the five dashboards and nothing else: no header, no footer.
          if (!portal) {
            return (
              <div className="ax-site ax-hub">
                <main>
                  <Suspense fallback={<PageLoading />}>
                    <Hub />
                  </Suspense>
                </main>
              </div>
            );
          }
          return (

            <div className={`ax-site ax-portal-${portal}`}>
              <Navbar />
              {/* update 87: the portal's workspace sidebar, and a compact quick start above its home page */}
              <PortalWorkspace portal={portal as Exclude<typeof portal, "cadus" | null>}>
                <main className="ax-ws-home">
                  <QuickStart portal={portal as Exclude<typeof portal, "cadus" | null>} />
                  <Suspense fallback={<PageLoading />}>
                    {page}
                  </Suspense>
                </main>
              </PortalWorkspace>
              <Footer />
            </div>
          );
        }}
      </Route>

      {/* Checkout: a quiet page of its own (its own header and footer, no shop menus) */}
      <Route path="/checkout">
        {() => (
          <div className="ax-site ax-co-site">
            <Suspense fallback={<PageLoading />}>
              <Checkout />
            </Suspense>
          </div>
        )}
      </Route>

      {/* All inner pages: the site header (sticky) and footer */}
      <Route>
        {() => (
          <div className="ax-site ax-inner">
            <Navbar inner />
            <MaybeWorkspace>
            <main className="relative z-[1]">
              <Suspense fallback={<PageLoading />}>
              <Switch>

                {/* Aethex Doctors (doctors.aethex.in; doctors.aethex.in redirects there): doctors, bookings, the practice dashboard (update 58) */}
                <Route path="/store" component={Home} />
                <Route path="/find" component={FindHome} />
                <Route path="/doctors" component={FindDoctors} />
                <Route path="/doctor/:slug" component={DoctorPage} />
                <Route path="/list-your-practice" component={ListPractice} />
                <Route path="/practice" component={Practice} />
                <Route path="/appointments" component={MyAppointments} />
                <Route path="/vitals" component={VitalsPage} />
                <Route path="/admin/doctors" component={FindAdmin} />
                <Route path="/clinics" component={ClinicsPage} />
                <Route path="/clinic/:key" component={ClinicPage} />
                <Route path="/ask" component={AskPage} />
                <Route path="/ask/:id" component={QuestionPage} />
                <Route path="/articles" component={ArticlesPage} />
                <Route path="/articles/:slug" component={ArticlePage} />
                <Route path="/practice/write" component={WriteArticle} />
                <Route path="/prescription/:id" component={PrescriptionPage} />
                <Route path="/records" component={HealthRecords} />
                <Route path="/which-doctor" component={WhichDoctor} />
                <Route path="/saved-doctors" component={SavedDoctors} />
                <Route path="/family" component={FamilyPage} />

                {/* Books Library */}
                <Route path="/books" component={MedicalBooks} />
                <Route path="/books/:slug" component={BookDetail} />

                {/* Shop routes (also alias /products) */}
                <Route path="/shop" component={Products} />
                <Route path="/shop/:id" component={ProductDetail} />
                <Route path="/products" component={Products} />
                <Route path="/products/:id" component={ProductDetail} />
                <Route path="/category/:slug" component={Products} />
                <Route path="/brand/:slug" component={Products} />
                <Route path="/brands" component={Brands} />

                {/* Cart & Checkout */}
                <Route path="/cart" component={Cart} />
                <Route path="/wishlist" component={Wishlist} />
                <Route path="/compare" component={Compare} />
                <Route path="/alerts/stop" component={AlertsStop} />
                <Route path="/flashcards" component={Flashcards} />
                <Route path="/flashcards/:deckId" component={Flashcards} />

                {/* Orders */}
                <Route path="/orders" component={Orders} />
                <Route path="/bulk-estimate" component={BulkEstimate} />
                <Route path="/approve/:token" component={ApprovePage} />
                <Route path="/approvals" component={ApprovalsList} />
                <Route path="/equipment" component={EquipmentPage} />
                <Route path="/team" component={TeamPage} />
                <Route path="/spend" component={SpendPage} />
                <Route path="/purchase-order/:id" component={PurchaseOrderPage} />
                <Route path="/email-preferences" component={EmailPrefs} />
                <Route path="/offers" component={OffersPage} />
                <Route path="/gift/:token" component={GiftPage} />
                <Route path="/reorder" component={ReorderPage} />
                <Route path="/orders/:id/invoice" component={Invoice} />
                <Route path="/orders/track" component={OrderTracking} />
                <Route path="/order/:id" component={OrderPlaced} />
                <Route path="/shipping-policy" component={StorePolicy} />
                <Route path="/returns-policy" component={StorePolicy} />
                <Route path="/cancellation-policy">{() => <Redirect to="/returns-policy" />}</Route>
                <Route path="/grievance" component={StorePolicy} />

                {/* Account */}
                <Route path="/account" component={Account} />

                {/* Drug Reference */}
                <Route path="/drug-reference" component={DrugReference} />

                {/* Clinical Tools */}
                <Route path="/tools" component={ClinicalTools} />
                <Route path="/tools/bmi-calculator" component={BMICalculator} />
                <Route path="/tools/drug-interaction" component={DrugInteractionChecker} />
                <Route path="/tools/dosage-calculator" component={DosageCalculator} />
                <Route path="/tools/abbreviations" component={MedicalAbbreviations} />
                <Route path="/tools/symptom-checker" component={SymptomChecker} />
                <Route path="/tools/risk-calculator" component={RiskCalculator} />
                <Route path="/tools/prescription" component={PrescriptionGenerator} />
                <Route path="/tools/lab-interpreter" component={LabValueInterpreter} />
                <Route path="/tools/case-simulator" component={CaseStudySimulator} />
                <Route path="/tools/clinical-decision" component={ClinicalDecisionSupport} />
                <Route path="/tools/ecg-analyzer" component={ECGAnalyzer} />
                <Route path="/tools/radiology" component={RadiologyAssistant} />

                {/* Study Hub */}
                <Route path="/study-hub" component={StudyHub} />
                <Route path="/cme-hub" component={CmeHub} />
                <Route path="/case-of-the-day" component={CaseOfTheDay} />
                <Route path="/drug-interaction-checker" component={DrugInteractionCheckerPage} />
                <Route path="/custom-test" component={CustomTest} />
                <Route path="/study-groups" component={StudyGroups} />
                <Route path="/sectional-tests" component={Sectional} />
                <Route path="/my-library/print" component={LibraryPrint} />
                <Route path="/study-moderation" component={StudyModeration} />
                <Route path="/my-library" component={MyLibrary} />
                <Route path="/neet-pg" component={NeetPg} />

                {/* Medical Knowledge Hub */}
                <Route path="/study-hub/medical-knowledge-hub" component={MedicalKnowledgeHub} />
                <Route path="/study-hub/medical-knowledge-hub/subjects" component={MedicalKnowledgeHub} />
                <Route path="/study-hub/medical-knowledge-hub/departments" component={MedicalKnowledgeHub} />
                <Route path="/study-hub/medical-knowledge-hub/subjects/:subjectSlug/:topicSlug" component={TopicPage} />
                <Route path="/study-hub/medical-knowledge-hub/subjects/:subjectSlug" component={SubjectPage} />
                <Route path="/study-hub/medical-knowledge-hub/departments/:deptSlug/:conditionSlug" component={ConditionPage} />
                <Route path="/study-hub/medical-knowledge-hub/departments/:deptSlug" component={DepartmentPage} />

                {/* Institution Hub */}
                <Route path="/institutions" component={InstitutionHub} />
                {/* Aethex for Hospitals / Medical Colleges: bulk buying and quotations */}
                <Route path="/hospitals">{() => <BulkPortal segment="hospital" />}</Route>
                <Route path="/medical-colleges">{() => <BulkPortal segment="college" />}</Route>
                <Route path="/colleges">{() => <Redirect to="/medical-colleges" />}</Route>

                {/* Reviews */}
                <Route path="/my-reviews" component={MyReviews} />
                <Route path="/account/quotations" component={MyQuotes} />
                <Route path="/my-quotations">{() => <Redirect to="/account/quotations" />}</Route>

                {/* Admin */}
                <Route path="/admin" component={StoreAdmin} />
                <Route path="/admin/store" component={StoreAdmin} />
                <Route path="/admin/reviews">{() => <Redirect to="/admin" />}</Route>
                <Route path="/admin/sellers" component={AdminSellers} />
                <Route path="/admin/blog" component={AdminBlog} />

                {/* Seller storefronts */}
                <Route path="/seller/:code/store" component={SellerStorefront} />

                {/* Contact */}
                <Route path="/contact" component={Contact} />

                {/* Legal */}
                <Route path="/privacy-policy" component={PrivacyPolicy} />
                <Route path="/terms-of-service" component={TermsOfService} />
                <Route path="/medical-disclaimer" component={MedicalDisclaimer} />
                <Route path="/privacy">{() => <Redirect to="/privacy-policy" />}</Route>
                <Route path="/terms">{() => <Redirect to="/terms-of-service" />}</Route>
                <Route path="/disclaimer">{() => <Redirect to="/medical-disclaimer" />}</Route>

                {/* Blog & News */}
                <Route path="/blog/:slug" component={BlogPost} />
                <Route path="/blog" component={Blog} />
                <Route path="/news" component={MedicalNews} />

                {/* New feature pages */}
                <Route path="/calculator" component={CalculatorPage} />
                <Route path="/jobs" component={Jobs} />
                <Route path="/community" component={Community} />
                <Route path="/cases" component={ClinicalCases} />

                {/* Phase 3 pages */}
                <Route path="/study-planner" component={StudyPlanner} />
                <Route path="/mock-test" component={MockTest} />
                <Route path="/live-classes" component={LiveClasses} />
                <Route path="/hospital-directory" component={HospitalDirectory} />
                <Route path="/drug-alerts" component={DrugAlerts} />
                <Route path="/patient-education" component={PatientEducation} />
                <Route path="/telemedicine-directory" component={TelemedicineDirectory} />
                <Route path="/cme-certificate" component={CmeCertificate} />
                <Route path="/ai-scribe" component={AiScribe} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/app" component={AppWaitlist} />
                <Route path="/enterprise" component={Enterprise} />

                <Route path="/diagnosis" component={AiDiagnosis} />
                <Route path="/answer-eval" component={AiAnswerEval} />
                <Route path="/learning-path" component={LearningPath} />
                <Route path="/flashcards" component={SmartFlashcards} />
                <Route path="/video-cases" component={VideoCases} />
                <Route path="/webinars" component={Webinars} />
                <Route path="/mentorship" component={Mentorship} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/institution-analytics" component={InstitutionAnalytics} />
                <Route path="/quiz-builder" component={QuizBuilder} />

                {/* Monetization & Growth */}
                <Route path="/progress-tracker" component={ProgressTracker} />
                <Route path="/my-consults" component={ConsultHistory} />

                <Route component={NotFound} />
              </Switch>
              </Suspense>
            </main>
            </MaybeWorkspace>
            <Footer />
          </div>
        )}
      </Route>
    </Switch>
  );
}

/** Update 87: inner pages on a portal subdomain sit in that portal's workspace (sidebar); elsewhere, as they are. */
function MaybeWorkspace({ children }: { children: ReactNode }) {
  const portal = sitePortal();
  return portal ? <PortalWorkspace portal={portal}>{children}</PortalWorkspace> : <>{children}</>;
}

/** Update 65: on the aethex.in domain every page opens on its own portal's subdomain (aethex.in shows only the front door). */
function PortalGuard({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const to = typeof window !== "undefined" ? misplaced(location, window.location.search + window.location.hash) : null;
  useEffect(() => { if (to) window.location.replace(to); }, [to]);
  return to ? <PageLoading /> : <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <PageError>
            <Suspense fallback={<PageLoading />}>
              <PortalGuard><Router /></PortalGuard>
            </Suspense>
          </PageError>
          <CadusQuickConsult />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
