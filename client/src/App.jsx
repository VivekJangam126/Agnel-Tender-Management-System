import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Hero from "./pages/public/Landing/components/Hero";
import ProblemStatement from "./pages/public/Landing/components/ProblemStatement";
import SolutionOverview from "./pages/public/Landing/components/SolutionOverview";
import HowItWorks from "./pages/public/Landing/components/HowItWorks";
import AICapabilities from "./pages/public/Landing/components/AICapabilities";
import KeyFeatures from "./pages/public/Landing/components/KeyFeatures";
import Security from "./pages/public/Landing/components/Security";
import CallToAction from "./pages/public/Landing/components/CallToAction";
import Login from "./pages/public/Login/Login";
import Signup from "./pages/public/Signup/Signup";
import TenderDetail from "./pages/public/Tender/TenderDetail";
import AdminDashboard from "./pages/admin/Dashboard/Dashboard";
import TendersList from "./pages/admin/TendersList/TendersList";
import TenderView from "./pages/admin/TenderView/TenderView";
import BidderDashboard from "./pages/bidder/Dashboard/Dashboard";
import BidderTenderDiscovery from "./pages/bidder/BidderTenderDiscovery";
import TenderAnalysis from "./pages/bidder/TenderAnalysis";
import ProposalEdit from "./pages/bidder/ProposalEdit";
import ProposalWorkspace from "./pages/bidder/ProposalWorkspace";
import ProposalDrafting from "./pages/bidder/ProposalDrafting";
import BidderHistory from "./pages/bidder/BidderHistory";
import AnalyzePage from "./pages/bidder/AnalyzePage";
import TenderCreate from "./pages/admin/TenderCreate/TenderCreate";
import Analytics from "./pages/admin/Analytics/Analytics";
import Profile from "./pages/admin/Profile/Profile";
import BidEvaluationList from "./pages/admin/BidEvaluation/BidEvaluationList";
import BidEvaluation from "./pages/admin/BidEvaluation/BidEvaluation";

// Landing Page Component
function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemStatement />
      <SolutionOverview />
      <HowItWorks />
      <AICapabilities />
      <KeyFeatures />
      <Security />
      <CallToAction />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/tender/:id" element={<TenderDetail />} />
          </Route>

          {/* Admin Routes - All protected with authority role */}
          <Route element={<ProtectedRoute allowedRoles={["authority"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="tenders" element={<TendersList />} />
              <Route path="tender/view/:tenderId" element={<TenderView />} />
              <Route path="tender/create" element={<TenderCreate />} />
              <Route path="tender/edit/:tenderId" element={<TenderCreate />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="bid-evaluation" element={<BidEvaluationList />} />
              <Route path="bid-evaluation/:tenderId" element={<BidEvaluation />} />
            </Route>
          </Route>

          {/* Bidder Routes - All protected with bidder role */}
          <Route element={<ProtectedRoute allowedRoles={["bidder"]} />}>
            <Route path="/bidder/dashboard" element={<BidderDashboard />} />
            <Route path="/bidder/tenders" element={<BidderTenderDiscovery />} />
            <Route path="/bidder/analyze" element={<AnalyzePage />} />
            <Route path="/bidder/tenders/:id/analyze" element={<TenderAnalysis />} />
            <Route path="/bidder/proposals/:id" element={<ProposalEdit />} />
            <Route path="/bidder/proposal/:tenderId" element={<ProposalWorkspace />} />
            <Route path="/bidder/proposal-drafting" element={<ProposalDrafting />} />
            <Route path="/bidder/history" element={<BidderHistory />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
