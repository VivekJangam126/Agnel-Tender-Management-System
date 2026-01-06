import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import { mockTenders } from "../../../mock/tenders";

export default function Saved() {
  // For demo, treat published tenders as saved examples
  const saved = mockTenders.filter((t) => t.status === "published");

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Saved Tenders"
        description="Tenders you've saved for later"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {saved.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 text-sm text-neutral-600">
            No saved tenders.
          </div>
        )}
        {saved.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-neutral-200 rounded-lg p-6"
          >
            <div className="text-sm font-semibold text-neutral-900">
              {t.title}
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              Deadline: {new Date(t.deadline).toLocaleDateString()}
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                to={`/tender/${t.id}`}
                className="text-primary-600 text-sm hover:underline"
              >
                View
              </Link>
              <button className="text-sm text-neutral-700 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
