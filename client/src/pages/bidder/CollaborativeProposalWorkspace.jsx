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

// Default proposal sections that should always be available
const DEFAULT_PROPOSAL_SECTIONS = [
  { key: 'coverLetter', name: 'Cover Letter', description: 'Introduction and executive summary' },
  { key: 'companyProfile', name: 'Company Profile', description: 'Organization background and capabilities' },
  { key: 'technicalApproach', name: 'Technical Approach', description: 'Methodology and technical solution' },
  { key: 'teamComposition', name: 'Team Composition', description: 'Project team and qualifications' },
  { key: 'projectPlan', name: 'Project Plan', description: 'Timeline, milestones and deliverables' },
  { key: 'financialProposal', name: 'Financial Proposal', description: 'Pricing and payment terms' },
  { key: 'compliance', name: 'Compliance Statement', description: 'Eligibility and compliance declarations' },
  { key: 'pastExperience', name: 'Past Experience', description: 'Relevant projects and references' },
  { key: 'annexures', name: 'Annexures', description: 'Supporting documents and attachments' },
];

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
import { collaborationService } from '../../services/bidder/collaborationService';

/**
 * Section List Component for the sidebar
 */
function SectionListPanel({
  sections,
  activeSection,
  onSelectSection,
  sectionContents,
  assignments,
  onAddSection,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

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

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      onAddSection(newSectionName.trim());
      setNewSectionName('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Sections</h3>
            <p className="text-xs text-slate-500 mt-1">
              {sections.filter((s) => getSectionStatus(s) === 'complete').length} / {sections.length} complete
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Add custom section"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
          <p className="text-xs font-medium text-blue-800 mb-2">Add Custom Section</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              placeholder="Section name..."
              className="flex-1 px-2 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddSection}
              disabled={!newSectionName.trim()}
              className="px-2 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddModal(false); setNewSectionName(''); }}
              className="p-1.5 text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

                {/* Description */}
                {section.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{section.description}</p>
                )}

                {/* Metadata row */}
                <div className="flex items-center gap-2 mt-1">
                  {section.is_mandatory && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                      Required
                    </span>
                  )}

                  {section.isCustom && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                      Custom
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
  onAddSection,
}) {
  const { isOwner, assignments, loading: collaborationLoading } = useCollaboration();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showValidation, setShowValidation] = useState(false);

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
            onAddSection={onAddSection}
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

  // DEBUG: This should always show
  console.log('=== CollaborativeProposalWorkspace RENDERED ===');
  console.log('[CollaborativeWorkspace] Mounted with:', { tenderId, uploadedTenderId, tenderType, entityId });

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
  const [generatingInitialContent, setGeneratingInitialContent] = useState(false);
  const [initialContentProgress, setInitialContentProgress] = useState('');

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

          // Start with default proposal sections
          const defaultSections = DEFAULT_PROPOSAL_SECTIONS.map((section) => ({
            ...section,
            section_id: section.key,
            title: section.name,
            isDefault: true,
          }));

          // Get any additional sections from normalizedSections that aren't in defaults
          // normalizedSections have `category` as the key identifier
          const normalizedSections = uploadedData.normalizedSections || [];
          const defaultKeys = DEFAULT_PROPOSAL_SECTIONS.map(s => s.key);

          // Add normalized sections that aren't already in defaults
          const additionalSections = normalizedSections
            .filter(section => {
              const sectionKey = section.key || section.category;
              return sectionKey && !defaultKeys.includes(sectionKey);
            })
            .map((section, idx) => {
              const sectionKey = section.key || section.category || `normalized-${idx}`;
              return {
                ...section,
                key: sectionKey,
                section_id: sectionKey,
                title: section.name || section.title || sectionKey,
                isFromTender: true,
              };
            });

          // Combine: defaults first, then any additional from tender
          const allSections = [...defaultSections, ...additionalSections];
          setSections(allSections);

          // Load draft contents
          let draftData = null;
          try {
            console.log('[CollaborativeWorkspace] Fetching proposal draft for:', uploadedTenderId);
            const draftRes = await pdfAnalysisService.getProposalDraft(uploadedTenderId);
            draftData = draftRes.data?.data || draftRes.data;
            console.log('[CollaborativeWorkspace] Draft response:', draftData);
          } catch (draftErr) {
            // No existing draft - that's okay, we'll generate initial content
            console.log('[CollaborativeWorkspace] No existing draft found (404 expected):', draftErr.response?.status);
          }

          let contents = {};

          if (draftData) {
            console.log('[CollaborativeWorkspace] Draft data found, loading sections...');
            setProposal(draftData);
            // Load section contents from draft
            if (draftData.sections && Array.isArray(draftData.sections)) {
              console.log('[CollaborativeWorkspace] Draft has', draftData.sections.length, 'sections');
              draftData.sections.forEach((section) => {
                const key = section.key || section.section_key;
                const content = section.content || '';
                contents[key] = content;
                console.log(`[CollaborativeWorkspace] Section ${key}: ${content.length} chars`);
              });
            } else {
              console.log('[CollaborativeWorkspace] Draft has no sections array');
            }
          } else {
            console.log('[CollaborativeWorkspace] No draft data found');
          }

          // Check if we need to generate initial content
          // Generate if no draft exists OR if all sections are empty
          const contentValues = Object.values(contents);
          const hasExistingContent = contentValues.some(
            (content) => content && content.trim().length > 50
          );
          console.log('[CollaborativeWorkspace] Content check:', {
            totalSections: contentValues.length,
            hasExistingContent,
            contentLengths: Object.entries(contents).map(([k, v]) => `${k}: ${v?.length || 0}`)
          });

          if (!hasExistingContent) {
            // No existing content - generate initial AI content for all sections
            console.log('[CollaborativeWorkspace] No existing content found, generating initial content...');
            setGeneratingInitialContent(true);
            setInitialContentProgress('Generating initial proposal content based on tender analysis...');

            try {
              console.log('[CollaborativeWorkspace] Calling generateInitialContent API for:', uploadedTenderId);
              const initialContentRes = await collaborationService.generateInitialContent(uploadedTenderId);
              console.log('[CollaborativeWorkspace] Initial content response:', initialContentRes);

              if (initialContentRes?.sections && initialContentRes.sections.length > 0) {
                // Apply generated content to sections
                initialContentRes.sections.forEach((section) => {
                  if (section.key && section.content) {
                    contents[section.key] = section.content;
                    console.log(`[CollaborativeWorkspace] Added content for section: ${section.key}`);
                  }
                });

                // Save the generated content as draft
                try {
                  const sectionsToSave = Object.entries(contents)
                    .filter(([, content]) => content && content.trim().length > 0)
                    .map(([key, content]) => ({ key, content }));

                  if (sectionsToSave.length > 0) {
                    await pdfAnalysisService.saveProposalDraft({
                      uploadedTenderId,
                      sections: sectionsToSave,
                    });
                    console.log('[CollaborativeWorkspace] Saved initial content as draft');
                  }
                } catch (saveErr) {
                  console.error('[CollaborativeWorkspace] Failed to save initial draft:', saveErr);
                }
              } else {
                console.warn('[CollaborativeWorkspace] No sections returned from generateInitialContent');
              }
            } catch (genErr) {
              console.error('[CollaborativeWorkspace] Failed to generate initial content:', genErr);
              console.error('[CollaborativeWorkspace] Error details:', genErr.response?.data || genErr.message);
              // Continue without initial content - user can still manually write
            } finally {
              setGeneratingInitialContent(false);
              setInitialContentProgress('');
            }
          } else {
            console.log('[CollaborativeWorkspace] Existing content found, skipping initial generation');
          }

          setSectionContents(contents);

          // Set first section as active
          if (allSections.length > 0) {
            setActiveSection(allSections[0]);
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

  // Add custom section
  const handleAddSection = useCallback((sectionName) => {
    const key = sectionName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newSection = {
      key: `custom_${key}_${Date.now()}`,
      section_id: `custom_${key}_${Date.now()}`,
      name: sectionName,
      title: sectionName,
      description: 'Custom section',
      isCustom: true,
    };
    setSections(prev => [...prev, newSection]);
    setActiveSection(newSection);
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
          // For uploaded tenders, save to draft
          await pdfAnalysisService.saveProposalDraft({
            uploadedTenderId,
            sections: [{ key: sectionId, content }],
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
    [proposal, tenderType, uploadedTenderId]
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
        <div className="flex flex-col items-center justify-center h-screen">
          <Loading />
          {generatingInitialContent && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-blue-600">{initialContentProgress}</p>
              <p className="text-xs text-slate-500 mt-1">This may take a moment...</p>
            </div>
          )}
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
                {generatingInitialContent && (
                  <span className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating initial content...
                  </span>
                )}
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
            onAddSection={handleAddSection}
          />
        </div>
      </BidderLayout>
    </CollaborationProvider>
  );
}
