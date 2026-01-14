import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BidderLayout from '../../components/bidder-layout/BidderLayout';
import { FileCheck, Eye, Send, AlertCircle, ChevronRight, Loader } from 'lucide-react';
import { tenderService } from '../../services/bidder/tenderService';
import { proposalService } from '../../services/bidder/proposalService';

export default function ProposalDrafting() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tenders and proposals on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all available tenders for bidder
        const tendersRes = await tenderService.discoverTenders({ limit: 100 });
        const tendersData = tendersRes.data?.tenders || tendersRes.data?.data?.tenders || [];
        setTenders(tendersData);

        // Fetch bidder's proposals
        const proposalsRes = await proposalService.getMyProposals();
        const proposalsData = proposalsRes.data?.proposals || proposalsRes.data?.data?.proposals || [];
        setProposals(proposalsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.message || 'Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get proposal status for a tender
  const getProposalStatus = (tenderId) => {
    const proposal = proposals.find(p => p.tenderId === tenderId);
    if (!proposal) return { status: 'NOT_STARTED', content: 'Not Started', color: 'bg-slate-100 text-slate-700' };
    
    switch (proposal.status) {
      case 'DRAFT':
        return { 
          status: 'DRAFT', 
          content: 'In Progress',
          color: 'bg-orange-100 text-orange-700',
          completedSections: proposal.completedSections,
          totalSections: proposal.totalSections
        };
      case 'SUBMITTED':
        return { status: 'SUBMITTED', content: 'Submitted', color: 'bg-blue-100 text-blue-700' };
      case 'UNDER_REVIEW':
        return { status: 'UNDER_REVIEW', content: 'Under Review', color: 'bg-purple-100 text-purple-700' };
      case 'ACCEPTED':
        return { status: 'ACCEPTED', content: 'Accepted', color: 'bg-green-100 text-green-700' };
      case 'REJECTED':
        return { status: 'REJECTED', content: 'Rejected', color: 'bg-red-100 text-red-700' };
      default:
        return { status: proposal.status, content: proposal.status, color: 'bg-slate-100 text-slate-700' };
    }
  };

  // Handle continue editing
  const handleContinue = (tenderId) => {
    navigate(`/bidder/proposal/${tenderId}`);
  };

  // Handle start new proposal
  const handleStartProposal = (tenderId) => {
    navigate(`/bidder/proposal/${tenderId}`);
  };

  // Group tenders by proposal status
  const inProgressTenders = tenders.filter(t => {
    const status = getProposalStatus(t._id || t.id);
    return status.status === 'DRAFT';
  });

  const submittedTenders = tenders.filter(t => {
    const status = getProposalStatus(t._id || t.id);
    return ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'].includes(status.status);
  });

  const notStartedTenders = tenders.filter(t => {
    const status = getProposalStatus(t._id || t.id);
    return status.status === 'NOT_STARTED';
  });

  const stats = {
    total: tenders.length,
    inProgress: inProgressTenders.length,
    submitted: submittedTenders.length,
    avgCompletion: inProgressTenders.length > 0
      ? Math.round(
          inProgressTenders.reduce((sum, t) => {
            const proposal = proposals.find(p => p.tenderId === (t._id || t.id));
            return sum + (proposal?.completionPercent || 0);
          }, 0) / inProgressTenders.length
        )
      : 0
  };

  if (loading) {
    return (
      <BidderLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600">Loading proposals...</p>
          </div>
        </div>
      </BidderLayout>
    );
  }

  return (
    <BidderLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Proposal Drafting</h1>
          <p className="text-slate-600">Respond to tenders with AI-assisted guidance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">Available Tenders</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <FileCheck className="w-12 h-12 text-blue-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">In Progress</p>
                <p className="text-3xl font-bold text-slate-900">{stats.inProgress}</p>
              </div>
              <Send className="w-12 h-12 text-orange-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">Avg. Completion</p>
                <p className="text-3xl font-bold text-slate-900">{stats.avgCompletion}%</p>
              </div>
              <Eye className="w-12 h-12 text-green-100" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* In Progress Section */}
        {inProgressTenders.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">In Progress</h2>
              <span className="ml-auto px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold text-sm">
                {inProgressTenders.length}
              </span>
            </div>
            <div className="space-y-4">
              {inProgressTenders.map((tender) => {
                const proposalStatus = getProposalStatus(tender._id || tender.id);
                const proposal = proposals.find(p => p.tenderId === (tender._id || tender.id));
                
                return (
                  <div key={tender._id || tender.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-900">{tender.title}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${proposalStatus.color}`}>
                            {proposalStatus.content}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">{tender.authority?.name}</p>
                        
                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                              {proposal?.completedSections || 0}/{proposal?.totalSections || '?'} sections
                            </span>
                            <span className="text-sm font-medium text-slate-900">{proposal?.completionPercent || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${proposal?.completionPercent || 0}%` }}
                            />
                          </div>
                          {proposal?.lastEdited && (
                            <p className="text-xs text-slate-500">
                              Last edited {new Date(proposal.lastEdited).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleContinue(tender._id || tender.id)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition flex-shrink-0"
                      >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Tenders Section */}
        {notStartedTenders.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Available Tenders</h2>
              <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                {notStartedTenders.length}
              </span>
            </div>
            <div className="space-y-4">
              {notStartedTenders.map((tender) => (
                <div key={tender._id || tender.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{tender.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{tender.authority?.name}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {tender.sections && (
                          <span>📋 {tender.sections.length} sections</span>
                        )}
                        {tender.deadline && (
                          <span>📅 Due {new Date(tender.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartProposal(tender._id || tender.id)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition flex-shrink-0"
                    >
                      Start Proposal
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submitted Section */}
        {submittedTenders.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Submitted Proposals</h2>
              <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                {submittedTenders.length}
              </span>
            </div>
            <div className="space-y-4">
              {submittedTenders.map((tender) => {
                const proposalStatus = getProposalStatus(tender._id || tender.id);
                const proposal = proposals.find(p => p.tenderId === (tender._id || tender.id));
                
                return (
                  <div key={tender._id || tender.id} className="bg-white rounded-xl border border-slate-200 p-6 opacity-75">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{tender.title}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${proposalStatus.color}`}>
                            {proposalStatus.content}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{tender.authority?.name}</p>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/bidder/proposal/${tender._id || tender.id}`)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition flex-shrink-0"
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tenders.length === 0 && !loading && (
          <div className="text-center py-16">
            <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tenders Available</h3>
            <p className="text-slate-600 mb-6">Check back later for new tender opportunities</p>
            <button
              onClick={() => navigate('/bidder/tenders')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Discover Tenders
            </button>
          </div>
        )}
      </div>
    </BidderLayout>
  );
}
