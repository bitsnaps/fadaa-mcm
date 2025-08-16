import apiClient from './ApiClient';

export const getBranches = () => {
    return apiClient.get('/branches');
};