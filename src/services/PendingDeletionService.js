import ApiClient from './ApiClient';

export const getPendingDeletions = () => {
    return ApiClient.get('/pending-deletions');
};

export const approveDeletion = (id) => {
    return ApiClient.post(`/pending-deletions/${id}/status`, { status: 'approved' });
};

export const rejectDeletion = (id) => {
    return ApiClient.post(`/pending-deletions/${id}/status`, { status: 'rejected' });
};