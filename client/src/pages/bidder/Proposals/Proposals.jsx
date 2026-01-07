import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import useAuth from "../../../hooks/useAuth";
import { proposalService } from "../../../services/proposalService";

export default function Proposals() {
  const { token } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { proposals } = await proposalService.listMine(token);
        setBids(
          proposals.map((p) => ({
            id: p.proposal_id,
            tenderId: p.tender_id,
            tenderTitle: p.tender_title,
            status: p.status,
            submittedAt: p.created_at,
          }))
        );
      } catch (err) {
        setError(err.message || "Failed to load proposals");
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Proposals"
        description="Active proposals you have submitted"
      />

      <div className="bg-white border border-neutral-200 rounded-lg divide-y">
        {loading && (
          <div className="p-6 text-sm text-neutral-600">Loading...</div>
        )}
        {error && (
          <div className="p-6 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && bids.length === 0 && (
          <div className="p-6 text-sm text-neutral-600">No proposals yet.</div>
        )}
        {bids.map((bid) => (
          <div key={bid.id} className="p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-900">
                {bid.tenderTitle}
              </div>
              <div className="text-xs text-neutral-600">
                Created: {new Date(bid.submittedAt).toLocaleString()}
              </div>
            </div>
            <span className="text-xs rounded px-2.5 py-1 border border-amber-200 text-amber-700 bg-amber-50">
              {bid.status}
            </span>
            <Link
              to={`/bidder/proposals/${bid.id}`}
              className="text-primary-600 text-sm hover:underline"
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
