import apiClient from './ApiClient';

export const getExpenses = () => {
  return apiClient.get('/expenses');
};

export const getExpense = (id) => {
  return apiClient.get(`/expenses/${id}`);
};

export const addExpense = (expenseData) => {
  return apiClient.post('/expenses', expenseData);
};

export const updateExpense = (id, expenseData) => {
  return apiClient.put(`/expenses/${id}`, expenseData);
};

export const deleteExpense = (id) => {
  return apiClient.delete(`/expenses/${id}`);
};