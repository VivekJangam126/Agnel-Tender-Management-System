import api from './api';

/**
 * RAG Service - Handles RAG-powered tender analysis
 */
export const ragService = {
  /**
   * Initialize tender analysis session
   * Starts PDF embedding process
   */
  initSession: async (tenderId) => {
    const response = await api.post('/rag/sessions/init', { tender_id: tenderId });
    return response.data;
  },

  /**
   * Check session status
   * Polls to see if embedding is complete
   */
  getSessionStatus: async (sessionId) => {
    const response = await api.get(`/rag/sessions/${sessionId}/status`);
    return response.data;
  },

  /**
   * Get tender overview (RAG-based summary)
   */
  getTenderOverview: async (sessionId, tenderId) => {
    const response = await api.post('/rag/analysis/overview', {
      session_id: sessionId,
      tender_id: tenderId,
    });
    return response.data;
  },

  /**
   * Get section-wise summaries
   */
  getSectionSummaries: async (sessionId, sections) => {
    const response = await api.post('/rag/analysis/sections', {
      session_id: sessionId,
      sections,
    });
    return response.data;
  },

  /**
   * Get AI insights (comparative analysis)
   */
  getAIInsights: async (sessionId, tenderId) => {
    const response = await api.post('/rag/analysis/insights', {
      session_id: sessionId,
      tender_id: tenderId,
    });
    return response.data;
  },

  /**
   * Chat with tender document
   */
  chat: async (sessionId, question, conversationHistory = []) => {
    const response = await api.post('/rag/chat', {
      session_id: sessionId,
      question,
      conversation_history: conversationHistory,
    });
    return response.data;
  },

  /**
   * Poll session status until ready
   * @param {string} sessionId 
   * @param {number} maxAttempts 
   * @param {number} intervalMs 
   * @returns {Promise<Object>} Session status when ready
   */
  pollSessionReady: async (sessionId, maxAttempts = 30, intervalMs = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await ragService.getSessionStatus(sessionId);
      
      if (status.status === 'READY') {
        return status;
      }
      
      if (status.status === 'FAILED') {
        throw new Error(status.error_message || 'Session processing failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Session timeout: embedding took too long');
  },
};
