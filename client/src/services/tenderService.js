import { apiRequest } from './apiClient';

export const tenderService = {
	getTender: (id, token) => apiRequest(`/tenders/${id}`, { token }),
};
