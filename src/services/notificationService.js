import apiClient from './ApiClient';

export const getNotifications = (params) => {
  return apiClient.get('/notifications', { params });
};

export const markNotificationsAsRead = (notificationIds) => {
  return apiClient.post('/notifications/mark-read', { notificationIds });
};
export const getUnreadNotifications = () => {
  return apiClient.get('/notifications/unread');
};