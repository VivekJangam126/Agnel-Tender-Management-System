import api from './api';

export const aiService = {
  /**
   * RAG-based tender chat - queries tender content using vector similarity search
   * This is the main chatbot function for bidders analyzing tenders
   * Uses embeddings to find relevant tender sections and provides contextual answers
   */
  tenderChat: async (tenderId, question) => {
    const response = await api.post('/ai/query', {
      tenderId,
      question
    });
    return response;
  },

  /**
   * Analyze tender for insights (match score, strengths, concerns)
   */
  analyzeTender: async (tenderId) => {
    const response = await api.post('/bidder/tenders/' + tenderId + '/analyze', {
      question: 'Analyze this tender comprehensively. Provide: 1) Key requirements summary, 2) Potential risks, 3) Strategic recommendations for bidding.'
    });
    return response;
  },

  suggestSections: async (data) => {
    const response = await api.post('/ai/suggest-sections', data);
    return response;
  },

  explain: async (data) => {
    const response = await api.post('/ai/explain', data);
    return response;
  },

  generateContent: async (data) => {
    const response = await api.post('/ai/generate-content', data);
    return response;
  },

  rewriteLegal: async (data) => {
    const response = await api.post('/ai/rewrite-legal', data);
    return response;
  },

  proposalHelp: async (data) => {
    const response = await api.post('/ai/proposal-help', data);
    return response;
  },

  checkCompliance: async (data) => {
    const response = await api.post('/ai/check-compliance', data);
    return response;
  },
};
