import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../../components/shared/PageHeader";
import useAuth from "../../../hooks/useAuth";
import { proposalService } from "../../../services/proposalService";
import { tenderService } from "../../../services/tenderService";

export default function ProposalDraft() {
  const { proposalId } = useParams();
  const { token } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [tender, setTender] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
      } finally {
        setLoading(false);
      }
    }
    if (token && proposalId) load();
  }, [proposalId, token]);

  const handleSave = async (sectionId, content) => {
    setSaving(true);
    try {
      const updated = await proposalService.saveSectionResponse(
        proposalId,
        sectionId,
        content,
        token
      );
      setResponses((prev) => ({ ...prev, [sectionId]: updated.content }));
    } catch (err) {
      setError(err.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updated = await proposalService.submit(proposalId, token);
      setProposal(updated);
    } catch (err) {
      setError(err.message || "Failed to submit proposal");
    } finally {
      setSaving(false);
    }
  };

  const sections = tender?.sections || [];

  const pageTitle = useMemo(() => {
    if (!proposalId) return "Proposal Draft";
    return `Proposal Draft #${proposalId}`;
  }, [proposalId]);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={pageTitle}
        description={tender?.title || "Proposal details"}
      />

      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6">
        {loading && <div className="text-sm text-neutral-600">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="space-y-6">
            {sections.length === 0 && (
              <div className="text-sm text-neutral-600">No sections found.</div>
            )}

            {sections.map((section) => (
              <div key={section.section_id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-neutral-900">
                    {section.title}
                  </h4>
                  {section.is_mandatory && (
                    <span className="text-xs text-red-600">Mandatory</span>
                  )}
                </div>
                <textarea
                  className="w-full border border-neutral-300 rounded-lg p-3 text-sm"
                  rows={4}
                  value={responses[section.section_id] || ""}
                  onChange={(e) =>
                    setResponses((prev) => ({
                      ...prev,
                      [section.section_id]: e.target.value,
                    }))
                  }
                  disabled={!isDraft || saving}
                />
                {isDraft && (
                  <button
                    onClick={() => handleSave(section.section_id, responses[section.section_id] || "")}
                    className="px-3 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-60"
                    disabled={saving}
                  >
                    Save Section
                  </button>
                )}
              </div>
            ))}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!isDraft || saving}
                className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              >
                Submit Proposal
              </button>
              <Link
                to="/bidder/proposals"
                className="ml-auto text-primary-600 hover:underline text-sm"
              >
                Back to Proposals
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
