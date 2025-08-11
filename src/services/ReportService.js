import ApiClient from './ApiClient';

export default {
  generateReport(config) {
    return ApiClient.post('/reports/generate', config, {
      responseType: 'blob', // Important for file downloads
    });
  },
};