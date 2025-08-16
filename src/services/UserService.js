import apiClient from './ApiClient';

export const getInvestors = () => {
    return apiClient.get('/users/role/Investor');
};

export const getAssistants = () => {
    return apiClient.get('/users/role/Assistant');
};

export const getUsers = () => {
    return apiClient.get('/users');
};

export const getRoles = () => {
    return apiClient.get('/misc/roles');
};

export const getBranches = () => {
    return apiClient.get('/misc/branches');
};

export const addUser = (userData) => {
    return apiClient.post('/users', userData);
};

export const updateUser = (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
};

export const deleteUser = (id) => {
    return apiClient.delete(`/users/${id}`);
};