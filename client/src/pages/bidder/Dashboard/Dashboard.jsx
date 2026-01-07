import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import ActiveProposals from "./components/ActiveProposals";
import SavedTenders from "./components/SavedTenders";
import RecentlyViewed from "./components/RecentlyViewed";

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Dashboard"
        description="Track your active proposals and shortlisted tenders"
      >
        <Link
          to="/bidder/saved"
          className="px-4 py-2 rounded-md border border-primary-600 text-primary-600 hover:bg-primary-50 text-sm font-medium"
        >
          Browse Tenders
        </Link>
      </PageHeader>

      <ActiveProposals />
      <SavedTenders />
      <RecentlyViewed />
    </div>
  );
}
