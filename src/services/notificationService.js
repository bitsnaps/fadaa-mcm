import apiClient from './ApiClient';

export const getNotifications = () => {
  return apiClient.get('/notifications');
};

export const markNotificationsAsRead = (notificationIds) => {
  return apiClient.post('/notifications/mark-read', { notificationIds });
};