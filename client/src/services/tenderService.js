import { apiRequest } from './apiClient';

export const tenderService = {
  listTenders: (token, filters = {}) => {
    const search = new URLSearchParams(filters);
    const query = search.toString();
    return apiRequest(`/api/tenders${query ? `?${query}` : ''}`, { token });
  },

  createTender: (payload, token) => 
    apiRequest('/api/tenders', { method: 'POST', token, body: payload }),
  
  getTender: (id, token) => 
    apiRequest(`/api/tenders/${id}`, { token }),
  
  updateTender: (id, payload, token) => 
    apiRequest(`/api/tenders/${id}`, { method: 'PUT', token, body: payload }),
  
  publishTender: (id, token) => 
    apiRequest(`/api/tenders/${id}/publish`, { method: 'POST', token }),
  
    listSavedTenders: (token) => 
      apiRequest(`/api/saved-tenders`, { token }),
  
  addSection: (tenderId, payload, token) => 
    apiRequest(`/api/tenders/${tenderId}/sections`, { method: 'POST', token, body: payload }),
  
  updateSection: (sectionId, payload, token) => 
    apiRequest(`/api/tenders/sections/${sectionId}`, { method: 'PUT', token, body: payload }),
  
  deleteSection: (sectionId, token) => 
    apiRequest(`/api/tenders/sections/${sectionId}`, { method: 'DELETE', token }),
  
  reorderSections: (tenderId, orderedSectionIds, token) => 
    apiRequest(`/api/tenders/${tenderId}/sections/order`, { method: 'PUT', token, body: { orderedSectionIds } }),
};
