import apiClient from './ApiClient';

export default {
  listFiles() {
    return apiClient.get('/files');
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