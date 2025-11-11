import apiClient from './ApiClient';

export const getIncomes = (profileId) => {
  return apiClient.get('/incomes', { params: { profile_id: profileId } });
};

export const getIncome = (id) => {
  return apiClient.get(`/incomes/${id}`);
};

export const addIncome = (incomeData) => {
  return apiClient.post('/incomes', incomeData);
};

export const updateIncome = (id, incomeData) => {
  return apiClient.put(`/incomes/${id}`, incomeData);
};

export const deleteIncome = (id) => {
  return apiClient.delete(`/incomes/${id}`);
};

export const getIncomesByCategories = () => {
  return apiClient.get('/categories/incomes');
};