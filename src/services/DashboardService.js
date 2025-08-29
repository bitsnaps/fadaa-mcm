import apiClient from './ApiClient';

export const getTotalIncome = (params) => {
    return apiClient.get('/incomes/total', { params });
};

export const getTotalExpense = (params) => {
    return apiClient.get('/expenses/total', { params });
};

export const getMonthlyIncomeByBranch = (params) => {
    return apiClient.get('/incomes/monthly-by-branch', { params });
};

export const getRevenueSummary = (params) => {
    return apiClient.get('/financials/revenue-summary', { params });
};

export const getInvestorKpis = (params) => {
    return apiClient.get('/investor/kpis', { params });
};