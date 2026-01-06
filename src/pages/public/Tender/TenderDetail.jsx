import { Link, useParams } from "react-router-dom";
import { mockTenders } from "../../../mock/tenders";
import PageHeader from "../../../components/shared/PageHeader";

export default function TenderDetail() {
  const { id } = useParams();
  const tender = mockTenders.find((t) => t.id === id);

  if (!tender) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Tender Not Found"
          description="The tender you are looking for does not exist."
        />
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <Link to="/" className="text-primary-600 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const isPublished = tender.status === "published";
  const publishedAt = tender.publishedAt ? new Date(tender.publishedAt) : null;
  const deadline = tender.deadline ? new Date(tender.deadline) : null;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={tender.title}
        description={
          isPublished ? "Published tender details" : "Draft tender (read-only)"
        }
      />

      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
              isPublished
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
          {publishedAt && (
            <span className="text-sm text-neutral-600">
              Published: {publishedAt.toLocaleDateString()}
            </span>
          )}
          {deadline && (
            <span className="text-sm text-neutral-600">
              Deadline: {deadline.toLocaleDateString()}
            </span>
          )}
          {typeof tender.bidsReceived === "number" && (
            <span className="text-sm text-neutral-600">
              Bids received: {tender.bidsReceived}
            </span>
          )}
        </div>

        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold text-neutral-900">Overview</h3>
          <p className="text-neutral-700">
            This is a read-only preview of the tender. In a real app, this would
            include the scope, eligibility criteria, submission instructions,
            and attachments.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to={"/"}
            className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            Back to Home
          </Link>
          <Link
            to={"/bidder/dashboard"}
            className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
          >
            Go to Bidder Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
