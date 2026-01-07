import { useParams } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import { mockTenders } from "../../../mock/tenders";
import { mockProposals } from "../../../mock/proposals";
import { useMemo, useState } from "react";

export default function BidEvaluation() {
  const { tenderId } = useParams();
  const tender = mockTenders.find((t) => t.id === tenderId);
  const bidsEntry = mockProposals.find((x) => x.tenderId === tenderId);
  const bids = bidsEntry?.bids || [];
  const [selected, setSelected] = useState(bids[0] || null);

  const headerDesc = useMemo(() => {
    const deadline = tender?.deadline
      ? new Date(tender.deadline).toLocaleDateString()
      : "—";
    return `Submission Deadline: ${deadline} · Total Bids: ${bids.length}`;
  }, [tender, bids.length]);

  return (
    <div className="px-6 py-6 mx-auto max-w-7xl">
      <PageHeader
        title={tender?.title || "Bid Evaluation"}
        description={headerDesc}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bid List */}
        <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden md:col-span-1">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900">Bids</h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {bids.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors ${
                  selected?.id === b.id ? "bg-neutral-50" : "bg-white"
                }`}
              >
                <div className="text-sm font-medium text-neutral-900">
                  {b.organization}
                </div>
                <div className="text-xs text-neutral-600">
                  Submitted {new Date(b.submittedAt).toLocaleString()}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Submitted
                  </span>
                </div>
              </button>
            ))}
            {!bids.length && (
              <div className="px-4 py-6 text-sm text-neutral-600">
                No bids submitted yet.
              </div>
            )}
          </div>
        </section>

        {/* Bid Detail Panel */}
        <section className="bg-white border border-neutral-200 rounded-lg md:col-span-2">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Proposal</h3>
            <button
              className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50"
              disabled
            >
              Download Proposal
            </button>
          </div>
          <div className="p-6">
            {selected ? (
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-neutral-500">Organization</div>
                  <div className="text-base font-semibold text-neutral-900">
                    {selected.organization}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Sections</div>
                  <div className="mt-2 space-y-3">
                    {selected.sections.map((s, idx) => (
                      <div
                        key={idx}
                        className="border border-neutral-200 rounded-md p-3"
                      >
                        <div className="text-sm font-medium text-neutral-900">
                          {s.title}
                        </div>
                        <div className="text-sm text-neutral-700 mt-1">
                          {s.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">
                    Compliance Hints
                  </div>
                  <div className="mt-2 text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-md p-3">
                    {selected.complianceHints}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-600">
                Select a bid to view details.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
