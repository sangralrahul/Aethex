import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getRedirectResult } from "firebase/auth";
import { useUserAuth } from "@/hooks/use-user-auth";
import { isLoginHost, isCadusHost, isMainHost, loginUrl, cadusUrl } from "@/lib/host";

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

import { Navbar, BrandSwitcherBar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import BookDetail from "@/pages/BookDetail";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import Flashcards from "@/pages/Flashcards";
import AiAssistant from "@/pages/AiAssistant";
import OrderTracking from "@/pages/OrderTracking";
import Orders from "@/pages/Orders";
import MyReviews from "@/pages/MyReviews";
import AdminReviews from "@/pages/AdminReviews";
import AdminSellers from "@/pages/AdminSellers";
import SellerStorefront from "@/pages/SellerStorefront";
import StudyHub from "@/pages/StudyHub";
import Checkout from "@/pages/Checkout";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";

import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import MedicalNews from "@/pages/News";
import AdminBlog from "@/pages/AdminBlog";
import ClinicalTools from "@/pages/ClinicalTools";
import DrugReference from "@/pages/DrugReference";
import BMICalculator from "@/pages/tools/BMICalculator";
import DrugInteractionChecker from "@/pages/tools/DrugInteractionChecker";
import DosageCalculator from "@/pages/tools/DosageCalculator";
import MedicalAbbreviations from "@/pages/tools/MedicalAbbreviations";
import SymptomChecker from "@/pages/tools/SymptomChecker";
import RiskCalculator from "@/pages/tools/RiskCalculator";
import PrescriptionGenerator from "@/pages/tools/PrescriptionGenerator";
import LabValueInterpreter from "@/pages/tools/LabValueInterpreter";
import CaseStudySimulator from "@/pages/tools/CaseStudySimulator";
import ClinicalDecisionSupport from "@/pages/tools/ClinicalDecisionSupport";
import ECGAnalyzer from "@/pages/tools/ECGAnalyzer";
import RadiologyAssistant from "@/pages/tools/RadiologyAssistant";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Onboarding from "@/pages/Onboarding";
import SettingsPage from "@/pages/Settings";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import MedicalDisclaimer from "@/pages/MedicalDisclaimer";

import InstitutionHub from "@/pages/InstitutionHub";
import CmeHub from "@/pages/CmeHub";
import CaseOfTheDay from "@/pages/CaseOfTheDay";
import DrugInteractionCheckerPage from "@/pages/DrugInteractionCheckerPage";
import NeetPg from "@/pages/NeetPg";
import MedicalBooks from "@/pages/MedicalBooks";
import CadusQuickConsult from "@/components/cadus/CadusQuickConsult";
import MedicalKnowledgeHub from "@/pages/StudyHub/MedicalKnowledgeHub/index";
import SubjectPage from "@/pages/StudyHub/MedicalKnowledgeHub/SubjectPage";
import TopicPage from "@/pages/StudyHub/MedicalKnowledgeHub/TopicPage";
import DepartmentPage from "@/pages/StudyHub/MedicalKnowledgeHub/DepartmentPage";
import ConditionPage from "@/pages/StudyHub/MedicalKnowledgeHub/ConditionPage";
import SellerRegister from "@/pages/seller/Register";
import SellerLogin from "@/pages/seller/Login";
import SellerDashboard from "@/pages/seller/Dashboard";
import SellerProducts from "@/pages/seller/Products";
import SellerOrders from "@/pages/seller/Orders";
import SellerPayouts from "@/pages/seller/Payouts";
import SellerAnalytics from "@/pages/seller/Analytics";
import SellerSettings from "@/pages/seller/Settings";
import CalculatorPage from "@/pages/Calculator";
import Jobs from "@/pages/Jobs";
import Community from "@/pages/Community";
import ClinicalCases from "@/pages/ClinicalCases";

import StudyPlanner from "@/pages/StudyPlanner";
import MockTest from "@/pages/MockTest";
import LiveClasses from "@/pages/LiveClasses";
import HospitalDirectory from "@/pages/HospitalDirectory";
import DrugAlerts from "@/pages/DrugAlerts";
import PatientEducation from "@/pages/PatientEducation";
import TelemedicineDirectory from "@/pages/TelemedicineDirectory";
import CmeCertificate from "@/pages/CmeCertificate";
import AiScribe from "@/pages/AiScribe";
import Analytics from "@/pages/Analytics";
import AppWaitlist from "@/pages/AppWaitlist";
import Enterprise from "@/pages/Enterprise";

import AiDiagnosis from "@/pages/AiDiagnosis";
import AiAnswerEval from "@/pages/AiAnswerEval";
import LearningPath from "@/pages/LearningPath";
import SmartFlashcards from "@/pages/SmartFlashcards";
import VideoCases from "@/pages/VideoCases";
import Webinars from "@/pages/Webinars";
import Mentorship from "@/pages/Mentorship";
import Leaderboard from "@/pages/Leaderboard";
import InstitutionAnalytics from "@/pages/InstitutionAnalytics";
import QuizBuilder from "@/pages/QuizBuilder";
import ProgressTracker from "@/pages/ProgressTracker";
import ConsultHistory from "@/pages/ConsultHistory";

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

  return (
    <Switch>
      {/* ── Subdomain: login.aethex.in ── */}
      {isLoginSubdomain && (
        <>
          <Route path="/" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/onboarding" component={Onboarding} />
        </>
      )}

      {/* ── Subdomain: cadus.aethex.in ── */}
      {isCadusSubdomain && (
        <>
          <Route path="/" component={AiAssistant} />
          <Route path="/ai-assistant" component={AiAssistant} />
        </>
      )}

      {/* On the main domain, auth pages live on login.aethex.in */}
      {isMainHost() && (
        <>
          <Route path="/login"><ExternalRedirect to={loginUrl("/")} /></Route>
          <Route path="/signup"><ExternalRedirect to={loginUrl("/signup")} /></Route>
        </>
      )}

      {/* Full-screen pages (no Navbar/Footer) */}
      <Route path="/ai-assistant"><ExternalRedirect to={cadusUrl("/")} /></Route>
      <Route path="/cadus-standalone"><ExternalRedirect to={cadusUrl("/")} /></Route>

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
            window.location.replace("/ai-assistant");
            return null;
          }
          return (

            <div className="flex flex-col min-h-screen" style={{ background: "#FAFAF8" }}>
              <div className="fixed top-0 left-0 right-0 z-[60]">
                <BrandSwitcherBar />
                <Navbar />
              </div>
              <main className="flex-1 pt-[141px] relative z-[1]">
                <Home />
              </main>
              <Footer />
            </div>
          );
        }}
      </Route>

      {/* All inner pages — NO Navbar, NO fixed header */}
      <Route>
        {() => (
          <div className="flex flex-col min-h-screen" style={{ background: "#F2F2F7" }}>
            <main className="flex-1 relative z-[1]" style={{ background: "#F2F2F7" }}>
              <Switch>

                {/* Books Library */}
                <Route path="/books" component={MedicalBooks} />
                <Route path="/books/:slug" component={BookDetail} />

                {/* Shop routes (also alias /products) */}
                <Route path="/shop" component={Products} />
                <Route path="/shop/:id" component={ProductDetail} />
                <Route path="/products" component={Products} />
                <Route path="/products/:id" component={ProductDetail} />
                <Route path="/category/:slug" component={Products} />

                {/* Cart & Checkout */}
                <Route path="/cart" component={Cart} />
                <Route path="/wishlist" component={Wishlist} />
                <Route path="/flashcards" component={Flashcards} />
                <Route path="/flashcards/:deckId" component={Flashcards} />
                <Route path="/checkout" component={Checkout} />

                {/* Orders */}
                <Route path="/orders" component={Orders} />
                <Route path="/orders/track" component={OrderTracking} />

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
                <Route path="/colleges" component={() => <InstitutionHub mode="colleges" />} />
                <Route path="/hospitals" component={() => <InstitutionHub mode="hospitals" />} />

                {/* Reviews */}
                <Route path="/my-reviews" component={MyReviews} />

                {/* Admin */}
                <Route path="/admin" component={Admin} />
                <Route path="/admin/reviews" component={AdminReviews} />
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
            </main>
            <Footer />
          </div>
        )}
      </Route>
    </Switch>
  );
}

function FirebaseAuthHandler() {
  const { googleLogin } = useUserAuth();
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) googleLogin(result.user);
    }).catch(() => {});
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FirebaseAuthHandler />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
          <CadusQuickConsult />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
