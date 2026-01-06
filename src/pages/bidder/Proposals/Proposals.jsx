import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import { mockProposals } from "../../../mock/proposals";
import { mockTenders } from "../../../mock/tenders";

export default function Proposals() {
  // Flatten bids across tenders and attach tender title
  const bids = mockProposals.flatMap((p) => {
    const tender = mockTenders.find((t) => t.id === p.tenderId);
    return p.bids.map((b) => ({
      ...b,
      tenderId: p.tenderId,
      tenderTitle: tender?.title || p.tenderId,
    }));
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Proposals"
        description="Active proposals you have submitted"
      />

      <div className="bg-white border border-neutral-200 rounded-lg divide-y">
        {bids.length === 0 && (
          <div className="p-6 text-sm text-neutral-600">No proposals yet.</div>
        )}
        {bids.map((bid) => (
          <div key={bid.id} className="p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-900">
                {bid.organization}
              </div>
              <div className="text-xs text-neutral-600 mt-0.5">
                Tender: {bid.tenderTitle}
              </div>
              <div className="text-xs text-neutral-600">
                Submitted: {new Date(bid.submittedAt).toLocaleString()}
              </div>
            </div>
            <span className="text-xs rounded px-2.5 py-1 border border-amber-200 text-amber-700 bg-amber-50">
              {bid.status}
            </span>
            <Link
              to={`/bidder/proposals/${bid.id}`}
              className="text-primary-600 text-sm hover:underline"
            >
              Open Draft
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
