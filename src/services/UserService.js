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

export const updateUserPreferences = (id, preferences) => {
    return apiClient.put(`/users/preferences/${id}`, preferences);
};
export const updateUserProfile = (id, userData) => {
    return apiClient.put(`/users/profile/${id}`, userData);
};

export const changePassword = (id, passwordData) => {
    return apiClient.post(`/users/change-password/${id}`, passwordData);
};

export const uploadProfilePicture = (id, formData) => {
    return apiClient.post(`/users/profile-picture/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};