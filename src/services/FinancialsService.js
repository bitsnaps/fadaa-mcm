import ApiClient from './ApiClient';

export default {
  getRevenueSummary(profileId, startDate, endDate) {
    return ApiClient.get('/financials/revenue-summary', {
      params: {
        profile_id: profileId,
        startDate,
        endDate,
      },
    });
  },

  getRevenueSeries(profileId, startDate, endDate) {
    return ApiClient.get('/financials/revenue-series', {
      params: {
        profile_id: profileId,
        startDate,
        endDate,
      },
    });
  },
};