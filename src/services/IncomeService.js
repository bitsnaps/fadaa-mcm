import apiClient from './ApiClient';

export const getIncomes = () => {
  return apiClient.get('/incomes');
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