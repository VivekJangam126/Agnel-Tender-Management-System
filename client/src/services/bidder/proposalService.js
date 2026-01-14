import api from './api';

export const proposalService = {
  createProposal: async (tenderId) => {
    const response = await api.post('/bidder/proposals', { tenderId });
    return response;
  },

  getMyProposals: async (params) => {
    const response = await api.get('/bidder/proposals/my-proposals', { params });
    return response;
  },

  getProposalById: async (id) => {
    const response = await api.get(`/bidder/proposals/${id}`);
    return response;
  },

  // Get proposal by tender ID (used for workspace)
  getProposalByTenderId: async (tenderId) => {
    const response = await api.get(`/bidder/proposals/tender/${tenderId}`);
    return response;
  },

  updateProposalSection: async (proposalId, sectionId, content) => {
    const response = await api.put(
      `/bidder/proposals/${proposalId}/sections/${sectionId}`,
      { content }
    );
    return response;
  },

  submitProposal: async (proposalId) => {
    const response = await api.post(`/bidder/proposals/${proposalId}/submit`);
    return response;
  },

  /**
   * Get AI analysis for a proposal section (advisory only)
   * No auto-write, no auto-apply
   */
  analyzeSectionAsync: async (proposalId, sectionId, data) => {
    const { draftContent, tenderRequirement, sectionType, userQuestion } = data;
    
    try {
      const response = await api.post(
        `/bidder/proposals/${proposalId}/sections/${sectionId}/analyze`,
        {
          draftContent,
          tenderRequirement,
          sectionType,
          userQuestion
        }
      );
      
      return {
        success: true,
        analysis: response.data?.data?.analysis || {}
      };
    } catch (error) {
      // Even on error, return a fallback response
      console.error('AI analysis failed:', error.message);
      return {
        success: false,
        analysis: {
          observation: 'Unable to fetch AI analysis',
          suggestedText: 'Review your draft manually',
          reason: 'AI service temporarily unavailable. Please try again or review manually.',
          isFallback: true
        }
      };
    }
  },

  checkCompliance: async (sectionId) => {
    const response = await api.post(`/bidder/proposals/sections/${sectionId}/check-compliance`);
    return response;
  },

  getAnalytics: async () => {
    const response = await api.get('/bidder/proposals/analytics');
    return response;
  },
};

