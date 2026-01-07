import { Link } from "react-router-dom";
import { mockTenders } from "../../../../mock/tenders";

export default function SavedTenders() {
  // Mock: treat published tenders as saved
  const saved = mockTenders.filter((t) => t.status === "published");

  if (saved.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Saved Tenders
        </h2>
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600">You haven't saved any tenders yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Saved Tenders
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {saved.map((tender) => (
          <div
            key={tender.id}
            className="bg-white border border-neutral-200 rounded-lg p-6"
          >
            <h3 className="text-sm font-semibold text-neutral-900">
              {tender.title}
            </h3>
            <p className="text-xs text-neutral-600 mt-1">
              Municipal Corporation
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Deadline: {new Date(tender.deadline).toLocaleDateString()}
            </p>
            <div className="flex gap-3 mt-4">
              <Link
                to={`/tender/${tender.id}`}
                className="text-primary-600 text-sm hover:underline"
              >
                View Tender
              </Link>
              <button className="text-neutral-700 text-sm hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
