import { useEffect, useState, useMemo } from "react";
import useAuth from "../../../hooks/useAuth";
import { tenderService } from "../../../services/tenderService";
import PageHeader from "../../../components/shared/PageHeader";
import StatsCard from "../Dashboard/components/StatsCard";
import TenderStatusBadge from "../../../components/admin/TenderStatusBadge";
import { Link } from "react-router-dom";

export default function Analytics() {
  const { token } = useAuth();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTenders() {
      setLoading(true);
      setError(null);
      try {
        const { tenders: data } = await tenderService.listTenders(token);
        setTenders(data || []);
      } catch (err) {
        setError(err.message || "Failed to load tenders");
        setTenders([]);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadTenders();
  }, [token]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = tenders.length;
    const draft = tenders.filter(t => t.status === "DRAFT").length;
    const published = tenders.filter(t => t.status === "PUBLISHED").length;
    const closed = tenders.filter(t => t.status === "CLOSED").length;

    const now = new Date();
    const upcoming = tenders
      .filter(t => t.status === "PUBLISHED")
      .filter(t => {
        if (!t.submission_deadline) return false;
        const deadline = new Date(t.submission_deadline);
        const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);
        return daysUntil > 0 && daysUntil <= 7;
      }).length;

    // Total bids (mock - would need API endpoint)
    const totalBids = 0;

    return { total, draft, published, closed, upcoming, totalBids };
  }, [tenders]);

  return (
    <div className="px-6 py-6 mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Overview of tenders and activity at a glance."
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatsCard title="Total Tenders" value={metrics.total} tone="neutral" loading={loading} />
        <StatsCard title="Published" value={metrics.published} tone="positive" loading={loading} />
        <StatsCard title="Draft" value={metrics.draft} tone="neutral" loading={loading} />
        <StatsCard title="Closed" value={metrics.closed} tone="neutral" loading={loading} />
      </section>

      {/* Tender Performance Table */}
      <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden mb-10">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">
            All Tenders
          </h3>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-neutral-600">
            Loading tenders...
          </div>
        ) : tenders.length === 0 ? (
          <div className="px-4 py-8 text-center text-neutral-600">
            No tenders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Title</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Deadline</th>
                  <th className="text-left px-4 py-2 font-medium">Created</th>
                  <th className="text-left px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((t) => (
                  <tr key={t.tender_id} className="border-t border-neutral-200 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-900 max-w-md truncate">{t.title}</td>
                    <td className="px-4 py-3">
                      <TenderStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {t.submission_deadline
                        ? new Date(t.submission_deadline).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {t.status === "PUBLISHED" ? (
                        <Link
                          to={`/admin/bid-evaluation/${t.tender_id}`}
                          className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50"
                        >
                          Evaluate
                        </Link>
                      ) : (
                        <button
                          className="px-3 py-1.5 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-400 text-xs cursor-not-allowed"
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
        )}
      </section>

      {/* Insights Panel */}
      <section className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">
          Insights
        </h3>
        <ul className="list-disc list-inside text-sm text-neutral-700 space-y-2">
          <li>{metrics.upcoming} tender(s) are nearing submission deadlines (within 7 days)</li>
          <li>
            {tenders.filter(t => t.status === "DRAFT").length} draft tender(s) ready to publish
          </li>
          <li>
            {metrics.published} published tender(s) actively accepting submissions
          </li>
          {metrics.total === 0 && <li>Get started by creating your first tender</li>}
        </ul>
      </section>
    </div>
  );
}
