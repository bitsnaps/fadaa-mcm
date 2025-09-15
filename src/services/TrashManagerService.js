import apiClient from './ApiClient';

export default {
  listTrash(page = 1, limit = 5, search = '') {
    return apiClient.get(`/trash?page=${page}&limit=${limit}&search=${search}`);
  },
  permanentDeleteFile(filePath) {
    return apiClient.delete(`/trash/${encodeURIComponent(filePath)}`);
  },
  emptyTrash() {
    return apiClient.post('/trash/empty');
  },
};