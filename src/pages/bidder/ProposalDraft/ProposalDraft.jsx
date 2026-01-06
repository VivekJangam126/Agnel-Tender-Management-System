import { useParams, Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";

export default function ProposalDraft() {
  const { proposalId } = useParams();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={`Proposal Draft #${proposalId || "—"}`}
        description="Draft structure preview (mock)"
      />

      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">
              Executive Summary
            </h4>
            <p className="text-sm text-neutral-700 mt-1">
              Outline your approach and key value proposition.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">
              Methodology
            </h4>
            <p className="text-sm text-neutral-700 mt-1">
              Describe your phases, resources, and timeline.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Team</h4>
            <p className="text-sm text-neutral-700 mt-1">
              List core team members and qualifications.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">
              Compliance
            </h4>
            <p className="text-sm text-neutral-700 mt-1">
              Attach required certificates and documentation.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">
            Continue Editing
          </button>
          <button className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50">
            Save Draft
          </button>
          <Link
            to="/bidder/proposals"
            className="ml-auto text-primary-600 hover:underline"
          >
            Back to Proposals
          </Link>
        </div>
      </div>
    </div>
  );
}
