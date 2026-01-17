/**
 * Collaborative Proposal Editor
 * Enhanced editor with collaboration features:
 * - Permission-based editing (read-only for insufficient permissions)
 * - AI draft generation with insights panel
 * - Assigned users display
 * - Last edited info
 * - Comment panel integration
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Edit3,
  Users,
  Clock,
  Sparkles,
  Loader2,
  MessageSquare,
  Lock,
  UserPlus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  Copy,
  Check,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import UserAssignmentModal from './UserAssignmentModal';
import CommentPanel from './CommentPanel';

export default function CollaborativeProposalEditor({
  section,
  content,
  onContentChange,
  onSave,
  proposalId,
  saving = false,
  lastSaved = null,
}) {
  const {
    isOwner,
    assignments,
    lastEdits,
    canEditSection,
    canCommentSection,
    getSectionPermission,
    generateDraft,
  } = useCollaboration();

  // State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftError, setDraftError] = useState(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showInstructionsInput, setShowInstructionsInput] = useState(false);

  // AI Insights Panel State
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [aiGeneratedDraft, setAiGeneratedDraft] = useState(null);
  const [aiDraftMeta, setAiDraftMeta] = useState(null);
  const [copied, setCopied] = useState(false);

  const sectionId = section?.section_id || section?._id || section?.id || section?.key;
  const sectionTitle = section?.title || section?.sectionTitle || section?.name || 'Untitled Section';

  // Permissions
  const canEdit = canEditSection(sectionId);
  const canComment = canCommentSection(sectionId);
  const permission = getSectionPermission(sectionId);

  // Assigned users for this section - use useMemo to stabilize reference
  const sectionAssignees = useMemo(
    () => assignments[sectionId] || [],
    [assignments, sectionId]
  );
  const lastEdit = lastEdits[sectionId];

  // Handle AI draft generation - now shows in insights panel
  const handleGenerateDraft = useCallback(async () => {
    if (!canEdit || generatingDraft) return;

    setGeneratingDraft(true);
    setDraftError(null);
    setAiGeneratedDraft(null);
    setAiDraftMeta(null);

    try {
      const result = await generateDraft(sectionId, customInstructions);

      if (result?.draft) {
        setAiGeneratedDraft(result.draft);
        setAiDraftMeta({
          wordCount: result.wordCount,
          sectionType: result.sectionType,
          suggestedStructure: result.suggestedStructure || [],
          disclaimer: result.disclaimer,
        });
        setShowInsightsPanel(true);
        setShowInstructionsInput(false);
        setCustomInstructions('');
      }
    } catch (err) {
      console.error('Draft generation error:', err);
      setDraftError(err.response?.data?.error || 'Failed to generate draft');
    } finally {
      setGeneratingDraft(false);
    }
  }, [sectionId, canEdit, generatingDraft, customInstructions, generateDraft]);

  // Apply AI draft to editor
  const handleApplyDraft = useCallback(() => {
    if (!aiGeneratedDraft) return;

    // If there's existing content, confirm replacement
    if (content && content.trim().length > 50) {
      const confirmed = confirm(
        'This will replace your current content with the AI-generated draft. Continue?'
      );
      if (!confirmed) return;
    }

    onContentChange(aiGeneratedDraft);
    setShowInsightsPanel(false);
    setAiGeneratedDraft(null);
    setAiDraftMeta(null);
  }, [aiGeneratedDraft, content, onContentChange]);

  // Copy AI draft to clipboard
  const handleCopyDraft = useCallback(async () => {
    if (!aiGeneratedDraft) return;
    try {
      await navigator.clipboard.writeText(aiGeneratedDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [aiGeneratedDraft]);

  // Close insights panel
  const handleCloseInsights = useCallback(() => {
    setShowInsightsPanel(false);
  }, []);

  // Handle content change
  const handleContentChange = useCallback((e) => {
    if (!canEdit) return;
    onContentChange(e.target.value);
  }, [canEdit, onContentChange]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                {sectionTitle}
                {section?.is_mandatory && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                    Required
                  </span>
                )}
              </h2>

              {/* Permission badge */}
              <div className="flex items-center gap-3 mt-2">
                {permission === 'OWNER' ? (
                  <span className="flex items-center gap-1 text-xs text-blue-600">
                    <CheckCircle className="w-3 h-3" />
                    Full Access (Owner)
                  </span>
                ) : permission === 'EDIT' ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Edit3 className="w-3 h-3" />
                    Can Edit
                  </span>
                ) : permission === 'READ_AND_COMMENT' ? (
                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                    <MessageSquare className="w-3 h-3" />
                    View & Comment
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Lock className="w-3 h-3" />
                    Read Only
                  </span>
                )}

                {/* Last edited info */}
                {lastEdit && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    Last edited by {lastEdit.user_name}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Assigned users badges */}
              {sectionAssignees.length > 0 && (
                <div className="flex items-center gap-1 mr-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div className="flex -space-x-2">
                    {sectionAssignees.slice(0, 3).map((user) => (
                      <div
                        key={user.user_id}
                        className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"
                        title={`${user.name} (${user.permission === 'EDIT' ? 'Can Edit' : 'Can Comment'})`}
                      >
                        <span className="text-xs font-medium text-blue-700">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {sectionAssignees.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">
                          +{sectionAssignees.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manage assignments button (owner only) */}
              {isOwner && (
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign
                </button>
              )}

              {/* Toggle comments */}
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  showComments
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Comments
              </button>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {/* AI Draft Section (only for edit permission) */}
          {canEdit && (
            <div className="mb-4">
              {showInstructionsInput ? (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Custom Instructions (Optional)
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Focus on technical specifications, keep it concise..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      onClick={() => {
                        setShowInstructionsInput(false);
                        setCustomInstructions('');
                      }}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateDraft}
                      disabled={generatingDraft}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {generatingDraft ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInstructionsInput(true)}
                    disabled={generatingDraft}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-medium rounded-lg transition-all shadow-sm"
                  >
                    {generatingDraft ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating AI Draft...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate AI Draft
                      </>
                    )}
                  </button>

                  {/* Show AI Insights button if draft exists */}
                  {aiGeneratedDraft && !showInsightsPanel && (
                    <button
                      onClick={() => setShowInsightsPanel(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg transition-colors"
                    >
                      <Lightbulb className="w-4 h-4" />
                      View AI Insights
                    </button>
                  )}
                </div>
              )}

              {/* Draft error */}
              {draftError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <span className="text-sm text-red-700">{draftError}</span>
                </div>
              )}
            </div>
          )}

          {/* Read-only notice */}
          {!canEdit && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {permission === 'READ_AND_COMMENT'
                  ? 'You have comment-only access. Use the comment panel to provide feedback.'
                  : 'You have read-only access to this section.'}
              </span>
            </div>
          )}

          {/* Text Editor */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <textarea
              value={content || ''}
              onChange={handleContentChange}
              placeholder={
                canEdit
                  ? 'Start typing your response...'
                  : 'No content yet'
              }
              disabled={!canEdit}
              className={`w-full min-h-[400px] p-4 text-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg ${
                !canEdit ? 'bg-slate-50 cursor-not-allowed' : ''
              }`}
              style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.6' }}
            />
          </div>

          {/* Save status */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-slate-500">
              {content ? `${content.split(/\s+/).filter(w => w).length} words` : '0 words'}
            </span>
            <span className="text-slate-500">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Saved
                </span>
              ) : null}
            </span>
          </div>

          {/* Section requirements (if available) */}
          {(section?.content || section?.description) && (
            <div className="mt-6 p-4 bg-slate-100 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                Section Requirements
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {section.content || section.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Panel (collapsible right panel) */}
      {showInsightsPanel && aiGeneratedDraft && (
        <div className="w-[420px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">AI Insights</h3>
              </div>
              <button
                onClick={handleCloseInsights}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {aiDraftMeta && (
              <p className="text-xs text-slate-600 mt-1">
                {aiDraftMeta.wordCount} words | {aiDraftMeta.sectionType} section
              </p>
            )}
          </div>

          {/* Suggested Structure */}
          {aiDraftMeta?.suggestedStructure?.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-200 bg-blue-50">
              <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wide mb-2">
                Suggested Structure
              </h4>
              <ul className="space-y-1">
                {aiDraftMeta.suggestedStructure.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-blue-700">
                    <span className="w-4 h-4 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-medium">
                      {idx + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated Draft Preview */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Generated Draft
              </h4>
              <button
                onClick={handleCopyDraft}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
              {aiGeneratedDraft}
            </div>

            {/* Disclaimer */}
            {aiDraftMeta?.disclaimer && (
              <p className="mt-3 text-xs text-slate-500 italic">
                {aiDraftMeta.disclaimer}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-2">
              <button
                onClick={handleCloseInsights}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDraft}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply to Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Panel (collapsible) */}
      {showComments && (
        <CommentPanel
          sectionId={sectionId}
          sectionTitle={sectionTitle}
          className="w-80 flex-shrink-0"
        />
      )}

      {/* Assignment Modal */}
      <UserAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        sectionId={sectionId}
        sectionTitle={sectionTitle}
      />
    </div>
  );
}
