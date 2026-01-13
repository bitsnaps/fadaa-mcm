import apiClient from './ApiClient';

export const getMyDocuments = (params = {}) => apiClient.get('/investor/documents', { params });
export const getMyInvestments = (params = {}) => apiClient.get('/investor/investments', { params });
export const getMyWithdrawals = (params = {}) => apiClient.get('/investor/withdrawals', { params });
export const getProfitShareSeries = (params = {}) => apiClient.get('/investor/profit-share-series', { params });

