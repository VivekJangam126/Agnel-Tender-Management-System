import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import BidderLayout from "./layouts/BidderLayout";

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
import BidderDashboard from "./pages/bidder/Dashboard/Dashboard";
import BidderProfile from "./pages/bidder/Profile/Profile";
import BidderProposals from "./pages/bidder/Proposals/Proposals";
import BidderSaved from "./pages/bidder/Saved/Saved";
import ProposalDraft from "./pages/bidder/ProposalDraft/ProposalDraft";
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
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/tender/:id" element={<TenderDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tender/create" element={<TenderCreate />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="bid-evaluation" element={<BidEvaluationList />} />
          <Route path="bid-evaluation/:tenderId" element={<BidEvaluation />} />
        </Route>

        {/* Bidder Routes */}
        <Route path="/bidder" element={<BidderLayout />}>
          <Route path="dashboard" element={<BidderDashboard />} />
          <Route path="saved-tenders" element={<BidderSaved />} />
          <Route
            path="saved"
            element={<Navigate to="/bidder/saved-tenders" replace />}
          />
          <Route path="proposals" element={<BidderProposals />} />
          <Route path="proposals/:proposalId" element={<ProposalDraft />} />
          <Route path="profile" element={<BidderProfile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
