import { apiRequest } from './apiClient';

export const proposalService = {
  listMine: (token) => apiRequest('/proposals/mine', { token }),
  createDraft: (tenderId, token) => apiRequest('/proposals', { method: 'POST', token, body: { tenderId } }),
  getProposal: (id, token) => apiRequest(`/proposals/${id}`, { token }),
    listMine: (token) => apiRequest('/api/proposals/mine', { token }),
    createDraft: (tenderId, token) => apiRequest('/api/proposals', { method: 'POST', token, body: { tenderId } }),
    getProposal: (id, token) => apiRequest(`/api/proposals/${id}`, { token }),
    saveSectionResponse: (proposalId, sectionId, content, token) =>
      apiRequest(`/api/proposals/${proposalId}/sections/${sectionId}`, {
        method: 'PUT',
        token,
        body: { content },
      }),
    submit: (proposalId, token) => apiRequest(`/api/proposals/${proposalId}/submit`, { method: 'POST', token }),
};
