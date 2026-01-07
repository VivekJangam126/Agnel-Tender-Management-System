import { Link } from "react-router-dom";
import { mockProposals } from "../../../../mock/proposals";
import { mockTenders } from "../../../../mock/tenders";

export default function ActiveProposals() {
  // Flatten bids and attach tender info
  const activeDrafts = mockProposals.flatMap((p) => {
    const tender = mockTenders.find((t) => t.id === p.tenderId);
    return p.bids.map((b) => ({
      ...b,
      tenderId: p.tenderId,
      tenderTitle: tender?.title || "Untitled Tender",
      authority: "Municipal Corporation", // Mock authority
      lastEdited: new Date(b.submittedAt),
    }));
  });

  if (activeDrafts.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Active Proposals
        </h2>
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600 mb-4">
            You don't have any active proposals yet.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/bidder/saved"
              className="text-primary-600 hover:underline text-sm"
            >
              View saved tenders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Active Proposals
      </h2>
      <div className="bg-white border border-neutral-200 rounded-lg divide-y">
        {activeDrafts.map((draft) => (
          <div
            key={draft.id}
            className="p-6 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {draft.tenderTitle}
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  {draft.authority}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Draft
                  </span>
                  <span className="text-xs text-neutral-500">
                    Last edited: {draft.lastEdited.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Link
                to={`/bidder/proposals/${draft.id}`}
                className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700 whitespace-nowrap"
              >
                Continue Drafting
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
