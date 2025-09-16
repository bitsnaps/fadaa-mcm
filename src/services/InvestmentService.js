import apiClient from './ApiClient';

export const getInvestmentsList = () => {
    return apiClient.get('/misc/investments');
};

export const getInvestments = (profileId) => {
    return apiClient.get('/investments', { params: { profile_id: profileId } });
};

export const getInvestment = (id) => {
    return apiClient.get(`/investments/${id}`);
};

export const addInvestment = (investmentData) => {
    return apiClient.post('/investments', investmentData);
};

export const updateInvestment = (id, investmentData) => {
    return apiClient.put(`/investments/${id}`, investmentData);
};

export const deleteInvestment = (id) => {
    return apiClient.delete(`/investments/${id}`);
};

export const getMyInvestments = (params = {}) => {
  return apiClient.get('/investor/investments', { params });
};
export const getInvestmentsByInvestor = (investorId) => {
    return apiClient.get(`/investments/by-investor/${investorId}`);
};