import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BidderLayout from '../../components/bidder-layout/BidderLayout';
import ProposalHeader from '../../components/proposal/ProposalHeader';
import SectionList from '../../components/proposal/SectionList';
import ProposalEditor from '../../components/proposal/ProposalEditor';
import ProposalAIAdvisor from '../../components/proposal/ProposalAIAdvisor';
import Loading from '../../components/bidder-common/Loading';
import { tenderService } from '../../services/bidder/tenderService';
import { proposalService } from '../../services/bidder/proposalService';
import { ArrowLeft, Menu, Maximize2, Minimize2 } from 'lucide-react';

export default function ProposalWorkspace() {
  const { tenderId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [tender, setTender] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editing State
  const [sectionContents, setSectionContents] = useState({});
  const [savingStatus, setSavingStatus] = useState({}); // Track saving per section: 'saving'|'saved'|null
  const [lastSaved, setLastSaved] = useState({});
  const autoSaveTimers = useRef({}); // Track debounce timers

  // UI State
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAIAdvisor, setShowAIAdvisor] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tender and proposal on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tender details
        const tenderRes = await tenderService.getTenderFullDetails(tenderId);
        const tenderData = tenderRes.data?.data?.tender || tenderRes.data?.tender;
        setTender(tenderData);

        // Fetch or create proposal
        let proposalData = null;
        try {
          const proposalRes = await proposalService.getProposalByTenderId(tenderId);
          proposalData = proposalRes.data?.data?.proposal || proposalRes.data?.proposal;
        } catch (err) {
          // Create new proposal if it doesn't exist (404 expected for new proposals)
          if (err.response?.status === 404) {
            try {
              const newProposalRes = await proposalService.createProposal(tenderId);
              proposalData = newProposalRes.data?.data?.proposal || newProposalRes.data?.proposal;
            } catch (createErr) {
              // If creation fails because it already exists (race condition in StrictMode),
              // try fetching again
              if (createErr.response?.status === 400 && createErr.response?.data?.error?.includes('already exists')) {
                const retryRes = await proposalService.getProposalByTenderId(tenderId);
                proposalData = retryRes.data?.data?.proposal || retryRes.data?.proposal;
              } else {
                throw createErr;
              }
            }
          } else {
            throw err;
          }
        }

        setProposal(proposalData);

        // Set sections from tender
        const tenderSections = tenderRes.data?.data?.sections || tenderRes.data?.sections || [];
        setSections(tenderSections);

        // Load existing section contents from proposal
        if (proposalData?.sections) {
          const contents = {};
          proposalData.sections.forEach(ps => {
            contents[ps.section_id || ps.sectionId] = ps.content || '';
          });
          setSectionContents(contents);
        }

        // Set first section as active
        if (tenderSections.length > 0) {
          setActiveSection(tenderSections[0]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.message || 'Failed to load proposal workspace');
      } finally {
        setLoading(false);
      }
    };

    if (tenderId) {
      fetchData();
    }
  }, [tenderId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(autoSaveTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Handle section selection
  const handleSelectSection = (section) => {
    setActiveSection(section);
  };

  // Handle content change with auto-save debounce
  const handleContentChange = (value) => {
    if (!activeSection || proposal?.status !== 'DRAFT') return;

    const sectionId = activeSection._id || activeSection.id || activeSection.section_id;

    // Update content
    setSectionContents(prev => ({
      ...prev,
      [sectionId]: value
    }));

    // Clear existing timer
    if (autoSaveTimers.current[sectionId]) {
      clearTimeout(autoSaveTimers.current[sectionId]);
    }

    // Set new timer for auto-save (2 seconds after user stops typing)
    setSavingStatus(prev => ({
      ...prev,
      [sectionId]: 'saving'
    }));

    autoSaveTimers.current[sectionId] = setTimeout(async () => {
      await saveSection(sectionId, value);
    }, 2000);
  };

  // Save section content (called by auto-save or manual save)
  const saveSection = async (sectionId, content) => {
    if (!proposal || proposal.status !== 'DRAFT') {
      setSavingStatus(prev => ({
        ...prev,
        [sectionId]: null
      }));
      return;
    }

    try {
      setSavingStatus(prev => ({
        ...prev,
        [sectionId]: 'saving'
      }));

      const proposalId = proposal._id || proposal.proposal_id;
      await proposalService.updateProposalSection(proposalId, sectionId, content);

      setLastSaved(prev => ({
        ...prev,
        [sectionId]: new Date()
      }));

      setSavingStatus(prev => ({
        ...prev,
        [sectionId]: 'saved'
      }));

      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          [sectionId]: null
        }));
      }, 2000);
    } catch (err) {
      console.error('Failed to save section:', err);
      setSavingStatus(prev => ({
        ...prev,
        [sectionId]: null
      }));
    }
  };

  // Handle proposal submission
  const handleSubmitProposal = async () => {
    const mandatorySections = sections.filter(s => s.is_mandatory || s.mandatory);
    const completedSections = mandatorySections.filter(s => {
      const content = sectionContents[s._id || s.id || s.section_id] || '';
      return content.trim().length >= 50;
    });

    if (completedSections.length !== mandatorySections.length) {
      alert(`Please complete all ${mandatorySections.length} mandatory sections before submitting.`);
      return;
    }

    if (!window.confirm('Are you sure you want to submit this proposal? You cannot edit it after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      const proposalId = proposal._id || proposal.proposal_id;
      await proposalService.submitProposal(proposalId);
      alert('Proposal submitted successfully!');
      navigate('/bidder/proposal-drafting');
    } catch (err) {
      console.error('Failed to submit proposal:', err);
      alert(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate completion
  const completedCount = sections.filter(s => {
    const content = sectionContents[s._id || s.id || s.section_id] || '';
    return content.trim().length >= 50;
  }).length;
  const completionPercent = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0;

  if (loading) {
    return (
      <BidderLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Loading />
        </div>
      </BidderLayout>
    );
  }

  if (error) {
    return (
      <BidderLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={() => navigate('/bidder/proposal-drafting')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Proposals
            </button>
          </div>
        </div>
      </BidderLayout>
    );
  }

  const activeSectionId = activeSection ? (activeSection._id || activeSection.id || activeSection.section_id) : null;

  return (
    <BidderLayout showNavbar={!fullscreenMode}>
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => navigate('/bidder/proposal-drafting')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Toggle Sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
              title={showSidebar ? "Hide sections panel" : "Show sections panel"}
            >
              <Menu className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">{showSidebar ? 'Sections' : 'Sections'}</span>
            </button>

            {/* Toggle AI Advisor */}
            <button
              onClick={() => setShowAIAdvisor(!showAIAdvisor)}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
              title={showAIAdvisor ? "Hide AI advisor" : "Show AI advisor"}
            >
              <span className="text-xs">{showAIAdvisor ? 'AI ✓' : 'AI ✗'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setFullscreenMode(!fullscreenMode)}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
              title={fullscreenMode ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreenMode ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Header */}
        <ProposalHeader
          tender={tender}
          proposal={proposal}
          completionPercent={completionPercent}
          completedSections={completedCount}
          totalSections={sections.length}
          onSubmit={handleSubmitProposal}
          submitting={submitting}
        />

        {/* Three-Column Layout */}
        <div className="flex-1 flex overflow-hidden gap-0">
          {/* Left: Section List - Collapsible */}
          {showSidebar && (
            <div className="w-64 lg:w-72 flex-shrink-0 border-r border-slate-200 flex flex-col">
              <SectionList
                sections={sections}
                activeSection={activeSection}
                onSelectSection={handleSelectSection}
                sectionCompletion={sectionContents}
              />
            </div>
          )}

          {/* Center: Proposal Editor - Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSection ? (
              <ProposalEditor
                section={activeSection}
                content={sectionContents[activeSectionId] || ''}
                onContentChange={handleContentChange}
                isReadOnly={proposal?.status !== 'DRAFT'}
                savingStatus={savingStatus[activeSectionId]}
                lastSaved={lastSaved[activeSectionId]}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <p>No section selected</p>
              </div>
            )}
          </div>

          {/* Right: AI Advisor - Collapsible */}
          {showAIAdvisor && (
            <div className="w-80 lg:w-96 flex-shrink-0 border-l border-slate-200 flex flex-col">
              {activeSection ? (
                <ProposalAIAdvisor
                  proposal={proposal}
                  section={activeSection}
                  bidderDraft={sectionContents[activeSectionId] || ''}
                  tenderRequirement={activeSection?.description || activeSection?.content || ''}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <p>No section selected</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BidderLayout>
  );
}
