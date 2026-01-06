import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import { mockTenders } from "../../../mock/tenders";

function getDomainForTender(t) {
  if (t.title.toLowerCase().includes("road")) return "Infrastructure";
  if (t.title.toLowerCase().includes("park")) return "Urban Development";
  if (t.title.toLowerCase().includes("it")) return "Information Technology";
  return "Public Works";
}

function isOpen(deadline) {
  try {
    return new Date(deadline).getTime() > Date.now();
  } catch {
    return true;
  }
}

export default function Saved() {
  const initial = useMemo(
    () => mockTenders.filter((t) => t.status === "published"),
    []
  );
  const [saved, setSaved] = useState(initial);

  const removeSaved = (id) => {
    const ok = window.confirm("Remove this tender from saved?");
    if (!ok) return;
    setSaved((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Saved Tenders"
        description="Tenders you’ve shortlisted for review and proposal drafting."
      />

      {saved.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-sm text-neutral-700">
            You haven’t saved any tenders yet.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Browse available tenders and save the ones you’re interested in.
          </p>
          <div className="mt-4">
            <Link
              to="/bidder/dashboard"
              className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm"
            >
              Browse Tenders
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {saved.map((t) => {
            const domain = getDomainForTender(t);
            const open = isOpen(t.deadline);
            return (
              <div
                key={t.id}
                className="bg-white border border-neutral-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-900">
                      {t.title}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      Issuing Authority: Municipal Corporation
                    </div>
                    <div className="text-xs text-neutral-600">
                      Category: {domain}
                    </div>
                    <div className="text-xs text-neutral-600">
                      Submission Deadline:{" "}
                      {new Date(t.deadline).toLocaleDateString()}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${
                          open
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-100 text-neutral-700 border-neutral-300"
                        }`}
                      >
                        {open ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link
                    to={`/tender/${t.id}`}
                    className="text-primary-600 text-sm hover:underline"
                  >
                    View Tender
                  </Link>
                  <button
                    onClick={() => removeSaved(t.id)}
                    className="text-neutral-700 text-sm hover:underline"
                  >
                    Remove from Saved
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
