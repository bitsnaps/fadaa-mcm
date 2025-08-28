import apiClient from './ApiClient';

// --- Admin/Assistant: Withdrawals management ---
export const getAllWithdrawals = (params = {}) => {
  return apiClient.get('/withdrawals', { params });
};


export const getWithdrawal = (id) => {
  return apiClient.get(`/withdrawals/${id}`);
};

export const createWithdrawalAsAdmin = (data) => {
  return apiClient.post('/withdrawals', data);
};

export const updateWithdrawal = (id, data) => {
  return apiClient.put(`/withdrawals/${id}`, data);
};


export const deleteWithdrawal = (id) => {
  return apiClient.delete(`/withdrawals/${id}`);
};

/* Investor-facing withdrawals and investments endpoints */

export const getMyWithdrawals = (params = {}) => {
  return apiClient.get('/investor/withdrawals', { params });
};

export const getAvailableWithdrawalAmount = (investmentId) => {
  return apiClient.get(`/investor/withdrawals/available/${investmentId}`);
};

export const createWithdrawal = (payload) => {
  return apiClient.post('/investor/withdrawals', payload);
};