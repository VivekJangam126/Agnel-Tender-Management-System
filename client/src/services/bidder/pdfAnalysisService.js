/**
 * PDF Analysis Service
 * Client-side service for PDF upload and analysis
 */
import api from './api';

export const pdfAnalysisService = {
  /**
   * Upload and analyze a PDF tender document
   * @param {File} file - PDF file to analyze
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePDF(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }

    const response = await api.post('/pdf/analyze', formData, config);
    return response.data;
  },

  /**
   * Create uploaded tender record from analysis data
   * @param {Object} data - { title, description, originalFilename?, fileSize?, parsedData?, analysisData?, metadata? }
   * @returns {Promise<Object>} Created tender
   */
  async createUploadedTender(data) {
    const response = await api.post('/bidder/uploaded-tenders', data);
    return response.data;
  },

  /**
   * Evaluate a proposal against tender requirements
   * UPDATED: Sends only sessionId and minimal proposal data (no large payloads)
   * @param {string} sessionId - Analysis session ID
   * @param {Object} proposal - Minimal proposal with sections [{id, title, content}]
   * @param {string} tenderId - Optional tender ID for reference
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluateProposal(sessionId, proposal, tenderId = null) {
    const sections = proposal?.sections || [];
    if (!sessionId) {
      throw new Error('Missing analysis sessionId for evaluation');
    }
    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('No proposal sections provided for evaluation');
    }

    const response = await api.post('/pdf/evaluate', {
      sessionId,
      proposal: {
        sections: sections.map(s => ({
          id: s.id,
          title: s.title,
          content: s.content,
          wordCount: s.wordCount,
        })),
      },
      tenderId,
    });
    return response.data;
  },

  /**
   * Regenerate a specific proposal section
   * @param {Object} params - Section regeneration params
   * @returns {Promise<Object>} New section content
   */
  async regenerateSection({ sectionId, sectionTitle, tenderContext, currentContent, instructions }) {
    const response = await api.post('/pdf/regenerate-section', {
      sectionId,
      sectionTitle,
      tenderContext,
      currentContent,
      instructions,
    });
    return response.data;
  },

  /**
   * Export proposal as professional PDF
   * @param {Object} params - Export parameters
   * @returns {Promise<Blob>} PDF blob for download
   */
  async exportProposalPDF({ proposalSections, tenderInfo, companyInfo, template }) {
    const response = await api.post('/pdf/export', {
      proposalSections,
      tenderInfo,
      companyInfo,
      template,
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get available export templates
   * @returns {Promise<Object>} Templates list
   */
  async getExportTemplates() {
    const response = await api.get('/pdf/templates');
    return response.data;
  },

  // ==========================================
  // UPLOADED PROPOSAL DRAFTS
  // ==========================================

  /**
   * Get uploaded tender by ID
   * @param {string} uploadedTenderId - Uploaded tender ID
   * @returns {Promise<Object>} Uploaded tender data
   */
  async getUploadedTender(uploadedTenderId) {
    const response = await api.get(`/bidder/uploaded-tenders/${uploadedTenderId}`);
    return response.data;
  },

  /**
   * Save or update a proposal draft for an uploaded tender
   * @param {string} uploadedTenderId - Uploaded tender ID
   * @param {Object} params - { sections, title? }
   * @returns {Promise<Object>} Saved draft
   */
  async saveProposalDraft(uploadedTenderId, params) {
    const response = await api.post('/bidder/uploaded-proposal-drafts', {
      uploadedTenderId,
      sections: params.sections,
      title: params.title,
    });
    return response.data;
  },

  /**
   * Get proposal draft by uploaded tender ID
   * @param {string} uploadedTenderId - Uploaded tender ID
   * @returns {Promise<Object>} Draft data
   */
  async getProposalDraft(uploadedTenderId) {
    const response = await api.get(`/bidder/uploaded-proposal-drafts/tender/${uploadedTenderId}`);
    return response.data;
  },

  /**
   * Get all proposal drafts for uploaded tenders
   * @param {Object} params - Query params
   * @returns {Promise<Object>} List of drafts
   */
  async getProposalDrafts(params = {}) {
    const response = await api.get('/bidder/uploaded-proposal-drafts', { params });
    return response.data;
  },

  /**
   * Get proposal draft by ID
   * @param {string} draftId - Draft ID
   * @returns {Promise<Object>} Draft data
   */
  async getProposalDraftById(draftId) {
    const response = await api.get(`/bidder/uploaded-proposal-drafts/${draftId}`);
    return response.data;
  },

  /**
   * Get proposal draft by uploaded tender ID (DEPRECATED - use getProposalDraft)
   * @param {string} uploadedTenderId - Uploaded tender ID
   * @returns {Promise<Object>} Draft data
   */
  async getProposalDraftByTenderId(uploadedTenderId) {
    return this.getProposalDraft(uploadedTenderId);
  },

  /**
   * Update draft status
   * @param {string} draftId - Draft ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated draft
   */
  async updateDraftStatus(draftId, status) {
    const response = await api.put(`/bidder/uploaded-proposal-drafts/${draftId}/status`, { status });
    return response.data;
  },

  /**
   * Record an export of the draft
   * @param {string} draftId - Draft ID
   * @returns {Promise<Object>} Updated draft
   */
  async recordDraftExport(draftId) {
    const response = await api.post(`/bidder/uploaded-proposal-drafts/${draftId}/export`);
    return response.data;
  },

  /**
   * Delete a proposal draft
   * @param {string} draftId - Draft ID
   * @returns {Promise<Object>} Success response
   */
  async deleteProposalDraft(draftId) {
    const response = await api.delete(`/bidder/uploaded-proposal-drafts/${draftId}`);
    return response.data;
  },
};

export default pdfAnalysisService;
