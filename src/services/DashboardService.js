import apiClient from './ApiClient';

export const getTotalIncome = (params) => {
    return apiClient.get('/incomes/total', { params });
};

export const getTotalExpense = (params) => {
    return apiClient.get('/expenses/total', { params });
};

export const getMonthlyIncomeByBranch = () => {
    return apiClient.get('/incomes/monthly-by-branch');
};

export const getRevenueSummary = (params) => {
    return apiClient.get('/financials/revenue-summary', { params });
};