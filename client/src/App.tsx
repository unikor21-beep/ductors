import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));
const FindPartner = lazy(() => import("./pages/FindPartner"));
const PartnerDetail = lazy(() => import("./pages/PartnerDetail"));
const VentilationCalc = lazy(() => import("./pages/VentilationCalc"));
const PartnersInfo = lazy(() => import("./pages/PartnersInfo"));
const PartnerRegister = lazy(() => import("./pages/PartnerRegister"));
const MyPage = lazy(() => import("./pages/MyPage"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Marketing = lazy(() => import("./pages/Marketing"));
const PartnerTerms = lazy(() => import("./pages/PartnerTerms"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/quote-request" component={QuoteRequest} />
        <Route path="/find-partner" component={FindPartner} />
        <Route path="/partner/:id" component={PartnerDetail} />
        <Route path="/ventilation" component={VentilationCalc} />
        <Route path="/partners-info" component={PartnersInfo} />
        <Route path="/partner-register" component={PartnerRegister} />
        <Route path="/mypage" component={MyPage} />
        <Route path="/dashboard" component={PartnerDashboard} />
        <Route path="/dashboard/:tab" component={PartnerDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/:tab" component={AdminDashboard} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/marketing" component={Marketing} />
        <Route path="/partner-terms" component={PartnerTerms} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
