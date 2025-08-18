import ApiClient from './ApiClient';

export const getTasks = (params = {}) => ApiClient.get('/tasks', { params });
export const createTask = (payload) => ApiClient.post('/tasks', payload);
export const updateTask = (id, payload) => ApiClient.put(`/tasks/${id}`, payload);
export const deleteTask = (id) => ApiClient.delete(`/tasks/${id}`);

