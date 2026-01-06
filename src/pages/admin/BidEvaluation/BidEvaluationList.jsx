import PageHeader from "../../../components/shared/PageHeader";
import { mockTenders } from "../../../mock/tenders";
import { Link } from "react-router-dom";

export default function BidEvaluationList() {
  const published = mockTenders.filter((t) => t.status === "published");
  return (
    <div className="px-6 py-6 mx-auto max-w-7xl">
      <PageHeader
        title="Bid Evaluation"
        description="Select a published tender to browse received bids."
      />
      <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">
            Published Tenders
          </h3>
        </div>
        <div className="divide-y divide-neutral-200">
          {published.map((t) => (
            <div
              key={t.id}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-neutral-900">{t.title}</div>
                <div className="text-xs text-neutral-600">
                  Deadline {new Date(t.deadline).toLocaleDateString()}
                </div>
              </div>
              <Link
                to={`/admin/bid-evaluation/${t.id}`}
                className="px-3 py-2 rounded-md border border-neutral-300 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50"
              >
                View Bids
              </Link>
            </div>
          ))}
          {!published.length && (
            <div className="px-4 py-6 text-sm text-neutral-600">
              No published tenders available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
