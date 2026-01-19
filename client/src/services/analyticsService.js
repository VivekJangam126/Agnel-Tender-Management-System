import { apiRequest } from './apiClient.js';

// API base already includes /api, so keep this path relative to avoid double prefix
const BASE_URL = '/analytics';

export const analyticsService = {
  async getAnalytics(token) {
    return apiRequest(`${BASE_URL}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getTenderPerformance(token) {
    return apiRequest(`${BASE_URL}/performance`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getBidTimeline(token) {
    return apiRequest(`${BASE_URL}/bids/timeline`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getEvaluationSummary(token) {
    return apiRequest(`${BASE_URL}/evaluation/summary`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
