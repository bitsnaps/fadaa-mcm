import apiClient from './ApiClient';

export const getRevenueSummary = (params) => apiClient.get('/financials/revenue-summary', { params });
export const getRevenueSeries = (params) => apiClient.get('/financials/revenue-series', { params });

