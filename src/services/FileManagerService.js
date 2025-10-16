import apiClient from './ApiClient';

export default {
  listFiles(page = 1, limit = 5, search = '') {
    return apiClient.get(`/files?page=${page}&limit=${limit}&search=${search}`);
  },
  deleteFile(filePath) {
    return apiClient.delete(`/files/${filePath}`);
  },
  downloadFile(filePath) {
    return apiClient.get(`/files/download${filePath.startsWith('/') ? filePath : '/' + filePath}`, {
      responseType: 'blob',
    });
  }
};