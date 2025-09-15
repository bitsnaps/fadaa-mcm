import apiClient from './ApiClient';

export default {
  listTrash(page = 1, limit = 5) {
    return apiClient.get(`/trash?page=${page}&limit=${limit}`);
  },
  permanentDeleteFile(filePath) {
    return apiClient.delete(`/trash/${encodeURIComponent(filePath)}`);
  },
  emptyTrash() {
    return apiClient.post('/trash/empty');
  },
};