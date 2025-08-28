import apiClient from './ApiClient';

export const getBranches = () => {
    return apiClient.get('/branches');
};
export const getBranchesWithContracts = () => {
    return apiClient.get('/branches/with-contracts');
};