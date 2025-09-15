import apiClient from './ApiClient';

export default {
  listFiles(page = 1, limit = 5, search = '') {
    return apiClient.get(`/files?page=${page}&limit=${limit}&search=${search}`);
  },
  deleteFile(filePath) {
    return apiClient.delete(`/files/${encodeURIComponent(filePath)}`);
  },
  downloadFile(filePath) {
    return apiClient.get(`/misc/download?file_path=${encodeURIComponent(filePath)}`, {
      responseType: 'blob',
    });
  }
};