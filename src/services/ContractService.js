import apiClient from './ApiClient';

export const getContracts = (profileId) => {
    return apiClient.get('/contracts', { params: { profile_id: profileId } });
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