import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import useAuth from "../../../hooks/useAuth";
import { proposalService } from "../../../services/proposalService";
import { tenderService } from "../../../services/tenderService";

const STATUS_COLORS = {
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-purple-50 text-purple-700 border-purple-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function ProposalDraft() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [tender, setTender] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isDraft = proposal?.status === "DRAFT";

  useEffect(() => {
    async function load() {
      try {
        const p = await proposalService.getProposal(proposalId, token);
        setProposal(p);
        const { tender_id, responses: stored } = p;
        const t = await tenderService.getTender(tender_id, token);
        setTender(t);
        const map = {};
        stored?.forEach((r) => {
          map[r.section_id] = r.content;
        });
        setResponses(map);
      } catch (err) {
        setError(err.message || "Failed to load proposal");
        if (err.status === 404 || err.status === 403) {
          setTimeout(() => navigate("/bidder/proposals"), 2000);
        }
      } finally {
        setLoading(false);
      }
    }
    if (token && proposalId) load();
  }, [proposalId, token, navigate]);

  const handleSave = async (sectionId, content) => {
    setSaving(sectionId);
    setError(null);
    setSuccess(null);
    try {
      const updated = await proposalService.saveSectionResponse(
        proposalId,
        sectionId,
        content,
        token
      );
      setResponses((prev) => ({ ...prev, [sectionId]: updated.content }));
      setSuccess("Section saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save section");
    } finally {
      setSaving(null);
    }
  };

  const handleSubmit = async () => {
    const mandatorySections = tender?.sections?.filter(s => s.is_mandatory) || [];
    const missingMandatory = mandatorySections.filter(s => !responses[s.section_id]?.trim());
    
    if (missingMandatory.length > 0) {
      setError(`Please complete all mandatory sections: ${missingMandatory.map(s => s.title).join(", ")}`);
      return;
    }

    if (!window.confirm("Submit this proposal? You won't be able to edit it after submission.")) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await proposalService.submit(proposalId, token);
      setProposal(updated);
      setSuccess("Proposal submitted successfully!");
      setTimeout(() => navigate("/bidder/proposals"), 2000);
    } catch (err) {
      setError(err.message || "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const sections = tender?.sections || [];
  const statusColor = STATUS_COLORS[proposal?.status] || STATUS_COLORS.DRAFT;

  const pageTitle = useMemo(() => {
    if (!tender?.title) return "Proposal Draft";
    return tender.title;
  }, [tender]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Loading..." />
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center text-sm text-neutral-600">
          Loading proposal details...
        </div>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Error" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Link to="/bidder/proposals" className="mt-4 inline-block text-primary-600 hover:underline text-sm">
            Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={pageTitle}
        description={`Proposal ID: ${proposalId?.substring(0, 8)}`}
      />

      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-neutral-900">Proposal Status</div>
            <div className="text-xs text-neutral-600 mt-0.5">Created: {new Date(proposal?.created_at).toLocaleString()}</div>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border ${statusColor}`}>
            {proposal?.status}
          </span>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}

        {!isDraft && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            This proposal has been submitted and is read-only.
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {sections.length === 0 && (
            <div className="text-sm text-neutral-600">No sections found in this tender.</div>
          )}

          {sections.map((section, idx) => (
            <div key={section.section_id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Section {idx + 1}</span>
                <h4 className="text-sm font-semibold text-neutral-900">
                  {section.title}
                </h4>
                {section.is_mandatory && (
                  <span className="text-xs text-red-600 font-medium">* Required</span>
                )}
              </div>
              <textarea
                className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-600"
                rows={5}
                placeholder={isDraft ? "Enter your response here..." : "No response provided"}
                value={responses[section.section_id] || ""}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    [section.section_id]: e.target.value,
                  }))
                }
                disabled={!isDraft}
              />
              {isDraft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(section.section_id, responses[section.section_id] || "")}
                    className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={saving === section.section_id}
                  >
                    {saving === section.section_id ? "Saving..." : "Save Section"}
                  </button>
                  <span className="text-xs text-neutral-500">
                    {responses[section.section_id] ? "Last saved" : "Not saved yet"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {isDraft && (
            <button
              onClick={handleSubmit}
              disabled={submitting || saving}
              className="px-5 py-2.5 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Proposal"}
            </button>
          )}
          <Link
            to="/bidder/proposals"
            className="ml-auto px-4 py-2 text-primary-600 hover:underline text-sm"
          >
            Back to Proposals
          </Link>
        </div>
      </div>
    </div>
  );
}
