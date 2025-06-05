import { defineStore } from 'pinia';

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isCollapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false,
  }),
  actions: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      localStorage.setItem('sidebarCollapsed', this.isCollapsed);
    },
  },
});