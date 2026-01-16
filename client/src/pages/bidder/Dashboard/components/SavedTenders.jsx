import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../../../hooks/useAuth";
import { tenderService } from "../../../../services/tenderService";
import { proposalService } from "../../../../services/proposalService";

export default function SavedTenders() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        const [tenderRes, proposalRes] = await Promise.all([
          tenderService.listTenders(token, { status: "PUBLISHED" }),
          proposalService.listMine(token),
        ]);
        if (cancelled) return;
        setTenders(tenderRes?.tenders || []);
        setProposals(proposalRes?.proposals || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load tenders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (token) {
      load();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  const proposalByTender = useMemo(() => {
    const map = new Map();
    proposals.forEach((p) => map.set(p.tender_id, p));
    return map;
  }, [proposals]);

  const startProposal = async (tenderId) => {
    setActionId(tenderId);
    try {
      const proposal = await proposalService.createDraft(tenderId, token);
      setProposals((prev) => [proposal, ...prev]);
      navigate(`/bidder/proposal/${tenderId}`);
    } catch (err) {
      if (err.status === 400 && err.message?.includes("exists")) {
        const existing = proposalByTender.get(tenderId);
        if (existing) {
          navigate(`/bidder/proposal/${tenderId}`);
          return;
        }
        setError("You already have a proposal for this tender.");
      } else {
        setError(err.message || "Failed to start proposal");
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Saved Tenders
      </h2>

      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-sm text-neutral-600">
          Loading tenders...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : tenders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600">No published tenders available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenders.map((tender) => {
            const deadline = tender.submission_deadline
              ? new Date(tender.submission_deadline)
              : null;
            const existing = proposalByTender.get(tender.tender_id);
            return (
              <div
                key={tender.tender_id}
                className="bg-white border border-neutral-200 rounded-lg p-6"
              >
                <h3 className="text-sm font-semibold text-neutral-900">
                  {tender.title}
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  {tender.organization_name || "Issuing authority"}
                </p>
                {deadline && (
                  <p className="text-xs text-neutral-600 mt-1">
                    Deadline: {deadline.toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-3 mt-4">
                  <Link
                    to={`/bidder/tenders/${tender.tender_id}/analyze`}
                    className="text-primary-600 text-sm hover:underline"
                  >
                    View Tender
                  </Link>
                  {existing ? (
                    <button
                      onClick={() => navigate(`/bidder/proposal/${tender.tender_id}`)}
                      className="text-primary-700 text-sm hover:underline"
                    >
                      View Proposal
                    </button>
                  ) : (
                    <button
                      onClick={() => startProposal(tender.tender_id)}
                      disabled={actionId === tender.tender_id}
                      className="text-neutral-700 text-sm hover:underline disabled:opacity-50"
                    >
                      {actionId === tender.tender_id ? "Starting..." : "Start Proposal"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
