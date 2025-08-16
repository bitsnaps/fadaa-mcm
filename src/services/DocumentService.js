import apiClient from './ApiClient';

export const getDocuments = () => {
    return apiClient.get('/documents');
};

export const addDocument = (formData) => {
    return apiClient.post('/documents', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const updateDocument = (id, data) => {
    return apiClient.put(`/documents/${id}`, data);
};

export const deleteDocument = (id) => {
    return apiClient.delete(`/documents/${id}`);
};