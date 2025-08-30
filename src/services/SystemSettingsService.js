import ApiClient from './ApiClient';

export const getSettings = () => {
  return ApiClient.get('/system-settings');
};

export const updateSettings = (settings) => {
  return ApiClient.put('/system-settings', settings);
};