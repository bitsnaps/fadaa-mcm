import apiClient from './ApiClient';

export const getClients = (branchId = null) => {
    const params = {};
    if (branchId) {
        params.branchId = branchId;
    }
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