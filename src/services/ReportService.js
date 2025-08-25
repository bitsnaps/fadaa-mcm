import ApiClient from './ApiClient';

export default {
  downloadReport(config) {
    return ApiClient.post('/reports/generate', config, {
      responseType: 'blob', // Important for file downloads
    });
  },
  getMonthlyReport(filters) {
    return ApiClient.get('/reports/monthly', { params: filters });
  },
  getAnnualReport(filters) {
    return ApiClient.get('/reports/annual', { params: filters });
  },
  downloadMonthlyReport(config) {
    return ApiClient.post('/reports/monthly/download', config, {
      responseType: 'blob',
    });
  },
  downloadAnnualReport(config) {
    return ApiClient.post('/reports/annual/download', config, {
      responseType: 'blob',
    });
  },
};