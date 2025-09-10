import apiClient from './ApiClient';

export const getContracts = (params) => {
    return apiClient.get('/contracts', { params });
};

export const addContract = (formData) => {
    return apiClient.post('/contracts', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const updateContract = (id, formData) => {
    return apiClient.put(`/contracts/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};