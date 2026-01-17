/**
 * Collaborative Proposal Workspace
 * Unified workspace for BOTH platform tenders AND uploaded PDF tenders
 *
 * Features:
 * - Section-level user assignments with permissions (EDIT / READ_AND_COMMENT)
 * - Inline comments with threads
 * - AI-assisted drafting grounded in tender analysis
 * - Proposal validation against tender requirements
 * - Permission-based access control
 *
 * Routes:
 * - /bidder/proposal/:tenderId/collaborate (platform tenders)
 * - /bidder/uploaded-tenders/:uploadedTenderId/collaborate (uploaded tenders)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Menu,
  ChevronRight,
  FileText,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';

// Layout
import BidderLayout from '../../components/bidder-layout/BidderLayout';
import Loading from '../../components/bidder-common/Loading';

// Collaboration Components
import { CollaborationProvider, useCollaboration } from '../../context/CollaborationContext';
import CollaborativeProposalEditor from '../../components/proposal/CollaborativeProposalEditor';
import ValidationResultsPanel from '../../components/proposal/ValidationResultsPanel';

// Services
import { tenderService } from '../../services/bidder/tenderService';
import { proposalService } from '../../services/bidder/proposalService';
import { pdfAnalysisService } from '../../services/bidder/pdfAnalysisService';

/**
 * Quick Content Add Modal
 */
function QuickAddContentModal({ section, onAdd, onClose }) {
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (content.trim()) {
      onAdd(content);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Content to {section?.title || 'Section'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your content here... You can paste or manually enter text for this section."
            className="w-full h-64 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-sm text-slate-500 mt-2">
            Word count: {content.trim().split(/\s+/).filter(Boolean).length}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!content.trim()}
            className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            Add Content
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Section List Component for the sidebar
 */
function SectionListPanel({
  sections,
  activeSection,
  onSelectSection,
  sectionContents,
  assignments,
  isOwner,
}) {
  const getSectionStatus = (section) => {
    const sectionId = section.section_id || section._id || section.id || section.key;
    const content = sectionContents[sectionId] || '';
    const wordCount = content.trim().split(/\s+/).filter((w) => w).length;

    if (wordCount >= 50) return 'complete';
    if (wordCount > 0) return 'partial';
    return 'empty';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Sections</h3>
        <p className="text-xs text-slate-500 mt-1">
          {sections.filter((s) => getSectionStatus(s) === 'complete').length} / {sections.length} complete
        </p>
      </div>

      {/* Section List */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => {
          const sectionId = section.section_id || section._id || section.id || section.key;
          const isActive =
            activeSection &&
            (activeSection.section_id || activeSection._id || activeSection.id || activeSection.key) === sectionId;
          const status = getSectionStatus(section);
          const assignees = assignments[sectionId] || [];

          return (
            <button
              key={sectionId}
              onClick={() => onSelectSection(section)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 ${
                isActive
                  ? 'bg-blue-50 border-l-2 border-l-blue-600'
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Status icon */}
              <div className="mt-0.5">{getStatusIcon(status)}</div>

              {/* Section info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium truncate ${
                    isActive ? 'text-blue-900' : 'text-slate-900'
                  }`}
                >
                  {section.title || section.sectionTitle || section.name || 'Untitled'}
                </p>

                {/* Metadata row */}
                <div className="flex items-center gap-2 mt-1">
                  {section.is_mandatory && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                      Required
                    </span>
                  )}

                  {assignees.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      {assignees.length}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Inner workspace component (needs collaboration context)
 */
function WorkspaceContent({
  tenderType,
  tender,
  proposal,
  sections,
  sectionContents,
  setSectionContents,
  activeSection,
  setActiveSection,
  onSave,
  saving,
  lastSaved,
}) {
  const { isOwner, assignments, loading: collaborationLoading } = useCollaboration();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);

  // Handle section content change
  const handleContentChange = useCallback(
    (newContent) => {
      if (!activeSection) return;
      const sectionId =
        activeSection.section_id || activeSection._id || activeSection.id || activeSection.key;
      setSectionContents((prev) => ({
        ...prev,
        [sectionId]: newContent,
      }));
    },
    [activeSection, setSectionContents]
  );

  // Handle quick add content
  const handleAddContent = useCallback(
    (newContent) => {
      if (!activeSection) return;
      const sectionId =
        activeSection.section_id || activeSection._id || activeSection.id || activeSection.key;
      setSectionContents((prev) => ({
        ...prev,
        [sectionId]: (prev[sectionId] || '') + (prev[sectionId] ? '\n\n' : '') + newContent,
      }));
      setShowAddContentModal(false);
    },
    [activeSection]
  );

  // Handle save
  const handleSave = useCallback(() => {
    if (!activeSection) return;
    const sectionId =
      activeSection.section_id || activeSection._id || activeSection.id || activeSection.key;
    const content = sectionContents[sectionId] || '';
    onSave(sectionId, content);
  }, [activeSection, sectionContents, onSave]);

  // Handle section click from validation panel
  const handleSectionClick = useCallback(
    (sectionId) => {
      const section = sections.find(
        (s) =>
          (s.section_id || s._id || s.id || s.key) === sectionId
      );
      if (section) {
        setActiveSection(section);
      }
    },
    [sections, setActiveSection]
  );

  const activeSectionId = activeSection
    ? activeSection.section_id || activeSection._id || activeSection.id || activeSection.key
    : null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar: Section List */}
      {showSidebar && (
        <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-hidden">
          <SectionListPanel
            sections={sections}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            sectionContents={sectionContents}
            assignments={assignments}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            >
              <Menu className="w-4 h-4 text-slate-600" />
            </button>

            {activeSection && (
              <span className="text-sm text-slate-600">
                {activeSection.title || activeSection.sectionTitle || activeSection.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Add Content button */}
            <button
              onClick={() => setShowAddContentModal(true)}
              disabled={!activeSection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
              title="Quickly add content to this section"
            >
              <Plus className="w-4 h-4" />
              Add Content
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !activeSection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>

            {/* Validation toggle (owner only) */}
            {isOwner && (
              <button
                onClick={() => setShowValidation(!showValidation)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  showValidation
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                Validate
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {collaborationLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : activeSection ? (
              <CollaborativeProposalEditor
                section={activeSection}
                content={sectionContents[activeSectionId] || ''}
                onContentChange={handleContentChange}
                onSave={handleSave}
                proposalId={proposal?._id || proposal?.proposal_id || proposal?.uploaded_tender_id}
                saving={saving}
                lastSaved={lastSaved[activeSectionId]}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <p className="font-medium">No section selected</p>
                <p className="text-sm mt-1">Select a section from the sidebar to start editing</p>
              </div>
            )}
          </div>

          {/* Validation Panel (when shown) */}
          {showValidation && isOwner && (
            <div className="w-96 flex-shrink-0 border-l border-slate-200 overflow-y-auto bg-slate-50 p-4">
              <ValidationResultsPanel onSectionClick={handleSectionClick} />
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Content Modal */}
      {showAddContentModal && (
        <QuickAddContentModal
          section={activeSection}
          onAdd={handleAddContent}
          onClose={() => setShowAddContentModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Main Collaborative Proposal Workspace Component
 */
export default function CollaborativeProposalWorkspace() {
  const { tenderId, uploadedTenderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine tender type
  const tenderType = uploadedTenderId ? 'uploaded' : 'platform';
  const entityId = uploadedTenderId || tenderId;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tender, setTender] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [sectionContents, setSectionContents] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState({});

  // Auto-save timer ref
  const autoSaveTimers = useRef({});

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (tenderType === 'platform') {
          // Load platform tender
          const tenderRes = await tenderService.getTenderFullDetails(tenderId);
          const tenderData = tenderRes.data?.data?.tender || tenderRes.data?.tender;
          setTender(tenderData);

          // Load or create proposal
          let proposalData = null;
          try {
            const proposalRes = await proposalService.getProposalByTenderId(tenderId);
            proposalData = proposalRes.data?.data?.proposal || proposalRes.data?.proposal;
          } catch (err) {
            if (err.response?.status === 404) {
              const newProposalRes = await proposalService.createProposal(tenderId);
              proposalData = newProposalRes.data?.data?.proposal || newProposalRes.data?.proposal;
            } else {
              throw err;
            }
          }
          setProposal(proposalData);

          // Load sections
          const tenderSections = tenderRes.data?.data?.sections || tenderRes.data?.sections || [];
          setSections(tenderSections);

          // Load section contents from proposal
          if (proposalData?.sections) {
            const contents = {};
            proposalData.sections.forEach((ps) => {
              contents[ps.section_id || ps.sectionId] = ps.content || '';
            });
            setSectionContents(contents);
          }

          // Set first section as active
          if (tenderSections.length > 0) {
            setActiveSection(tenderSections[0]);
          }
        } else {
          // Load uploaded tender
          const uploadedRes = await pdfAnalysisService.getUploadedTender(uploadedTenderId);
          const uploadedData = uploadedRes.data?.data || uploadedRes.data;
          setTender(uploadedData);

          // Load or create draft contents
          let draftData = null;
          let sectionsToUse = [];
          
          try {
            const draftRes = await pdfAnalysisService.getProposalDraftByTenderId(uploadedTenderId);
            draftData = draftRes.data?.data || draftRes.data;
          } catch (err) {
            if (err.response?.status === 404) {
              // No draft exists - create one from analysis data or fallback static template
              console.log('[Workspace] No draft found, creating from analysis data');
              
              // Extract AI-generated proposal draft from uploaded tender's analysisData
              const aiProposalDraft = uploadedData.analysisData?.proposalDraft;

              // Fallback static template if AI draft missing
              const fallbackSections = [
                {
                  key: 'cover-letter',
                  title: 'Cover Letter',
                  content:
                    'Dear Evaluation Committee,\n\nWe appreciate the opportunity to submit our proposal. [BIDDER_NAME] brings proven experience delivering similar projects on time and within budget.\n\nSincerely,\n[BIDDER_CONTACT]\n',
                },
                {
                  key: 'technical-approach',
                  title: 'Technical Approach & Methodology',
                  content:
                    'Our methodology is structured into discovery, design, implementation, and quality assurance. We align milestones with tender requirements and provide weekly reporting.\n\nKey steps:\n- Requirement validation\n- Solution design\n- Implementation with checkpoints\n- Testing & UAT\n- Handover & training\n',
                },
                {
                  key: 'project-plan',
                  title: 'Project Plan & Timeline',
                  content:
                    'We propose a phased timeline with clear milestones, risk mitigation, and stakeholder reviews.\n\nMilestones:\n- Week 1-2: Discovery & kickoff\n- Week 3-5: Design & approvals\n- Week 6-10: Build & integrations\n- Week 11-12: Testing & UAT\n- Week 13: Deployment & training\n',
                },
                {
                  key: 'team-composition',
                  title: 'Team Composition & Governance',
                  content:
                    'The team includes a project manager, lead architect, domain specialists, QA lead, and support engineers. Governance includes weekly steering meetings and risk reviews.\n\nRoles:\n- Project Manager: Oversight & reporting\n- Lead Architect: Solution design & quality\n- Engineers: Implementation\n- QA Lead: Testing & compliance\n- Support: Knowledge transfer & training\n',
                },
              ].map(section => ({
                ...section,
                wordCount: section.content.split(/\s+/).filter(Boolean).length,
              }));

              const initialSections = aiProposalDraft?.sections?.length
                ? aiProposalDraft.sections.map(section => ({
                    key: section.id || section.key,
                    title: section.title,
                    content: section.content || '',
                    wordCount: section.wordCount || 0,
                  }))
                : fallbackSections;

              try {
                const createRes = await pdfAnalysisService.saveProposalDraft(
                  uploadedTenderId,
                  {
                    sections: initialSections,
                    title: uploadedData.title || 'Proposal Draft',
                  }
                );
                draftData = createRes.data?.data || createRes.data;
                console.log('[Workspace] Created initial draft with', aiProposalDraft?.sections?.length ? 'AI content' : 'fallback template');
              } catch (createErr) {
                console.error('[Workspace] Failed to create draft:', createErr);
                // If API save failed, still use local fallback so user can edit
                draftData = { sections: initialSections, title: uploadedData.title || 'Proposal Draft' };
              }
            } else {
              throw err;
            }
          }

          // Use proposal draft sections as the primary sections
          if (draftData && draftData.sections) {
            sectionsToUse = draftData.sections.map((section, idx) => ({
              ...section,
              key: section.key || section.section_key || `section-${idx}`,
              section_id: section.key || section.section_key || `section-${idx}`,
              title: section.title || section.sectionTitle || `Section ${idx + 1}`,
            }));
          } else {
            // Fallback: use normalizedSections from uploaded tender
            const normalizedSections = uploadedData.normalizedSections || [];
            sectionsToUse = normalizedSections.map((section, idx) => ({
              ...section,
              key: section.key || `section-${idx}`,
              section_id: section.key || `section-${idx}`,
            }));
          }
          
          setSections(sectionsToUse);

          if (draftData) {
            setProposal(draftData);
            // Load section contents from draft
            const contents = {};
            if (draftData.sections) {
              draftData.sections.forEach((section) => {
                const sectionKey = section.key || section.section_key;
                contents[sectionKey] = section.content || '';
              });
            }
            setSectionContents(contents);
          }

          // Set first section as active
          if (sectionsToUse.length > 0) {
            setActiveSection(sectionsToUse[0]);
          }
        }
      } catch (err) {
        console.error('[CollaborativeWorkspace] Load error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      loadData();
    }
  }, [entityId, tenderType, tenderId, uploadedTenderId]);

  // Cleanup auto-save timers on unmount
  useEffect(() => {
    return () => {
      Object.values(autoSaveTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Save section content
  const handleSave = useCallback(
    async (sectionId, content) => {
      if (!proposal) return;

      try {
        setSaving(true);

        if (tenderType === 'platform') {
          const proposalId = proposal._id || proposal.proposal_id;
          await proposalService.updateProposalSection(proposalId, sectionId, content);
        } else {
          // For uploaded tenders, save to draft - need to send all sections
          const updatedSections = sections.map(section => {
            const sectionKey = section.key || section.section_key || section.section_id;
            return {
              key: sectionKey,
              title: section.title || section.sectionTitle,
              content: sectionKey === sectionId ? content : (sectionContents[sectionKey] || ''),
              wordCount: sectionKey === sectionId 
                ? content.split(/\s+/).filter(w => w).length 
                : (section.wordCount || 0),
            };
          });
          
          await pdfAnalysisService.saveProposalDraft(uploadedTenderId, {
            sections: updatedSections,
            title: proposal.title || tender.title,
          });
        }

        setLastSaved((prev) => ({
          ...prev,
          [sectionId]: new Date(),
        }));
      } catch (err) {
        console.error('[CollaborativeWorkspace] Save error:', err);
      } finally {
        setSaving(false);
      }
    },
    [proposal, tenderType, uploadedTenderId, sections, sectionContents, tender]
  );

  // Handle back navigation
  const handleBack = () => {
    if (tenderType === 'platform') {
      navigate('/bidder/proposal-drafting');
    } else {
      navigate(`/bidder/uploaded-tenders/${uploadedTenderId}/analyze`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <BidderLayout>
        <div className="flex items-center justify-center h-screen">
          <Loading />
        </div>
      </BidderLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <BidderLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-2">Failed to load workspace</p>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </BidderLayout>
    );
  }

  const tenderTitle =
    tender?.title || tender?.tenderTitle || tender?.metadata?.title || 'Untitled Tender';

  return (
    <CollaborationProvider
      proposalId={tenderType === 'platform' ? (proposal?._id || proposal?.proposal_id) : null}
      uploadedTenderId={tenderType === 'uploaded' ? uploadedTenderId : null}
      tenderType={tenderType}
    >
      <BidderLayout>
        <div className="flex flex-col h-screen bg-slate-50">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-slate-200">
            <div className="px-4 py-3 flex items-center justify-between">
              {/* Left: Back button + Title */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                <div className="border-l border-slate-200 pl-4">
                  <h1 className="text-lg font-semibold text-slate-900 truncate max-w-xl">
                    {tenderTitle}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        tenderType === 'platform'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {tenderType === 'platform' ? 'Platform Tender' : 'Uploaded Tender'}
                    </span>
                    <span>•</span>
                    <span>{sections.length} sections</span>
                  </div>
                </div>
              </div>

              {/* Right: Status indicators */}
              <div className="flex items-center gap-3">
                {proposal?.status && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      proposal.status === 'SUBMITTED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {proposal.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <WorkspaceContent
            tenderType={tenderType}
            tender={tender}
            proposal={proposal}
            sections={sections}
            sectionContents={sectionContents}
            setSectionContents={setSectionContents}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onSave={handleSave}
            saving={saving}
            lastSaved={lastSaved}
          />
        </div>
      </BidderLayout>
    </CollaborationProvider>
  );
}
