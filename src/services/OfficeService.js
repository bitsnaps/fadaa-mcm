import apiClient from './ApiClient';

export function getAvailableOffices() {
    return apiClient.get('/offices');
}

export const getOffices = (params) => {
    return apiClient.get('/offices', { params });
};

export const getBranches = () => {
    return apiClient.get('/misc/branches');
};

export const addOffice = (officeData) => {
    return apiClient.post('/offices', officeData);
};

export const updateOffice = (id, officeData) => {
    return apiClient.put(`/offices/${id}`, officeData);
};

export const deleteOffice = (id) => {
    return apiClient.delete(`/offices/${id}`);
};