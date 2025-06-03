import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
    userRole: localStorage.getItem('userRole') || null,
  }),
  actions: {
    login(role) {
      this.isAuthenticated = true;
      this.userRole = role;
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', role);
    },
    logout() {
      this.isAuthenticated = false;
      this.userRole = null;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
    },
  },
});