import { apiRequest } from './apiClient';

export const authService = {
	login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
	signup: (payload) => apiRequest('/api/auth/signup', { method: 'POST', body: payload }),
	me: (token) => apiRequest('/api/auth/me', { method: 'GET', token }),
};
