import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import BidderLayout from "../../../components/bidder-layout/BidderLayout";
import PageHeader from "../../../components/shared/PageHeader";
import ActiveProposals from "./components/ActiveProposals";
import SavedTenders from "./components/SavedTenders";
import RecentlyViewed from "./components/RecentlyViewed";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user, navigate]);

  if (!user || loading) return null;

  return (
    <BidderLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Dashboard"
          description="Track your active proposals and shortlisted tenders"
        >
          <Link
            to="/bidder/tenders"
            className="px-4 py-2 rounded-md border border-primary-600 text-primary-600 hover:bg-primary-50 text-sm font-medium"
          >
            Browse Tenders
          </Link>
        </PageHeader>

        <ActiveProposals />
        <SavedTenders />
        <RecentlyViewed />
      </div>
    </BidderLayout>
  );
}
