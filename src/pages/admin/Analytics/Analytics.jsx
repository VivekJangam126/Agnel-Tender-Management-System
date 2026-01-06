import PageHeader from "../../../components/shared/PageHeader";
import StatsCard from "../Dashboard/components/StatsCard";
import { mockTenders } from "../../../mock/tenders";
import { Link } from "react-router-dom";

export default function Analytics() {
  const total = mockTenders.length;
  const active = mockTenders.filter((t) => t.status === "published").length;
  const bids = mockTenders.reduce((sum, t) => sum + (t.bidsReceived || 0), 0);
  const upcoming = mockTenders.filter((t) => {
    if (!t.deadline) return false;
    const diff = new Date(t.deadline).getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;

  return (
    <div className="px-6 py-6 mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Overview of tenders and activity at a glance."
      />

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatsCard title="Total Tenders" value={total} tone="neutral" />
        <StatsCard title="Active Tenders" value={active} tone="positive" />
        <StatsCard title="Total Bids Received" value={bids} tone="neutral" />
        <StatsCard title="Upcoming Deadlines" value={upcoming} tone="warning" />
      </section>

      {/* Tender Performance Table */}
      <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden mb-10">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">
            Tender Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Bids</th>
                <th className="text-left px-4 py-2 font-medium">Deadline</th>
                <th className="text-left px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockTenders.map((t) => (
                <tr key={t.id} className="border-t border-neutral-200">
                  <td className="px-4 py-2 text-neutral-900">{t.title}</td>
                  <td className="px-4 py-2">
                    {t.status === "published" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{t.bidsReceived || 0}</td>
                  <td className="px-4 py-2">
                    {t.deadline
                      ? new Date(t.deadline).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {t.status === "published" ? (
                      <Link
                        to={`/admin/bid-evaluation/${t.id}`}
                        className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 font-medium hover:bg-neutral-50"
                      >
                        View
                      </Link>
                    ) : (
                      <button
                        className="px-3 py-1.5 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed"
                        disabled
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights Panel */}
      <section className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Insights
        </h3>
        <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
          <li>{upcoming} tenders are nearing submission deadlines</li>
          <li>
            {
              mockTenders.filter(
                (t) => t.status === "published" && (t.bidsReceived || 0) === 0
              ).length
            }{" "}
            published tender(s) have not received any bids yet
          </li>
        </ul>
      </section>
    </div>
  );
}
