import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notification: null,
    unreadCount: 0,
    latestUnread: [],
  }),
  actions: {
    setNotification(notification) {
      this.notification = notification;
    },
    clearNotification() {
      this.notification = null;
    },
    setUnreadNotifications(data) {
      this.unreadCount = data.unreadCount;
      this.latestUnread = data.latestUnread;
    },
  },
});