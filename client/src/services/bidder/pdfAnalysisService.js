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
   * Evaluate a proposal against tender requirements
   * @param {Object} proposal - Proposal with sections
   * @param {Object} tenderAnalysis - Original tender analysis
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluateProposal(proposal, tenderAnalysis) {
    const response = await api.post('/pdf/evaluate', {
      proposal,
      tenderAnalysis,
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
};

export default pdfAnalysisService;
