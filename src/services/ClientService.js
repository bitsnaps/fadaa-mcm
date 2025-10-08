import apiClient from './ApiClient';

export const getClients = (params = {}) => {
    return apiClient.get('/clients', { params });
};

export const getClientInvestments = (clientId) => {
    return apiClient.get(`/clients/${clientId}/investments`);
};

export const deleteClient = (clientId) => {
    return apiClient.delete(`/clients/${clientId}`);
};

export const getTotalClients = () => {
    return apiClient.get('/clients/total');
};

export const exportClients = (config) => {
  return apiClient.post('/clients/export', config, {
    responseType: 'blob',
  });
};