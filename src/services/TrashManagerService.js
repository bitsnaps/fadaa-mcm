import apiClient from './ApiClient';

export default {
  listTrash() {
    return apiClient.get('/trash');
  },
  permanentDeleteFile(filePath) {
    return apiClient.delete(`/trash/${encodeURIComponent(filePath)}`);
  },
  emptyTrash() {
    return apiClient.post('/trash/empty');
  },
};