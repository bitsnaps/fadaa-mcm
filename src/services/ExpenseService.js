import apiClient from './ApiClient';

export const getExpenses = (profileId) => {
  return apiClient.get('/expenses', { params: { profile_id: profileId } });
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

export const getExpensesByCategories = () => {
  return apiClient.get('/categories/expenses');
};