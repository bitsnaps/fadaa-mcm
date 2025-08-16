import apiClient from './ApiClient';

export const getActivityLogs = () => {
    return apiClient.get('/activity-logs');
};