import ApiClient from './ApiClient';

export default {
  generateReport(config) {
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
};