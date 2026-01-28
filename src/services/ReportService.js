import ApiClient from './ApiClient';

export default {
  generateReport(config) {
    return ApiClient.post('/reports/generate', config, {
      responseType: 'blob',
    });
  },
  downloadReport(config) {
    return ApiClient.post('/reports/generate', config, {
      responseType: 'blob',
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
  getFinancialSummary(profileId, period, startDate, endDate) {
    const params = {
      profile_id: profileId,
    };

    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else if (period) {
      params.period = period;
    }

    // console.debug('[ReportService.getFinancialSummary] Request params:', params);
    return ApiClient.get('/reports/financial-summary', { params });
  },
};