import api from './api';

export const aiService = {
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
